/** Capture marketing / referral attribution for signup (Discover → Register). */

export type Acquisition = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  ref?: string;
  landingPath?: string;
  capturedAt?: string;
};

const KEY = "kt_acquisition_v1";

export function captureAcquisitionFromUrl(search?: string, path?: string): Acquisition {
  if (typeof window === "undefined" && !search) return {};
  const qs = new URLSearchParams(search || (typeof window !== "undefined" ? window.location.search : ""));
  const acq: Acquisition = {
    source: qs.get("utm_source") || qs.get("source") || undefined,
    medium: qs.get("utm_medium") || undefined,
    campaign: qs.get("utm_campaign") || undefined,
    content: qs.get("utm_content") || undefined,
    term: qs.get("utm_term") || undefined,
    ref: qs.get("ref") || qs.get("referral") || undefined,
    landingPath: path || (typeof window !== "undefined" ? window.location.pathname : undefined),
    capturedAt: new Date().toISOString(),
  };
  const has = Object.values(acq).some((v) => v && v !== acq.capturedAt && v !== acq.landingPath);
  if (has || acq.ref) {
    try {
      localStorage.setItem(KEY, JSON.stringify(acq));
    } catch {
      /* ignore */
    }
  }
  return acq;
}

export function readAcquisition(): Acquisition {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return captureAcquisitionFromUrl();
    return { ...JSON.parse(raw), ...captureAcquisitionFromUrl() };
  } catch {
    return captureAcquisitionFromUrl();
  }
}

export function acquisitionMeta(acq?: Acquisition | null) {
  if (!acq) return undefined;
  const clean = Object.fromEntries(
    Object.entries(acq).filter(([, v]) => v != null && String(v).trim() !== "")
  );
  return Object.keys(clean).length ? clean : undefined;
}
