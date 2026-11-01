"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";

export function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon?: LucideIcon;
}) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const sync = () => setDark(document.documentElement.getAttribute("data-theme") === "dark");
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  return (
    <div
      id="cardColor"
      className="dash-metric-card flex h-[4.75rem] w-full items-center justify-between px-5"
    >
      <div className="flex flex-1 flex-col justify-center">
        <h3 className={`mb-2 text-[12px] ${dark ? "text-gray-300" : "text-[var(--hukum-muted)]"}`}>{title}</h3>
        <p className={`text-[13px] font-bold leading-none ${dark ? "text-white" : "text-[var(--hukum-ink)]"}`}>{value}</p>
      </div>
      {Icon ? (
        <div
          className="flex h-[35px] w-[35px] shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: dark ? "#0075FF" : "rgba(23, 99, 75, 0.1)" }}
        >
          <Icon size={20} className={dark ? "text-white" : "text-[var(--hukum-green)]"} />
        </div>
      ) : null}
    </div>
  );
}
