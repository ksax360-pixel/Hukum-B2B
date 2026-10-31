import { cn } from "@/lib/utils";

export const BRAND_MARK_SRC = "/brand/hukum-logo.png";

/** Official Hukum mark. */
export function BrandMark({
  className,
  size = 32,
  alt = "Hukum",
}: {
  className?: string;
  size?: number;
  alt?: string;
}) {
  return (
    <img
      src={BRAND_MARK_SRC}
      alt={alt}
      width={size}
      height={size}
      className={cn("kt-brand-mark", className)}
      decoding="async"
    />
  );
}
