import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, type LegalSection } from '@/components/LegalPage';
import { CONTACT_UNLOCK_TURNS } from '@/lib/safety';
import { REPUTATION_RULES } from '@/lib/reputation';

export const metadata: Metadata = {
  title: 'Safety & Anti-Scam Guide',
  description: 'How to spot romance scams and investment fraud, why contact details unlock after a few messages, and how reporting works.',
};

const sections: LegalSection[] = [
  {
    title: 'Never send money',
    body: (
      <>
        <p>
          No genuine match needs your money. Block and report anyone who asks for cash, gift cards, mobile-wallet transfers
          (GCash, Maya, PromptPay...), loans, an &quot;allowance&quot;, or help with fees.
        </p>
        <p>Common emergency stories used by scammers:</p>
        <ul>
          <li>A sudden hospital bill, accident or sick relative.</li>
          <li>Plane tickets, visa, customs or &quot;release&quot; fees so they can visit you.</li>
          <li>A frozen bank account, lost wallet or stuck parcel.</li>
          <li>Rent, tuition or school fees due today.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Investment and crypto fraud ("pig butchering")',
    body: (
      <>
        <p>
          A match builds trust over days or weeks, then mentions an uncle, mentor or app that makes &quot;guaranteed&quot;
          daily profits in crypto, forex or USDT. Small early &quot;wins&quot; are fake and withdrawals never arrive.
        </p>
        <p>
          Anyone who brings up investing, trading platforms or crypto deposits on a dating app is almost certainly running
          a scam. Do not download apps or open links they send.
        </p>
      </>
    ),
  },
  {
    title: `Why contact details unlock after ${CONTACT_UNLOCK_TURNS} messages`,
    body: (
      <>
        <p>
          Phone numbers, emails, social handles and messaging apps (WhatsApp, Telegram, LINE, Instagram...) are hidden until{' '}
          <strong>both of you have sent {CONTACT_UNLOCK_TURNS} substantive messages</strong> (15+ characters each). Voice
          notes unlock at the same point.
        </p>
        <p>
          Scammers want to move you off the app quickly, where we can no longer warn you or remove them. A short
          conversation first protects you, and attempts to get around the filter (spelling numbers out, splitting words,
          symbols) are detected and count against the sender.
        </p>
      </>
    ),
  },
  {
    title: 'Verified badges',
    body: (
      <p>
        The verified badge means our team has checked a live selfie, taken while copying a random pose, against the
        member&apos;s profile photos. It lowers the risk of fake profiles but is not a background check, so keep following
        this guide.
      </p>
    ),
  },
  {
    title: 'How to report',
    body: (
      <>
        <p>
          Tap the shield icon in a chat, or the menu on a profile, and choose <strong>Report</strong>. You can also block the
          member so they can no longer contact you. Reports are confidential: the other member is not told who reported them.
        </p>
        <p>Our team reviews reports and quarantined messages and acts on confirmed violations.</p>
      </>
    ),
  },
  {
    title: 'The Reputation Engine',
    body: (
      <>
        <p>Every member starts at 100. Scores go down for behaviour that puts others at risk, for example:</p>
        <ul>
          <li>Scam, solicitation or explicit-request messages: -{REPUTATION_RULES.highSeverity}, and the message is held for review.</li>
          <li>Trying to sneak contact details past the filter: -{REPUTATION_RULES.contactEvasion}.</li>
          <li>A report confirmed by our team: -{REPUTATION_RULES.confirmedReport}.</li>
          <li>A held message confirmed as a violation: a further -{REPUTATION_RULES.quarantineConfirmed}.</li>
        </ul>
        <p>
          Below {REPUTATION_RULES.restrictedBelow}, an account is <strong>under review</strong>: it can send at most{' '}
          {REPUTATION_RULES.restrictedMessagesPerHour} messages an hour and no voice notes, and its badge shows &quot;Low Rep
          / Under Review&quot;. Scores recover by {REPUTATION_RULES.dailyRecovery} point a day of friendly, unflagged
          conversation.
        </p>
      </>
    ),
  },
  {
    title: 'Meeting in person',
    body: (
      <ul>
        <li>Video call first. Someone who always has an excuse not to is a red flag.</li>
        <li>Meet in a busy public place and arrange your own transport.</li>
        <li>Tell a friend where you are going and who you are meeting.</li>
        <li>If you feel unsafe at any point, leave and contact local emergency services.</li>
      </ul>
    ),
  },
  {
    title: 'More',
    body: (
      <p>
        Read our <Link href="/terms">Terms of Service</Link>, <Link href="/privacy">Privacy Policy</Link> and{' '}
        <Link href="/standards">Community Guidelines</Link>.
      </p>
    ),
  },
];

export default function SafetyPage() {
  return (
    <LegalPage
      eyebrow="Community Safety"
      title="Safety & Anti-Scam Guide"
      updated="November 2026"
      intro={
        <p>
          Most members are here for something real. This guide helps you spot the few who are not, and explains how Asians
          in Love protects you.
        </p>
      }
      sections={sections}
    />
  );
}
