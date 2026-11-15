import type { ReactNode } from "react";

/** Homepage section wrapper. Normal document flow (snap scrolling removed 2026-11-09). */
export function HomeSnapSection({ children }: { children: ReactNode; hero?: boolean }) {
  return <div className="home-flow-section">{children}</div>;
}
