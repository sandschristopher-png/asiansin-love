// Server only: the Google Play Developer API calls that check a purchase token and settle it (acknowledge or consume).
// Authenticates as a Google Cloud service account that has been invited in Play Console > Users and permissions with the
// "View financial data" and "Manage orders and subscriptions" permissions. The key is read from the environment, never
// bundled: GOOGLE_PLAY_SERVICE_ACCOUNT_JSON holds the service account's JSON key (plain JSON or base64 of it).
import { createSign } from 'node:crypto';
import { PLAY_PACKAGE_NAME, type ProductPurchase, type SubscriptionPurchaseV2 } from '@/lib/billing/googlePlay';

type ServiceAccount = { client_email: string; private_key: string };

const SCOPE = 'https://www.googleapis.com/auth/androidpublisher';
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PLAY_PACKAGE_NAME}`;

export function readServiceAccount(env: Record<string, string | undefined> = process.env): ServiceAccount | null {
  const raw = (env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || '').trim();
  if (!raw) return null;
  const text = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  try {
    const parsed = JSON.parse(text) as Partial<ServiceAccount>;
    if (typeof parsed.client_email === 'string' && typeof parsed.private_key === 'string') {
      return { client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, '\n') };
    }
  } catch {
    // unreadable key: treated as not configured
  }
  return null;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

const b64url = (input: Buffer | string) => Buffer.from(input).toString('base64url');

async function accessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) return cachedToken.value;
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({ iss: account.client_email, scope: SCOPE, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })
  );
  const signature = createSign('RSA-SHA256').update(`${header}.${claims}`).sign(account.private_key);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${claims}.${b64url(signature)}` }),
  });
  if (!res.ok) throw new Error(`Google token request failed (${res.status})`);
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error('Google token request returned no token');
  cachedToken = { value: json.access_token, expiresAt: now + (json.expires_in ?? 3600) };
  return json.access_token;
}

export type PlayResult<T> = { ok: true; body: T } | { ok: false; status: number };

async function call<T>(account: ServiceAccount, path: string, method: 'GET' | 'POST'): Promise<PlayResult<T>> {
  const token = await accessToken(account);
  const res = await fetch(`${API}/${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(method === 'POST' ? { 'content-type': 'application/json' } : {}) },
    body: method === 'POST' ? '{}' : undefined,
  });
  if (!res.ok) return { ok: false, status: res.status };
  const text = await res.text();
  return { ok: true, body: (text ? JSON.parse(text) : {}) as T };
}

const enc = encodeURIComponent;

export const getSubscription = (a: ServiceAccount, token: string) => call<SubscriptionPurchaseV2>(a, `purchases/subscriptionsv2/tokens/${enc(token)}`, 'GET');
export const getProductPurchase = (a: ServiceAccount, productId: string, token: string) =>
  call<ProductPurchase>(a, `purchases/products/${enc(productId)}/tokens/${enc(token)}`, 'GET');
export const acknowledgeSubscription = (a: ServiceAccount, productId: string, token: string) =>
  call<Record<string, never>>(a, `purchases/subscriptions/${enc(productId)}/tokens/${enc(token)}:acknowledge`, 'POST');
export const consumeProduct = (a: ServiceAccount, productId: string, token: string) =>
  call<Record<string, never>>(a, `purchases/products/${enc(productId)}/tokens/${enc(token)}:consume`, 'POST');
