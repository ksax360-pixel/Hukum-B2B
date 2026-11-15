"use client";

/** Public site is light-only. ThemeProvider is intentionally a no-op pass-through. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
