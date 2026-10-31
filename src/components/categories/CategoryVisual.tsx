/** Photo discs for marketplace categories — Mongo image URL or /categories/{key}.jpg. */
export function CategoryVisual({
  categoryKey,
  image,
  className,
  size = 64,
}: {
  categoryKey?: string;
  image?: string | null;
  className?: string;
  size?: number;
}) {
  const src =
    (image && String(image).trim()) ||
    (categoryKey ? `/categories/${categoryKey}.jpg` : "/categories/others.jpg");

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={className}
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "cover", borderRadius: "50%", display: "block" }}
    />
  );
}
