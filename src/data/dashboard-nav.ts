import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  Cloud,
  CreditCard,
  FileText,
  FolderOpen,
  History,
  MessageSquare,
  Package,
  Quote,
  Settings,
  Sparkles,
  Bookmark,
  Users,
  LayoutDashboard,
  Shield,
  Ticket,
} from "lucide-react";

export type DashNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  onboarding?: string;
};

const ICONS: Record<string, LucideIcon> = {
  "/buyer/dashboard": Cloud,
  "/buyer/rfqs": FileText,
  "/buyer/quotations": Quote,
  "/buyer/saved": Bookmark,
  "/buyer/history": History,
  "/buyer/messages": MessageSquare,
  "/buyer/organization": Users,
  "/buyer/settings": Settings,
  "/vendor/dashboard": Cloud,
  "/vendor/company": Building2,
  "/vendor/products": Package,
  "/vendor/ai-upload": Sparkles,
  "/vendor/rfqs": FileText,
  "/vendor/quotations": Quote,
  "/vendor/analytics": BarChart3,
  "/vendor/documents": FolderOpen,
  "/vendor/subscription": CreditCard,
  "/vendor/settings": Settings,
  "/admin": LayoutDashboard,
  "/admin/analytics": BarChart3,
  "/admin/vendors": Building2,
  "/admin/products": Package,
  "/admin/categories": FolderOpen,
  "/admin/rfqs": FileText,
  "/admin/content": FileText,
  "/admin/seo": Shield,
  "/admin/ai": Sparkles,
  "/admin/audit": Shield,
  "/admin/health": Shield,
  "/admin/settings": Settings,
  "/admin/tickets": Ticket,
  "/vendor/tickets": Ticket,
  "/buyer/tickets": Ticket,
};

const ONBOARDING: Record<string, string> = {
  "/buyer/dashboard": "dashboard-link",
  "/buyer/rfqs": "rfqs",
  "/buyer/quotations": "quotations",
  "/buyer/saved": "saved",
  "/buyer/history": "history",
  "/buyer/messages": "messages",
  "/buyer/organization": "organization",
  "/buyer/settings": "settings",
  "/vendor/dashboard": "dashboard-link",
  "/vendor/company": "company",
  "/vendor/products": "products",
  "/vendor/ai-upload": "ai-upload",
  "/vendor/rfqs": "rfqs",
  "/vendor/analytics": "analytics",
  "/vendor/settings": "settings",
  "/admin/tickets": "tickets",
  "/vendor/tickets": "tickets",
  "/buyer/tickets": "tickets",
};

export function withTickets(
  nav: { href: string; label: string }[],
  role: "admin" | "vendor" | "buyer",
) {
  const href = `/${role}/tickets`;
  if (nav.some((item) => item.href.includes("/tickets"))) return nav;
  return [...nav, { href, label: "Ticket system" }];
}

export function enrichNav(nav: { href: string; label: string }[]): DashNavItem[] {
  return nav.map((item) => ({
    ...item,
    icon: ICONS[item.href] || Cloud,
    onboarding: ONBOARDING[item.href],
  }));
}

export function segmentNav(items: DashNavItem[]): DashNavItem[][] {
  const groups: DashNavItem[][] = [];
  let current: DashNavItem[] = [];
  const breaks = new Set([
    "/buyer/rfqs",
    "/buyer/organization",
    "/vendor/company",
    "/vendor/rfqs",
    "/vendor/documents",
    "/admin/analytics",
    "/admin/vendors",
    "/admin/settings",
    "/admin/tickets",
    "/vendor/tickets",
    "/buyer/tickets",
  ]);
  for (const item of items) {
    if (breaks.has(item.href) && current.length) {
      groups.push(current);
      current = [];
    }
    current.push(item);
  }
  if (current.length) groups.push(current);
  return groups;
}
