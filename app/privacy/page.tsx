import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, type LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy - Asians in Love',
  description: 'What Asians in Love collects, how verification selfies and voice notes are protected, and how to delete your data.',
};

const sections: LegalSection[] = [
  {
    title: 'What we collect',
    body: (
      <ul>
        <li>
          <strong>Account and profile:</strong> email, username, age or birth date, gender and preferences, city and country,
          bio, interests, languages and the other details you add.
        </li>
        <li>
          <strong>Photos and voice:</strong> profile photos, your voice intro, and voice notes you send in chat.
        </li>
        <li>
          <strong>Verification selfies:</strong> the live selfie you take when you request the verified badge.
        </li>
        <li>
          <strong>Messages and activity:</strong> chats, sparks, favourites, reports and blocks, and when you were last
          active (you can hide your active status in Settings).
        </li>
        <li>
          <strong>Location:</strong> the city you enter and, only if you allow it, your device location to confirm it.
          Other members only ever see an approximate location.
        </li>
        <li>
          <strong>Payments:</strong> handled by Stripe. We receive your subscription status, never your full card number.
        </li>
      </ul>
    ),
  },
  {
    title: 'How we use it',
    body: (
      <ul>
        <li>To show your profile, match you with members and deliver your messages.</li>
        <li>
          To keep members safe: automated screening of messages and bios for scams, solicitation and contact details, the
          reputation system, and review of reports.
        </li>
        <li>To provide Plus features and process subscriptions.</li>
        <li>To send the notifications you turn on.</li>
      </ul>
    ),
  },
  {
    title: 'Verification selfies (biometric data)',
    body: (
      <>
        <p>
          Your verification selfie is used <strong>solely to confirm that you are the person in your profile photos</strong>.
          It is never shown on your profile or to other members, and never used for advertising.
        </p>
        <p>
          Selfies are stored in an <strong>encrypted, private storage bucket</strong> that only our review team can open,
          through short-lived links. An automated AI check (Google Gemini, acting as our service provider) compares the
          selfie with your main photo to help our team; a human always makes the final decision.
        </p>
        <p>
          We <strong>never sell, lease or share your verification selfies with third parties</strong> for their own purposes.
          Your selfie is deleted when you delete your account.
        </p>
      </>
    ),
  },
  {
    title: 'Who we share data with',
    body: (
      <>
        <p>We do not sell your personal data. We share it only with service providers that help us run Asians in Love:</p>
        <ul>
          <li>Supabase: database, authentication and file storage.</li>
          <li>Vercel: hosting.</li>
          <li>Stripe: payments and the billing portal.</li>
          <li>Google (Gemini): verification pre-screening and the optional in-chat Translate feature.</li>
        </ul>
        <p>We may also disclose information when the law requires it or to protect members from serious harm or fraud.</p>
      </>
    ),
  },
  {
    title: 'What other members see',
    body: (
      <p>
        Your public profile (photos, username, age, approximate location, bio, interests, voice intro, badges and reputation
        tier). Contact details shared in chat stay hidden until both of you have exchanged a few messages. Messages and voice
        notes are visible only to you and the person you are talking to, and to our safety team when a message is flagged
        or reported.
      </p>
    ),
  },
  {
    title: 'Deleting your account and data',
    body: (
      <>
        <p>
          Go to <strong>Settings → Delete Account</strong> and confirm. This cancels any active Plus subscription, deletes your
          profile and messages, and removes your photos, voice recordings and verification selfies from storage.
        </p>
        <p>
          We may keep limited records (such as moderation and payment records) where the law requires it or to stop banned
          scammers from returning. You can also edit or remove most profile details at any time from your profile.
        </p>
      </>
    ),
  },
  {
    title: 'Security',
    body: (
      <p>
        Data is encrypted in transit, private files are served only through short-lived signed links, and access to member
        data is limited to the team members who need it. No service is perfectly secure, so please use a strong, unique
        password.
      </p>
    ),
  },
  {
    title: 'Your rights and contact',
    body: (
      <p>
        Depending on where you live you may have the right to access, correct, export or delete your data, or to object to
        some processing. To make a request or ask a question, use the Feedback option in the app. See also our{' '}
        <Link href="/terms">Terms of Service</Link> and <Link href="/safety">Safety Guide</Link>.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Privacy & Security"
      title="Privacy Policy"
      updated="November 2026"
      intro={
        <p>
          Your privacy matters on a dating app. This policy explains what Asians in Love collects, why, and the control you
          have over it.
        </p>
      }
      sections={sections}
    />
  );
}
