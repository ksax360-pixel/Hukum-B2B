"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "@/components/brand/BrandMark";

/** Total splash budget — keep under 1.8s. */
const LOGO_MS = 1400;
const EXIT_MS = 350;
const TOTAL_MS = LOGO_MS + EXIT_MS;

type Phase = "logo" | "out" | "done";

export function Splash({ onComplete }: { onComplete?: () => void }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("logo");
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

    timers.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setPhase("out");
        timers.push(window.setTimeout(finish, EXIT_MS));
      }, reduce ? 600 : LOGO_MS)
    );

    timers.push(window.setTimeout(finish, TOTAL_MS + 50));

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [reduce]);

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
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          backgroundImage: "radial-gradient(rgba(17,17,17,0.16) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          WebkitMaskImage: "radial-gradient(min(60vw,480px) circle at center, white, transparent)",
          maskImage: "radial-gradient(min(60vw,480px) circle at center, white, transparent)",
        }}
        aria-hidden
      />

      <motion.div
        className="relative z-10 flex items-center justify-center px-8"
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        animate={
          reduce
            ? { opacity: 1, scale: 1 }
            : { opacity: [0, 1, 0.12, 1, 0.12, 1], scale: 1 }
        }
        transition={
          reduce
            ? { duration: 0.35 }
            : { duration: 1.35, times: [0, 0.18, 0.36, 0.54, 0.72, 1], ease: "easeInOut" }
        }
      >
        <BrandMark size={108} alt="Hukum" />
      </motion.div>
    </div>
  );
}
