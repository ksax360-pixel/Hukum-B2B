"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  consumeTourReplay,
  getTourTarget,
  getWorkspaceTourSteps,
  markTourCompleted,
  markTourSkipped,
  resetTour,
  saveTourState,
  shouldAutoStartTour,
  type TourStep,
  type TourUser,
} from "@/lib/product-tour";

type Ctx = { startTour: (opts?: { force?: boolean }) => void; isActive: boolean };

const OnboardingTourContext = createContext<Ctx>({ startTour: () => {}, isActive: false });

export function useOnboardingTour() {
  return useContext(OnboardingTourContext);
}

function placeCard(rect: DOMRect | null, width: number, height: number, placement: string, pad = 16) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = 14;
  const order = [placement, "bottom", "top", "right", "left"].filter((s, i, a) => a.indexOf(s) === i);
  for (const side of order) {
    let top = pad;
    let left = pad;
    if (side === "center" || !rect) {
      return { top: Math.max(pad, (vh - height) / 2), left: Math.max(pad, (vw - width) / 2) };
    }
    if (side === "bottom") {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - width / 2;
    } else if (side === "top") {
      top = rect.top - height - gap;
      left = rect.left + rect.width / 2 - width / 2;
    } else if (side === "right") {
      top = rect.top + rect.height / 2 - height / 2;
      left = document.documentElement.dir === "rtl" ? rect.left - width - gap : rect.right + gap;
    } else {
      top = rect.top + rect.height / 2 - height / 2;
      left = document.documentElement.dir === "rtl" ? rect.right + gap : rect.left - width - gap;
    }
    left = Math.min(Math.max(pad, left), vw - width - pad);
    top = Math.min(Math.max(pad, top), vh - height - pad);
    return { top, left };
  }
  return { top: pad, left: pad };
}

export function OnboardingTourProvider({
  children,
  role,
  user,
  homePath,
  locale = "en",
}: {
  children: ReactNode;
  role: "buyer" | "vendor" | "admin";
  user?: TourUser | null;
  homePath: string;
  locale?: string;
}) {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [skipOpen, setSkipOpen] = useState(false);
  const steps = useMemo(() => getWorkspaceTourSteps(role, locale), [role, locale]);

  const startTour = useCallback(
    (options: { force?: boolean } = {}) => {
      if (!user) return;
      resetTour(user);
      setStepIndex(0);
      setSkipOpen(false);
      setActive(true);
      if (options.force && pathname !== homePath) {
        window.location.assign(homePath);
      }
    },
    [homePath, pathname, user]
  );

  useEffect(() => {
    if (!user || active) return;
    const replay = consumeTourReplay();
    if (!replay && !shouldAutoStartTour(user)) return;
    if (pathname !== homePath) return;
    const t = window.setTimeout(() => {
      saveTourState(user, { onboarding_started: true });
      setActive(true);
    }, 700);
    return () => window.clearTimeout(t);
  }, [active, homePath, pathname, user]);

  const value = useMemo(() => ({ startTour, isActive: active }), [active, startTour]);

  return (
    <OnboardingTourContext.Provider value={value}>
      {children}
      {active ? (
        <TourOverlay
          user={user}
          steps={steps}
          stepIndex={stepIndex}
          setStepIndex={setStepIndex}
          skipOpen={skipOpen}
          setSkipOpen={setSkipOpen}
          onClose={() => setActive(false)}
          locale={locale}
        />
      ) : null}
    </OnboardingTourContext.Provider>
  );
}

