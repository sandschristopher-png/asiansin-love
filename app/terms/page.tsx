import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, type LegalSection } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The rules for using Meet in Asia (Meet in Asia): eligibility, conduct, content, Plus billing and cancellation.',
};

const sections: LegalSection[] = [
  {
    title: 'Who can use Meet in Asia',
    body: (
      <>
        <p>
          You must be <strong>at least 18 years old</strong> (or the age of majority where you live, if higher) to create an
          account. By signing up you confirm that you meet this requirement, that the information in your profile is true, and
          that you are legally allowed to use a dating service in your country.
        </p>
        <p>One person, one account. Accounts may not be shared, sold or transferred.</p>
      </>
    ),
  },
  {
    title: 'What is not allowed',
    body: (
      <>
        <p>Meet in Asia is for people looking for genuine relationships. The following are banned and lead to removal:</p>
        <ul>
          <li>Commercial solicitation of any kind, including advertising, selling content or recruiting.</li>
          <li>Sex work, escort services, &quot;bar fine&quot; or pay-per-meet arrangements, and requests for explicit photos.</li>
          <li>
            Asking for, offering or sending money, gift cards, mobile-wallet transfers (GCash, Maya, PromptPay and similar),
            loans, &quot;allowances&quot; or travel money.
          </li>
          <li>Romance scams, investment or crypto schemes, and any attempt to move members to outside platforms to defraud them.</li>
          <li>Harassment, hate speech, threats, impersonation, fake profiles and photos that are not you.</li>
        </ul>
        <p>
          Messages are screened automatically. Content that breaks these rules can be quarantined for review and lowers your
          reputation score; serious or repeated violations lead to suspension or permanent removal. See our{' '}
          <Link href="/safety">Safety &amp; Anti-Scam Guide</Link>.
        </p>
      </>
    ),
  },
  {
    title: 'Your content',
    body: (
      <>
        <p>
          You keep ownership of the photos, text and voice recordings you post. You give Meet in Asia a worldwide,
          non-exclusive, royalty-free license to host, store, display and process that content only to run, secure and
          improve the service (for example, showing your profile to other members or screening messages for scams). This
          license ends when you delete the content or your account, except where we must keep records for legal or safety
          reasons.
        </p>
        <p>You are responsible for what you post and must have the right to share it.</p>
      </>
    ),
  },
  {
    title: 'Verification and reputation',
    body: (
      <p>
        The verified badge is granted only after our team reviews your verification selfie. Automated checks help us
        prioritise reviews but never grant the badge on their own. Reputation scores reflect how members use the service
        and may limit features (such as messaging rate or voice notes) while an account is under review.
      </p>
    ),
  },
  {
    title: 'Plus subscriptions and billing',
    body: (
      <>
        <p>Plus is an optional paid membership, billed in US dollars through Stripe:</p>
        <ul>
          <li>Monthly: $14.99 per month, billed every month.</li>
          <li>3 months: $29.99 every 3 months ($9.99 per month).</li>
          <li>6 months: $47.99 every 6 months ($7.99 per month).</li>
        </ul>
        <p>
          Subscriptions <strong>renew automatically</strong> at the end of each period until you cancel. Taxes may apply.
          Prices can change; any change applies from your next renewal and we will tell you before it does.
        </p>
        <p>
          <strong>Cancel anytime</strong> in Settings → Manage Subscription, which opens the Stripe billing portal where you
          can cancel or update your payment method yourself. Cancelling stops future renewals; you keep Plus until the end of
          the period you already paid for. Payments are non-refundable except where the law requires otherwise. Deleting your
          account also cancels any active subscription.
        </p>
      </>
    ),
  },
  {
    title: 'Safety and your responsibility',
    body: (
      <p>
        We work hard to keep scammers out, but we cannot run background checks or guarantee how other members behave online
        or in person. Use caution when you meet anyone, never send money, and report anything suspicious.
      </p>
    ),
  },
  {
    title: 'Disclaimers and limitation of liability',
    body: (
      <>
        <p>
          The service is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any kind, to the
          extent the law allows. We do not promise that you will find a match or that the service will be uninterrupted or
          error-free.
        </p>
        <p>
          To the fullest extent permitted by law, Meet in Asia is not liable for indirect, incidental or consequential
          damages, or for the conduct of any member on or off the service. Our total liability for any claim is limited to
          the amount you paid us in the 12 months before the claim. Nothing in these terms limits rights you have under
          consumer laws that cannot be waived.
        </p>
      </>
    ),
  },
  {
    title: 'Ending your account',
    body: (
      <p>
        You can delete your account at any time in Settings. We may suspend or remove accounts that break these terms or put
        other members at risk.
      </p>
    ),
  },
  {
    title: 'Changes to these terms',
    body: (
      <p>
        We may update these terms. If a change is significant we will let you know in the app. Continuing to use Asians in
        Love after a change means you accept the updated terms. Read how we handle your data in our{' '}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      updated="November 2026"
      intro={
        <p>
          These terms are an agreement between you and Meet in Asia (Meet in Asia). By creating an account or using the
          service, you agree to them.
        </p>
      }
      sections={sections}
    />
  );
}
