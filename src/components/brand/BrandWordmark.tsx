import { cn } from "@/lib/utils";

const SIZE = {
  sm: "text-sm tracking-[0.14em]",
  md: "text-base tracking-[0.16em]",
  lg: "text-xl tracking-[0.18em]",
} as const;

/** Hukum text wordmark (logo image is BrandMark). */
export function BrandWordmark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "kt-wordmark-text font-semibold uppercase text-[#001730]",
        SIZE[size],
        className
      )}
    >
      Hukum
    </span>
  );
}
