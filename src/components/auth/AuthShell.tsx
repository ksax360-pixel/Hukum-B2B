"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";

export function AuthShell({
  children,
  wide = false,
  locale = "en",
}: {
  children: ReactNode;
  wide?: boolean;
  locale?: string;
}) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.classList.add("kt-public");
    document.documentElement.style.backgroundColor = "#ffffff";
    document.documentElement.style.colorScheme = "light";
    document.body.style.backgroundColor = "#ffffff";
    document.body.style.color = "#071D27";
  }, []);

  return (
    <div className="auth-stage">
      <div className="auth-dot-field" aria-hidden />
      <div className="auth-stage-inner">
        <div className={`auth-glass ${wide ? "auth-glass-wide" : ""}`}>
          <Link href={`/${locale}`} className="mb-8 flex justify-center" aria-label="Hukum">
            <BrandMark size={64} />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
