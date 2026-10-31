/**
 * Hukum risk register — loopholes and fixes (audit findings).
 */

export type RiskSeverity = "critical" | "high" | "medium";

export type RiskFinding = {
  id: string;
  severity: RiskSeverity;
  loophole: string;
  impact: string;
  fix: string;
  status: "fixed" | "mitigated" | "planned";
  controls: string[];
};

export const RISK_REGISTER: RiskFinding[] = [
  {
    id: "C1",
    severity: "critical",
    loophole: "WhatsApp agent shares numbers without sign-up",
    impact: "Directory scraped, gate bypassed",
    fix: "WA/session identity, consent-first, daily caps, log every reveal; relay only",
    status: "fixed",
    controls: [
      "contact-gate",
      "hukum-relay",
      "reveal-audit",
      "daily-caps",
      "always-strip SSR+API contacts",
    ],
  },
  {
    id: "C2",
    severity: "critical",
    loophole: "Deals move off-platform after first contact",
    impact: "Suppliers can't see value; renewals fall",
    fix: "First contact through Hukum relay; leads-from-Hukum proof in supplier dashboard",
    status: "fixed",
    controls: ["hukum-relay", "Enquiry hukum_relay", "Lead from Hukum CRM", "hukum_lead notifications"],
  },
  {
    id: "C3",
    severity: "critical",
    loophole: "Fake logos, inflated counts, Verified demo vendors",
    impact: "Investor and legal risk",
    fix: "Live counts only; badges only after real admin verification",
    status: "fixed",
    controls: [
      "live-counts",
      "live vendor marquee",
      "no seller self-verify/feature",
      "verificationStatus===verified",
    ],
  },
  {
    id: "H1",
    severity: "high",
    loophole: "AI invents suppliers, prices, or numbers",
    impact: "Wrong decisions, liability",
    fix: "Database-only facts, show source, human handover",
    status: "mitigated",
    controls: ["assertGroundedProducts", "escalation", "support handover"],
  },
  {
    id: "H2",
    severity: "high",
    loophole: "Paid priority not disclosed in AI ranking",
    impact: "Trust and advertising-disclosure risk",
    fix: "Featured / Sponsored label; fair rotation rules",
    status: "fixed",
    controls: ["paidPriority label", "Featured chip on cards"],
  },
  {
    id: "H3",
    severity: "high",
    loophole: "Regulated products listed without licenses",
    impact: "Regulatory and safety risk",
    fix: "License check per category; restricted keywords",
    status: "fixed",
    controls: ["restricted-goods", "category rules", "licenseNumber schema", "escalate holds publish"],
  },
  {
    id: "H4",
    severity: "high",
    loophole: "Fake buyers harvesting supplier contacts",
    impact: "Supplier trust erosion",
    fix: "Verified-buyer status, reveal limits, report and block",
    status: "mitigated",
    controls: ["buyerVerified caps", "inbox block/report UI", "OTP", "always-strip contacts"],
  },
  {
    id: "H5",
    severity: "high",
    loophole: "WhatsApp and AI costs grow with usage",
    impact: "Margin squeeze",
    fix: "Cost per conversation; caps; template discipline",
    status: "fixed",
    controls: ["cost-caps", "durable wa-cost ledger", "admin/costs"],
  },
  {
    id: "M1",
    severity: "medium",
    loophole: "Data hosted or processed outside Saudi Arabia",
    impact: "Lost enterprise deals, PDPL risk",
    fix: "Saudi-region core hosting; transfer assessments",
    status: "mitigated",
    controls: ["DATA_REGION env", "privacy policy disclosure", "transfer assessment copy"],
  },
  {
    id: "M2",
    severity: "medium",
    loophole: "OTP SMS pumping and account takeover",
    impact: "Abuse / ATO",
    fix: "Rate limits, bot checks, device signals",
    status: "mitigated",
    controls: ["otp-limiter phone+IP", "hide demo OTP in prod"],
  },
  {
    id: "M3",
    severity: "medium",
    loophole: "Placeholder legal pages; broken product data",
    impact: "Compliance gap",
    fix: "Counsel-ready terms scaffold; data integrity checks",
    status: "mitigated",
    controls: ["terms/privacy/marketplace-rules", "restricted publish"],
  },
  {
    id: "M4",
    severity: "medium",
    loophole: "Single sign-in option (Google)",
    impact: "Enterprise buyers blocked",
    fix: "Microsoft and mobile OTP",
    status: "fixed",
    controls: ["oauth google+microsoft", "auth mobile OTP"],
  },
];
