import type { ReactNode } from "react";

export function HomeSnapSection({
  children,
  hero = false,
}: {
  children: ReactNode;
  hero?: boolean;
}) {
  return (
    <div className={`home-snap-section${hero ? " home-snap-section--hero" : ""}`}>
      <div className="home-snap-inner">{children}</div>
    </div>
  );
}
