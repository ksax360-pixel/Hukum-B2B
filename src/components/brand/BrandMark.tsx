import { cn } from "@/lib/utils";

export const BRAND_MARK_SRC = "/brand/hukum-logo.png?v=2";

/** Intrinsic aspect of the Hukum lockup (Arabic mark + HUKUM). */
const BRAND_ASPECT = 301 / 183;

/** Official Hukum mark. `size` controls height; width follows the lockup aspect. */
export function BrandMark({
  className,
  size = 32,
  alt = "Hukum",
}: {
  className?: string;
  size?: number;
  alt?: string;
}) {
  const height = size;
  const width = Math.round(size * BRAND_ASPECT);

  return (
    <img
      src={BRAND_MARK_SRC}
      alt={alt}
      width={width}
      height={height}
      className={cn("kt-brand-mark", className)}
      style={{ height: size, width: "auto" }}
      decoding="async"
    />
  );
}
