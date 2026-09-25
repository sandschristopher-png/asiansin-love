'use client';

import React from 'react';

export default function TermsOfUsePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-28 space-y-6">
      
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Terms of Use
        </h1>
        <p className="text-xs sm:text-sm text-[#DDD8D4]">
          Agreement terms for accessing asiansin.love.
        </p>
      </div>

      <div className="rounded-3xl bg-[#241E2F] border border-[#725A7A]/35 p-6 sm:p-8 space-y-5 shadow-xl text-sm leading-relaxed text-[#DDD8D4]">
        <p>
          By creating an account on asiansin.love, you confirm that you are at least 18 years of age and seeking authentic interpersonal courtship.
        </p>
        
        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider pt-2">
          Non-Agency Platform Notice
        </h3>
        <p>
          asiansin.love operates strictly as an independent communications service connecting adult individuals. We are not an international marriage broker, catalog agency, or legal immigration representative. All users are personally responsible for conducting their own diligence and exercising caution before meeting in person.
        </p>

        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider pt-2">
          Prohibited Conduct
        </h3>
        <p>
          Users must not utilize automated bots, scrape member photos, distribute unsolicited advertisements, or engage in deceptive romance fraud. Violations result in permanent hardware, IP, and account bans.
        </p>
      </div>

    </main>
  );
}