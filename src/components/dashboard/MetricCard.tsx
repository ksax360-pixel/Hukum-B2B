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
        <h3 className={`mb-2 text-[12px] ${dark ? "text-gray-300" : "text-[#071D27]/55"}`}>{title}</h3>
        <p className={`text-[13px] font-bold leading-none ${dark ? "text-white" : "text-[#071D27]"}`}>{value}</p>
      </div>
      {Icon ? (
        <div
          className="flex h-[35px] w-[35px] shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: dark ? "#0075FF" : "#f3f4f6" }}
        >
          <Icon size={20} className={dark ? "text-white" : "text-[#071D27]"} />
        </div>
      ) : null}
    </div>
  );
}
