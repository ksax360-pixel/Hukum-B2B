"use client";

import Link from "next/link";
import { Building2, FileText, Globe, MessageSquare, Package, Quote, Search, Sparkles, Users } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
import { TicketOverview } from "@/components/dashboard/TicketOverview";
import { dashT } from "@/i18n/dash-copy";

const METRIC_ICONS = {
  building: Building2,
  products: Package,
  file: FileText,
  users: Users,
  globe: Globe,
  spark: Sparkles,
  quote: Quote,
  search: Search,
  messages: MessageSquare,
};

export type DashMetric = { title: string; value: string | number; icon?: keyof typeof METRIC_ICONS };
export type RankItem = { name: string; value: string; meta?: string };
export type RecentItem = { title: string; meta: string; href: string };
export type QuickAction = { title: string; href: string };

export function RankingGauge({
  title,
  caption,
  label,
  percent,
}: {
  title: string;
  caption: string;
  label: string;
  percent: number;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c * 0.62;
  return (
    <div id="cardColor" className="dash-panel flex h-full min-h-[18rem] flex-col items-center justify-center p-5">
      <p className="label-caps self-start">{title}</p>
      <p className="mb-2 self-start text-[10px] opacity-50">{caption}</p>
      <svg viewBox="0 0 140 110" className="h-36 w-full">
        <path d="M16 90 A54 54 0 1 1 124 90" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="12" strokeLinecap="round" />
        <path
          d="M16 90 A54 54 0 1 1 124 90"
          fill="none"
          stroke="#D21F1F"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${c * 0.62} ${c}`}
          strokeDashoffset={offset - c * 0.19}
        />
        <text x="70" y="72" textAnchor="middle" className="fill-current text-[18px] font-semibold">
          {clamped}%
        </text>
      </svg>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function RankingList({ title, caption, items }: { title: string; caption: string; items: RankItem[] }) {
  return (
    <div id="cardColor" className="dash-panel flex h-full min-h-[18rem] flex-col p-5">
      <p className="label-caps">{title}</p>
      <p className="mb-4 text-[10px] opacity-50">{caption}</p>
      <div className="space-y-3 overflow-auto">
        {items.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#071D27]/6 text-[10px] font-semibold">{i + 1}</span>
              <span className="truncate text-sm">{item.name}</span>
            </div>
            <span className="shrink-0 text-xs opacity-60">
              {item.value}
              {item.meta ? ` · ${item.meta}` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivityChart({ title, caption, series }: { title: string; caption: string; series: number[] }) {
  const max = Math.max(...series, 1);
  return (
    <div id="cardColor" className="dash-panel flex h-full min-h-[16rem] flex-col p-5">
      <p className="label-caps">{title}</p>
      <p className="mb-4 text-[10px] opacity-50">{caption}</p>
      <div className="dash-spark mt-auto">
        {series.map((n, i) => (
          <span key={i} style={{ height: `${Math.round((n / max) * 100)}%` }} />
        ))}
      </div>
    </div>
  );
}

export function PipelineCard({
  title,
  caption,
  items,
}: {
  title: string;
  caption: string;
  items: { label: string; value: number }[];
}) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  return (
    <div id="cardColor" className="dash-panel flex h-full min-h-[16rem] flex-col p-5">
      <p className="label-caps">{title}</p>
      <p className="mb-4 text-[10px] opacity-50">{caption}</p>
      <div className="mb-4 flex h-3 overflow-hidden rounded-full">
        {items.map((item) => (
          <span
            key={item.label}
            className="h-full first:rounded-s-full last:rounded-e-full"
            style={{
              width: `${(item.value / total) * 100}%`,
              background:
                item.label === items[0].label
                  ? "#071D27"
                  : item.label === items[1].label
                    ? "#D21F1F"
                    : item.label === items[2].label
                      ? "#6b7a80"
                      : "#c9cfd1",
            }}
          />
        ))}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[10px] uppercase tracking-[0.14em] opacity-50">{item.label}</p>
            <p className="text-lg font-semibold">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecentList({ title, items }: { title: string; items: RecentItem[] }) {
  return (
    <div id="cardColor" className="dash-panel flex h-full min-h-[18rem] flex-col p-5">
      <p className="label-caps mb-4">{title}</p>
      <div className="space-y-1">
        {items.length === 0 ? (
          <p className="text-sm opacity-50">No recent listings</p>
        ) : (
          items.map((item) => (
            <Link key={`${item.href}-${item.title}`} href={item.href} className="flex items-center justify-between gap-3 rounded-lg px-1 py-2 hover:bg-[#071D27]/[0.03]">
              <span className="text-sm">{item.title}</span>
              <span className="text-[11px] opacity-50">{item.meta}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export function QuickActions({ actions, locale = "en" }: { actions: QuickAction[]; locale?: string }) {
  return (
    <div id="cardColor" className="dash-panel p-5">
      <h2 className="mb-4 text-[13px] font-semibold">{dashT(locale, "Quick Action")}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Link key={action.href} href={action.href} className="dash-quick-btn flex h-12 items-center gap-3 rounded-xl px-4 text-[10px]">
            <span className="h-3 w-3 rounded-full bg-[#D21F1F]" />
            {action.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DashboardHome({
  locale,
  role,
  name,
  metrics,
  gauge,
  ranking,
  activity,
  pipeline,
  recent,
  actions,
}: {
  locale: string;
  role: "admin" | "vendor" | "buyer";
  name: string;
  metrics: DashMetric[];
  gauge: { title: string; caption: string; label: string; percent: number };
  ranking: { title: string; caption: string; items: RankItem[] };
  activity: { title: string; caption: string; series: number[] };
  pipeline: { title: string; caption: string; items: { label: string; value: number }[] };
  recent: { title: string; items: RecentItem[] };
  actions: QuickAction[];
}) {
  return (
    <>
      <div className="hidden lg:block space-y-4">
        <SetupChecklist locale={locale} role={role} />
        <div className="grid grid-cols-4 gap-4" data-onboarding="dashboard-metrics">
          {metrics.map((m) => (
            <MetricCard key={m.title} title={dashT(locale, m.title)} value={m.value} icon={m.icon ? METRIC_ICONS[m.icon] : undefined} />
          ))}
        </div>
        <div className="grid grid-cols-10 items-stretch gap-4">
          <div className="col-span-4 min-h-[18rem]">
            <WelcomeCard name={name} role={role} locale={locale} />
          </div>
          <div className="col-span-2 min-h-[18rem]">
            <RankingGauge title={dashT(locale, gauge.title)} caption={dashT(locale, gauge.caption)} label={dashT(locale, gauge.label)} percent={gauge.percent} />
          </div>
          <div className="col-span-4 min-h-[18rem]">
            <RankingList title={dashT(locale, ranking.title)} caption={dashT(locale, ranking.caption)} items={ranking.items} />
          </div>
        </div>
        <div className="grid grid-cols-2 items-stretch gap-4">
          <ActivityChart title={dashT(locale, activity.title)} caption={dashT(locale, activity.caption)} series={activity.series} />
          <PipelineCard
            title={dashT(locale, pipeline.title)}
            caption={dashT(locale, pipeline.caption)}
            items={pipeline.items.map((item) => ({ ...item, label: dashT(locale, item.label) }))}
          />
        </div>
        <div className="grid grid-cols-10 items-stretch gap-4">
          <div className="col-span-6 min-h-[18rem]">
            <RecentList
              title={dashT(locale, recent.title)}
              items={recent.items.map((item) => ({ ...item, meta: dashT(locale, item.meta) }))}
            />
          </div>
          <div className="col-span-4 min-h-[18rem]">
            <TicketOverview locale={locale} role={role} />
          </div>
        </div>
        <QuickActions locale={locale} actions={actions.map((action) => ({ ...action, title: dashT(locale, action.title) }))} />
      </div>

      <div className="space-y-4 lg:hidden">
        <WelcomeCard name={name} role={role} locale={locale} />
        <SetupChecklist locale={locale} role={role} />
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3" data-onboarding="dashboard-metrics">
          {metrics.map((m) => (
            <MetricCard key={m.title} title={dashT(locale, m.title)} value={m.value} icon={m.icon ? METRIC_ICONS[m.icon] : undefined} />
          ))}
        </div>
        <QuickActions locale={locale} actions={actions.map((action) => ({ ...action, title: dashT(locale, action.title) }))} />
        <RecentList
          title={dashT(locale, recent.title)}
          items={recent.items.map((item) => ({ ...item, meta: dashT(locale, item.meta) }))}
        />
        <TicketOverview locale={locale} role={role} />
      </div>
    </>
  );
}

