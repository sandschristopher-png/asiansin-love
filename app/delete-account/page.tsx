import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, type LegalSection } from '@/components/LegalPage';
import { DeleteAccountActions } from '@/components/DeleteAccountActions';
import { SUPPORT_EMAIL, SUPPORT_RESPONSE_EN } from '@/lib/support';
import { SITE_URL } from '@/lib/seo/cityData';

const TITLE = 'Delete Your Account | Meet in Asia';
const DESCRIPTION =
  'How to delete your Meet in Asia account and data, from the app or by email, what is removed, and what we may keep.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/delete-account` },
  robots: { index: true, follow: true },
};

/**
 * Public account-deletion page (no sign-in needed to read it): the address Google Play's Data safety form asks for.
 * It describes what /api/account/delete and the delete_user_account() function actually do; keep them in step.
 */
const sections: LegalSection[] = [
  {
    id: 'in-app',
    title: 'Delete your account in the app',
    body: (
      <>
      <ol className="list-decimal space-y-1 pl-4">
        <li>Open Meet in Asia on the website or in the Android app and sign in.</li>
        <li>
          Tap your avatar at the top right, choose <strong>Settings</strong>, then <strong>Delete Account</strong>.
        </li>
        <li>Read the summary, type the confirmation word, and confirm.</li>
      </ol>
      <DeleteAccountActions />
      </>
    ),
  },
  {
    id: 'by-email',
    title: 'Cannot sign in? Ask us to delete it',
    body: (
      <>
        <p>
          Email <a href={`mailto:${SUPPORT_EMAIL}?subject=Delete%20my%20account`}>{SUPPORT_EMAIL}</a> from the address you
          signed up with, with the subject &ldquo;Delete my account&rdquo;. We will confirm it is you and delete the account.
        </p>
        <p>{SUPPORT_RESPONSE_EN}</p>
      </>
    ),
  },
  {
    id: 'what-is-deleted',
    title: 'What is deleted',
    body: (
      <ul>
        <li>Your profile: username, bio, interests, languages, location and the other details you added.</li>
        <li>Your messages and the rest of the data tied to your account.</li>
        <li>Your profile photos, voice intro and voice notes, and your verification selfies, removed from storage.</li>
        <li>Your sign-in. You are signed out at once and the account cannot be reopened.</li>
      </ul>
    ),
  },
  {
    id: 'what-is-kept',
    title: 'What we may keep',
    body: (
      <>
        <p>
          Limited records, such as moderation and payment records, where the law requires it or to stop banned scammers from
          returning. They are kept only for as long as that reason applies and are not used for anything else.
        </p>
        <p>
          Messages you sent are removed from your account, but a report that quoted them stays with the safety team that
          reviewed it.
        </p>
      </>
    ),
  },
  {
    id: 'plus',
    title: 'If you have Meet in Asia Plus',
    body: (
      <p>
        Deleting your account does not cancel a Plus subscription bought through Google Play. Cancel it first in Google Play
        under Payments &amp; subscriptions, or you will keep being billed. Deleting does not refund a period you already paid
        for. See the <Link href="/terms#refunds">Refund Policy</Link> and <Link href="/terms#cancellation">Cancellation</Link>.
      </p>
    ),
  },
  {
    id: 'just-some',
    title: 'Want to remove only some data?',
    body: (
      <p>
        You can edit or remove most profile details, photos and your voice intro at any time from your profile, and hide your
        profile or your active status in Settings, without deleting the account. More in our{' '}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
];

export default function DeleteAccountPage() {
  return (
    <LegalPage
      eyebrow="Privacy & Security"
      title="Delete your account"
      updated="November 2026"
      intro={
        <p>
          You can delete your Meet in Asia account and its data yourself, any time, or ask us to do it. This page covers the
          Android app and the website.
        </p>
      }
      sections={sections}
    />
  );
}
