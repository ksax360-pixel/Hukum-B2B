"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export function WelcomeCard({
  name,
  role,
  locale,
}: {
  name: string;
  role: "buyer" | "vendor" | "admin";
  locale: string;
}) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const sync = () => setDark(document.documentElement.getAttribute("data-theme") === "dark");
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const href =
    role === "vendor"
      ? `/${locale}/vendor/company`
      : role === "buyer"
        ? `/${locale}/buyer/organization`
        : `/${locale}/admin/settings`;
  const bgSrc = dark ? "/dash/braden-collum.png" : "/dash/Light.gif";

  return (
    <div
      data-onboarding="dashboard"
      className="welcome-card relative flex h-full min-h-[18rem] w-full flex-col overflow-hidden rounded-[12px] p-5"
      style={{ backgroundColor: dark ? "#060C29" : "#ffffff" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={bgSrc} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
      <div className="relative z-10 flex flex-1 flex-col justify-between">
        <div>
          <p className={`label-caps mb-2 ${dark ? "text-gray-300" : "text-[#6b7a80]"}`}>{locale === "ar" ? "مرحباً بعودتك" : "Welcome back"}</p>
          <h2 className={`mb-1 text-lg font-medium tracking-tight ${dark ? "text-white" : "text-[#071D27]"}`}>{name}</h2>
          <p className={`text-sm ${dark ? "text-gray-400" : "text-[#9a9a9a]"}`}>{locale === "ar" ? "سعداء بلقائك مجدداً" : "Glad to see you again!"}</p>
        </div>
        <Link
          href={href}
          className={`flex w-fit items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
            dark ? "border border-white/10 bg-white/10 text-white" : "border border-[#071D27]/10 bg-white/90 text-[#6b7a80]"
          }`}
        >
          {locale === "ar" ? "عرض الملف" : "View Profile"}
          <ArrowRight size={16} className={locale === "ar" ? "rotate-180" : undefined} />
        </Link>
      </div>
    </div>
  );
}
