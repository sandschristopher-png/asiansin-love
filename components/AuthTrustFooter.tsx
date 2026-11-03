import React from 'react';
import { Lock, ShieldCheck, UserX } from 'lucide-react';

const ASSURANCES = [
  {
    Icon: Lock,
    title: 'Private & Secure',
    text: 'Your activity is 100% confidential. We will never post to Google or external accounts.',
  },
  {
    Icon: ShieldCheck,
    title: 'Display Name Privacy',
    text: 'Real names are never displayed publicly. You choose your profile handle.',
  },
  {
    Icon: UserX,
    title: 'Strict Community Integrity',
    text: 'Duplicate, automated, or commercial accounts are permanently banned.',
  },
];

/** Trust assurances shown under the login / signup submit button. */
export function AuthTrustFooter() {
  return (
    <ul className="space-y-2.5 rounded-2xl bg-[#F9F8FC] border border-[#ECE8F4] p-3.5 text-left">
      {ASSURANCES.map(({ Icon, title, text }) => (
        <li key={title} className="flex items-start gap-2.5">
          <Icon className="w-4 h-4 text-[#6555B8] shrink-0 mt-px" aria-hidden />
          <p className="text-[11.5px] leading-relaxed text-[#524B5E]">
            <span className="font-bold text-[#1C1924]">{title}:</span> {text}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default AuthTrustFooter;
