/**
 * The Plus checkout switch.
 *
 * NEXT_PUBLIC_PLUS_CHECKOUT_ENABLED=true opens the checkout buttons on /plus and in the upgrade sheet. Unset, empty
 * or any other value (including "TRUE" or " true") keeps them on "Coming soon": the plans, billing terms and legal
 * links stay fully visible either way, only the final buy button is disabled.
 *
 * It is a NEXT_PUBLIC_ variable, so it is read when the app is built: changing it needs a redeploy.
 */
export function plusCheckoutEnabled(value: string | undefined): boolean {
  return value === 'true';
}

export const PLUS_CHECKOUT_ENABLED = plusCheckoutEnabled(process.env.NEXT_PUBLIC_PLUS_CHECKOUT_ENABLED);
