export function JsonLd({ data }: { data: object | object[] | null | undefined }) {
  if (!data) return null;
  const payload = Array.isArray(data) ? data.filter(Boolean) : data;
  if (Array.isArray(payload) && !(payload as object[]).length) return null;
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be a raw script payload for crawlers.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