function TourOverlay({
  user,
  steps,
  stepIndex,
  setStepIndex,
  skipOpen,
  setSkipOpen,
  onClose,
  locale = "en",
}: {
  user?: TourUser | null;
  steps: TourStep[];
  stepIndex: number;
  setStepIndex: (n: number) => void;
  skipOpen: boolean;
  setSkipOpen: (v: boolean) => void;
  onClose: () => void;
  locale?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [cardPos, setCardPos] = useState({ top: 96, left: 96 });
  const step = steps[stepIndex] || steps[steps.length - 1];
  const total = steps.length;
  const isLast = Boolean(step?.isComplete) || stepIndex >= total - 1;
  const canGoBack = !step?.hideBack && stepIndex > 0;

  const measure = useCallback(() => {
    if (!step) return;
    const target = step.target ? getTourTarget(step.target) : null;
    const rect = target?.getBoundingClientRect() || null;
    const pad = 8;
    setSpot(
      rect
        ? {
            top: Math.max(8, rect.top - pad),
            left: Math.max(8, rect.left - pad),
            width: Math.max(40, rect.width + pad * 2),
            height: Math.max(36, rect.height + pad * 2),
          }
        : null
    );
    const width = Math.min(window.innerWidth - 32, 352);
    const height = cardRef.current?.getBoundingClientRect().height || 220;
    setCardPos(placeCard(rect, width, height, step.placement || "bottom"));
  }, [step]);

  useEffect(() => {
    step?.target && getTourTarget(step.target)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    const t = window.setTimeout(measure, 50);
    return () => window.clearTimeout(t);
  }, [measure, step?.id, stepIndex]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  if (!step) return null;

  const goNext = () => {
    if (isLast) {
      markTourCompleted(user);
      onClose();
      return;
    }
    setStepIndex(stepIndex + 1);
  };

  return (
    <div className="tour-root" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className={`tour-dim${spot ? "" : " tour-dim-fill"}`} />
      {spot ? <div className="tour-spot" style={spot} /> : null}
      <div ref={cardRef} className="tour-card" style={{ top: cardPos.top, left: cardPos.left }}>
        <div className="tour-card-top">
          <p className="label-caps">{isLast ? (locale === "ar" ? "تم" : "Done") : locale === "ar" ? `الخطوة ${stepIndex + 1} من ${total}` : `Step ${stepIndex + 1} of ${total}`}</p>
          {!step.hideSkip ? (
            <button type="button" className="tour-text-btn" onClick={() => setSkipOpen(true)}>
              {locale === "ar" ? "تخطي الجولة" : "Skip tour"}
            </button>
          ) : (
            <button type="button" className="tour-text-btn" onClick={goNext}>
              {locale === "ar" ? "إغلاق" : "Close"}
            </button>
          )}
        </div>
        <div className="tour-dots" aria-hidden>
          {steps.map((s, i) => (
            <span key={s.id} className={i <= stepIndex ? "is-on" : ""} />
          ))}
        </div>
        <h2 id="tour-title">{step.title}</h2>
        <p>{step.description}</p>
        <div className="tour-actions">
          {canGoBack ? (
            <button type="button" className="tour-ghost-btn" onClick={() => setStepIndex(stepIndex - 1)}>
              {locale === "ar" ? "رجوع" : "Back"}
            </button>
          ) : (
            <span />
          )}
          <button type="button" className="tour-primary-btn" onClick={goNext}>
            {step.primaryLabel || (isLast ? (locale === "ar" ? "ابدأ" : "Get started") : locale === "ar" ? "التالي" : "Next")}
          </button>
        </div>
      </div>
      {skipOpen ? (
        <div className="tour-skip">
          <div className="tour-card tour-skip-card">
            <h2>{locale === "ar" ? "تخطي الجولة الإرشادية؟" : "Skip the guided tour?"}</h2>
            <p>{locale === "ar" ? "يمكنك إعادة تشغيلها من قائمة الحساب." : "You can start it again from Need help in the sidebar."}</p>
            <div className="tour-actions">
              <button type="button" className="tour-ghost-btn" onClick={() => setSkipOpen(false)}>
                {locale === "ar" ? "متابعة الجولة" : "Continue tour"}
              </button>
              <button
                type="button"
                className="tour-primary-btn"
                onClick={() => {
                  markTourSkipped(user);
                  setSkipOpen(false);
                  onClose();
                }}
              >
                {locale === "ar" ? "تخطي الجولة" : "Skip tour"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
