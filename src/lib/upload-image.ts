// Client-side: shrink an image in the browser, then upload it. Returns the /api/media URL.

function shrink(file: File, maxW: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      const type = file.type === "image/png" ? "image/png" : "image/jpeg";
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("bad image"))), type, 0.85);
    };
    img.onerror = () => reject(new Error("bad image"));
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadImage(file: File, kind: "product" | "company_logo" | "company_cover", maxW: number, productId?: string): Promise<string> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error("type");
  const blob = await shrink(file, maxW);
  const fd = new FormData();
  fd.append("file", blob, blob.type === "image/png" ? "image.png" : "image.jpg");
  fd.append("kind", kind);
  if (productId) fd.append("productId", productId);
  const j = await (await fetch("/api/uploads", { method: "POST", body: fd })).json();
  if (!j.success || !j.data?.url) throw new Error(j.message || "upload");
  return j.data.url as string;
}
