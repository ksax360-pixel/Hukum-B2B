"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import { BrandMark } from "@/components/brand/BrandMark";

const INITIAL_WAIT_MS = 700;
const CHAR_MS = 55;
const HOLD_TEXT_MS = 1100;
const LOGO_BLINK_MS = 2200;
const EXIT_MS = 1000;

type Phase = "typing" | "hold" | "logo" | "out" | "done";

export function Splash({ locale, onComplete }: { locale: Locale; onComplete?: () => void }) {
  const reduce = useReducedMotion();
  const isAr = locale === "ar";
  const welcome = isAr ? "مرحباً بكم في المستقبل" : "WELCOME TO THE FUTURE";
  const chars = useMemo(() => Array.from(welcome), [welcome]);

  const [phase, setPhase] = useState<Phase>("typing");
  const [typedCount, setTypedCount] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timers: number[] = [];
    let cancelled = false;
    let finished = false;

    const finish = () => {
      if (cancelled || finished) return;
      finished = true;
      setPhase("done");
      onCompleteRef.current?.();
    };

    const goOut = () => {
      if (cancelled || finished) return;
      setPhase("out");
      timers.push(window.setTimeout(finish, EXIT_MS));
    };

    timers.push(window.setTimeout(finish, 12000));

    if (reduce || chars.length === 0) {
      timers.push(
        window.setTimeout(() => {
          setTypedCount(chars.length);
          setShowCursor(false);
          setPhase("logo");
        }, INITIAL_WAIT_MS)
      );
      timers.push(window.setTimeout(goOut, INITIAL_WAIT_MS + HOLD_TEXT_MS + 1200));
    } else {
      timers.push(
        window.setTimeout(() => {
          let i = 0;
          const typeTimer = window.setInterval(() => {
            i += 1;
            setTypedCount(i);
            if (i >= chars.length) {
              window.clearInterval(typeTimer);
              setPhase("hold");
              timers.push(window.setTimeout(() => setShowCursor(false), 320));
              timers.push(
                window.setTimeout(() => {
                  setPhase("logo");
                  timers.push(window.setTimeout(goOut, LOGO_BLINK_MS));
                }, HOLD_TEXT_MS)
              );
            }
          }, CHAR_MS);
          timers.push(typeTimer);
        }, INITIAL_WAIT_MS)
      );
    }

    return () => {
      cancelled = true;
      timers.forEach((id) => {
        window.clearTimeout(id);
        window.clearInterval(id);
      });
    };
  }, [chars.length, reduce]);

  if (phase === "done") return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden bg-white"
      style={{
        zIndex: 99999,
        opacity: phase === "out" ? 0 : 1,
        transition: `opacity ${EXIT_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        isolation: "isolate",
        pointerEvents: phase === "out" ? "none" : "auto",
        backgroundColor: "#ffffff",
      }}
      aria-hidden={phase === "out"}
    >
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(17,17,17,0.16) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          WebkitMaskImage: "radial-gradient(min(60vw,480px) circle at center, white, transparent)",
          maskImage: "radial-gradient(min(60vw,480px) circle at center, white, transparent)",
        }}
        aria-hidden
      />

      <AnimatePresence mode="wait">
        {(phase === "typing" || phase === "hold") && (
          <motion.p
            key="welcome"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative z-10 max-w-[min(92vw,42rem)] px-4 text-center text-[clamp(0.65rem,2vw,0.95rem)] font-medium tracking-[0.18em] text-black uppercase",
              isAr && "tracking-[0.08em] font-normal normal-case"
            )}
          >
            {chars.slice(0, typedCount).join("")}
            {showCursor ? (
              <motion.span
                aria-hidden
                className="ms-1 inline-block h-[0.9em] w-px translate-y-[0.1em] bg-black/70 align-baseline"
                animate={reduce ? { opacity: 0 } : { opacity: [0.2, 0.9, 0.2] }}
                transition={reduce ? undefined : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : null}
          </motion.p>
        )}

        {phase === "logo" && (
          <motion.div
            key="logo"
            className="relative z-10 flex items-center justify-center px-8"
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={
              reduce
                ? { opacity: 1, scale: 1 }
                : { opacity: [0, 1, 0.08, 1, 0.08, 1], scale: 1 }
            }
            exit={{ opacity: 0 }}
            transition={
              reduce
                ? { duration: 0.4 }
                : { duration: 2.2, times: [0, 0.16, 0.34, 0.52, 0.7, 1], ease: "easeInOut" }
            }
          >
            <BrandMark size={108} alt="" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
