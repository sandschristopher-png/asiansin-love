import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, type LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'How to reach the Asians in Love team for support, safety reports and privacy requests.',
};

const SUPPORT_EMAIL = 'support@asiansin.love';

const sections: LegalSection[] = [
  {
    title: 'Support',
    body: (
      <p>
        Questions about your account, verification or Plus: email{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Include the email you signed up with so we can find your
        account.
      </p>
    ),
  },
  {
    title: 'Safety reports',
    body: (
      <p>
        To report a member, use the report button on their profile or in the chat: it reaches our moderators fastest and
        keeps the conversation as evidence. See the <Link href="/safety">Safety Guide</Link> for what to watch for.
      </p>
    ),
  },
  {
    title: 'Privacy requests',
    body: (
      <p>
        To access or delete your data, email {SUPPORT_EMAIL} or delete your account in Settings. The{' '}
        <Link href="/privacy">Privacy Policy</Link> explains what we keep and for how long.
      </p>
    ),
  },
];

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="Contact"
      title="Contact Us"
      updated="November 2026"
      intro={<p>We read every message. Here is the quickest way to reach us for each kind of request.</p>}
      sections={sections}
    />
  );
}
