"use client";
// src/components/vendor/ProductEditor.tsx
// One page to list a product: photos, what it is, price and ordering, specifications. A checklist beside the
// form says what is still missing before buyers can find it; the action bar stays in reach while scrolling.

import Link from "next/link";
import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Circle, ExternalLink, ImagePlus, Plus, Star, Trash2, X } from "lucide-react";
import { toast } from "@/components/ui/Feedback";
import { uploadImage } from "@/lib/upload-image";
import { formatMoney, unitLabel } from "@/lib/money";
import { GAP_LABEL, listingGaps } from "@/lib/product-edit";

type Loc = { en?: string; ar?: string };
export type CategoryGroup = { label: string; options: Array<{ id: string; label: string }> };
export type EditorProduct = {
  id: string; name: Loc; description: Loc; brand: string; sku: string; categoryId: string; price: string; unit: string; moq: string;
  leadTime: string; availability: string; photos: string[]; specs: Array<{ key: string; value: string }>; status: string;
  rejectionReason: string; publicHref: string | null;
};

const UNITS = ["piece", "unit", "set", "box", "carton", "pack", "pair", "dozen", "kg", "ton", "liter", "meter", "sqm", "roll", "pallet"];
const MAX_PHOTOS = 8;
const EMPTY: EditorProduct = {
  id: "", name: { en: "", ar: "" }, description: { en: "", ar: "" }, brand: "", sku: "", categoryId: "", price: "", unit: "piece", moq: "",
  leadTime: "", availability: "in_stock", photos: [], specs: [], status: "draft", rejectionReason: "", publicHref: null,
};

function Field({ label, hint, children, wide }: { label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`sfe-field${wide ? " is-wide" : ""}`}>
      <span>{label}{hint ? <small> {hint}</small> : null}</span>
      {children}
    </label>
  );
}

export function ProductEditor({ locale, product, categories }: { locale: string; product: EditorProduct | null; categories: CategoryGroup[] }) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const router = useRouter();
  const [p, setP] = useState<EditorProduct>(product || EMPTY);
  const [busy, setBusy] = useState<"" | "save" | "submit" | "photo">("");
  const [dirty, setDirty] = useState(false);

  const set = <K extends keyof EditorProduct>(k: K, v: EditorProduct[K]) => { setP((x) => ({ ...x, [k]: v })); setDirty(true); };
  const setLoc = (k: "name" | "description", lang: "en" | "ar", v: string) => { setP((x) => ({ ...x, [k]: { ...x[k], [lang]: v } })); setDirty(true); };

  const gaps = useMemo(
    () => listingGaps({ name: p.name, description: p.description, media: p.photos, brand: p.brand, categoryId: p.categoryId || undefined, price: Number(p.price) || 0, moq: Number(p.moq) || 0 }),
    [p]
  );
  const live = p.status === "published" || p.status === "approved";
  const inReview = ["submitted", "under_review", "ai_processing"].includes(p.status);
  const canSubmit = !live && !inReview;

  const payload = (status?: string) => ({
    name: { en: p.name.en?.trim() || "", ar: p.name.ar?.trim() || "" },
    description: { en: p.description.en?.trim() || "", ar: p.description.ar?.trim() || "" },
    brand: p.brand.trim(),
    sku: p.sku.trim(),
    ...(p.categoryId ? { categoryId: p.categoryId } : {}),
    price: Number(p.price) > 0 ? Number(p.price) : undefined,
    priceType: Number(p.price) > 0 ? "starting_from" : "price_on_request",
    currency: "SAR",
    unit: p.unit,
    moq: Number(p.moq) > 0 ? Math.round(Number(p.moq)) : undefined,
    leadTime: p.leadTime.trim(),
    availability: p.availability,
    media: p.photos.map((url, i) => ({ url, type: "image", isPrimary: i === 0, order: i, alt: { en: p.name.en || "", ar: p.name.ar || "" } })),
    customSpecifications: p.specs.filter((s) => s.key.trim() && s.value.trim()).map((s) => ({ key: s.key.trim(), value: s.value.trim() })),
    ...(status ? { status } : {}),
  });

  const save = async (submit: boolean) => {
    if (!p.name.en?.trim() && !p.name.ar?.trim()) {
      toast(L("Give the product a name first.", "اكتب اسم المنتج أول."), "error");
      return;
    }
    setBusy(submit ? "submit" : "save");
    try {
      const body = payload(submit ? "submitted" : undefined);
      const res = p.id
        ? await fetch("/api/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, updates: body }) })
        : await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, status: submit ? "submitted" : "draft" }) });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      const saved = j.data?.product;
      setDirty(false);
      if (submit) {
        toast(L("Sent for review. We'll let you know when it's live.", "أُرسل للمراجعة. بنبلغك لما ينشر."), "success");
        router.push(`/${locale}/vendor/products?tab=review`);
      } else {
        toast(live ? L("Saved. Changes show on your listing now.", "تم الحفظ. التعديلات ظاهرة الآن.") : L("Draft saved.", "تم حفظ المسودة."), "success");
        if (!p.id && saved?._id) router.replace(`/${locale}/vendor/products/${saved._id}`);
        else router.refresh();
      }
    } catch (e) {
      console.error("[product-editor]", e);
      toast(L("Couldn't save. Check your connection and try again.", "تعذّر الحفظ. تأكد من الاتصال وحاول مرة ثانية."), "error");
    } finally {
      setBusy("");
    }
  };

  const addPhotos = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_PHOTOS - p.photos.length);
    e.target.value = "";
    if (!files.length) return;
    setBusy("photo");
    const urls: string[] = [];
    for (const f of files) {
      try {
        urls.push(await uploadImage(f, "product", 1400, p.id || undefined));
      } catch {
        toast(L(`${f.name} couldn't be used. Use JPG, PNG or WebP under 5 MB.`, `ما قدرنا نستخدم ${f.name}. استخدم JPG أو PNG أو WebP أقل من ٥ ميجا.`), "error");
      }
    }
    if (urls.length) set("photos", [...p.photos, ...urls]);
    setBusy("");
  };
  const makeCover = (i: number) => set("photos", [p.photos[i], ...p.photos.filter((_, j) => j !== i)]);
  const removePhoto = (i: number) => set("photos", p.photos.filter((_, j) => j !== i));
  const setSpec = (i: number, k: "key" | "value", v: string) => set("specs", p.specs.map((s, j) => (j === i ? { ...s, [k]: v } : s)));

  const title = (isAr ? p.name.ar || p.name.en : p.name.en || p.name.ar) || L("New product", "منتج جديد");
  const statusText = live ? L("Live", "منشور") : inReview ? L("In review", "قيد المراجعة") : p.status === "archived" ? L("Hidden", "مخفي") : ["rejected", "changes_requested"].includes(p.status) ? L("Needs changes", "يحتاج تعديل") : L("Draft", "مسودة");

  return (
    <div className="sfe pe" dir={isAr ? "rtl" : "ltr"}>
      <Link href={`/${locale}/vendor/products`} className="pe-back"><ArrowLeft size={15} aria-hidden /> {L("All products", "كل المنتجات")}</Link>
      <header className="bh-head">
        <div>
          <h1>{title}</h1>
          <p className="pe-status"><span className={`vrq-chip vpr-chip is-${live ? "live" : inReview ? "review" : p.status === "archived" ? "hidden" : ["rejected", "changes_requested"].includes(p.status) ? "fix" : "draft"}`}>{statusText}</span>
            {live ? L("Edits show straight away. Hukum may check changes to photos, name or price.", "التعديلات تظهر فوراً. حكم قد يراجع تغييرات الصور أو الاسم أو السعر.") : inReview ? L("Hukum is checking this listing.", "حكم يراجع هذا المنتج.") : L("Only you can see this until it's approved.", "ما يشوفه أحد غيرك لين الموافقة.")}
          </p>
        </div>
        {p.publicHref ? <a href={p.publicHref} target="_blank" rel="noopener noreferrer" className="bh-btn"><ExternalLink size={15} aria-hidden /> {L("View listing", "شاهد المنتج")}</a> : null}
      </header>

      {["rejected", "changes_requested"].includes(p.status) && p.rejectionReason ? (
        <p className="sfe-status is-rejected">{L("What to change", "المطلوب تعديله")}: {p.rejectionReason}</p>
      ) : null}

      <div className="sfe-body">
        <div className="sfe-forms">
          <section className="sfe-card" aria-labelledby="pe-photos">
            <div className="sfe-card__head">
              <h2 id="pe-photos">{L("Photos", "الصور")}</h2>
              <p>{L("A clear photo on a plain background. The first one is the cover.", "صورة واضحة بخلفية سادة. الأولى هي الغلاف.")}</p>
            </div>
            <ul className="pe-photos">
              {p.photos.map((url, i) => (
                <li key={url} className={i === 0 ? "is-cover" : ""}>
                  <img src={url} alt="" />
                  {i === 0 ? <span className="pe-cover">{L("Cover", "الغلاف")}</span> : null}
                  <span className="pe-photo-act">
                    {i > 0 ? <button type="button" onClick={() => makeCover(i)} aria-label={L("Make cover", "اجعلها الغلاف")}><Star size={14} aria-hidden /></button> : null}
                    <button type="button" onClick={() => removePhoto(i)} aria-label={L("Remove photo", "احذف الصورة")}><Trash2 size={14} aria-hidden /></button>
                  </span>
                </li>
              ))}
              {p.photos.length < MAX_PHOTOS ? (
                <li>
                  <label className="pe-add">
                    <ImagePlus size={22} aria-hidden />
                    <span>{busy === "photo" ? L("Uploading…", "جارٍ الرفع…") : L("Add photos", "أضف صور")}</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={addPhotos} disabled={busy === "photo"} />
                  </label>
                </li>
              ) : null}
            </ul>
          </section>

          <section className="sfe-card" aria-labelledby="pe-what">
            <div className="sfe-card__head"><h2 id="pe-what">{L("What it is", "وش هو المنتج")}</h2></div>
            <div className="sfe-grid">
              <Field label={L("Name in English", "الاسم بالإنجليزي")}>
                <input maxLength={140} value={p.name.en || ""} onChange={(e) => setLoc("name", "en", e.target.value)} placeholder="Safety helmet, white, EN 397" />
              </Field>
              <Field label={L("Name in Arabic", "الاسم بالعربي")}>
                <input dir="rtl" maxLength={140} value={p.name.ar || ""} onChange={(e) => setLoc("name", "ar", e.target.value)} placeholder="خوذة سلامة بيضاء EN 397" />
              </Field>
              <Field label={L("Brand", "العلامة التجارية")}>
                <input maxLength={60} value={p.brand} onChange={(e) => set("brand", e.target.value)} />
              </Field>
              <Field label={L("SKU or model", "الرمز أو الموديل")} hint={L("optional", "اختياري")}>
                <input dir="ltr" maxLength={60} value={p.sku} onChange={(e) => set("sku", e.target.value)} />
              </Field>
              <Field label={L("Category", "الفئة")} wide>
                <select value={p.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                  <option value="">{L("Choose where buyers would look for it", "اختر وين بيدور عليه المشتري")}</option>
                  {categories.map((g) => (
                    <optgroup key={g.label} label={g.label}>
                      {g.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </Field>
              <Field label={L("Description in English", "الوصف بالإنجليزي")} wide>
                <textarea rows={4} maxLength={3000} value={p.description.en || ""} onChange={(e) => setLoc("description", "en", e.target.value)} placeholder={L("What it's for, what it's made of, standards it meets.", "")} />
              </Field>
              <Field label={L("Description in Arabic", "الوصف بالعربي")} wide>
                <textarea rows={4} dir="rtl" maxLength={3000} value={p.description.ar || ""} onChange={(e) => setLoc("description", "ar", e.target.value)} placeholder="استخدامه، خامته، والمواصفات اللي يطابقها." />
              </Field>
            </div>
          </section>

          <section className="sfe-card" aria-labelledby="pe-price">
            <div className="sfe-card__head">
              <h2 id="pe-price">{L("Price and ordering", "السعر والطلب")}</h2>
              <p>{L("A starting price helps buyers shortlist you. Leave it empty to show “Price on request”.", "السعر المبدئي يساعد المشتري يختارك. اتركه فاضي ليظهر «السعر عند الطلب».")}</p>
            </div>
            <div className="sfe-grid pe-grid3">
              <Field label={L("Starting price, SAR", "السعر المبدئي، ريال")} hint={L("before VAT", "قبل الضريبة")}>
                <input inputMode="decimal" dir="ltr" value={p.price} onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, "").slice(0, 10))} placeholder="0.00" />
              </Field>
              <Field label={L("Per", "لكل")}>
                <select value={p.unit} onChange={(e) => set("unit", e.target.value)}>
                  {UNITS.map((u) => <option key={u} value={u}>{unitLabel(u, locale)}</option>)}
                </select>
              </Field>
              <Field label={L("Minimum order", "أقل كمية")} hint={L("optional", "اختياري")}>
                <input inputMode="numeric" dir="ltr" value={p.moq} onChange={(e) => set("moq", e.target.value.replace(/\D/g, "").slice(0, 7))} />
              </Field>
              <Field label={L("Lead time", "مدة التوريد")} hint={L("e.g. 5 days", "مثلاً ٥ أيام")}>
                <input maxLength={40} value={p.leadTime} onChange={(e) => set("leadTime", e.target.value)} />
              </Field>
              <Field label={L("Availability", "التوفر")}>
                <select value={p.availability} onChange={(e) => set("availability", e.target.value)}>
                  <option value="in_stock">{L("In stock", "متوفر")}</option>
                  <option value="made_to_order">{L("Made to order", "حسب الطلب")}</option>
                  <option value="limited">{L("Limited stock", "كمية محدودة")}</option>
                  <option value="out_of_stock">{L("Out of stock", "غير متوفر")}</option>
                </select>
              </Field>
            </div>
          </section>

          <section className="sfe-card" aria-labelledby="pe-specs">
            <div className="sfe-card__head">
              <h2 id="pe-specs">{L("Specifications", "المواصفات")}</h2>
              <p>{L("Size, material, standard, colour. Buyers compare these side by side.", "المقاس، الخامة، المعيار، اللون. المشترون يقارنونها جنب بعض.")}</p>
            </div>
            {p.specs.length ? (
              <ul className="pe-specs">
                {p.specs.map((s, i) => (
                  <li key={i}>
                    <input aria-label={L("Specification", "المواصفة")} maxLength={50} value={s.key} onChange={(e) => setSpec(i, "key", e.target.value)} placeholder={L("e.g. Material", "مثلاً الخامة")} />
                    <input aria-label={L("Value", "القيمة")} maxLength={120} value={s.value} onChange={(e) => setSpec(i, "value", e.target.value)} placeholder={L("e.g. HDPE", "مثلاً HDPE")} />
                    <button type="button" className="sfe-remove" onClick={() => set("specs", p.specs.filter((_, j) => j !== i))} aria-label={L("Remove row", "احذف السطر")}><X size={15} aria-hidden /></button>
                  </li>
                ))}
              </ul>
            ) : null}
            <button type="button" className="bh-btn bh-btn--sm pe-addspec" onClick={() => set("specs", [...p.specs, { key: "", value: "" }])} disabled={p.specs.length >= 20}>
              <Plus size={15} aria-hidden /> {L("Add a specification", "أضف مواصفة")}
            </button>
          </section>
        </div>

        <aside className="sfe-preview pe-side" aria-label={L("Listing check", "فحص المنتج")}>
          <div className="pe-card">
            {p.photos[0] ? <img src={p.photos[0]} alt="" className="pe-card__img" /> : <span className="pe-card__img is-empty"><ImagePlus size={22} aria-hidden /></span>}
            <b>{title}</b>
            <span className="pe-card__price">
              {Number(p.price) > 0 ? <>{L("From", "من")} {formatMoney(Number(p.price), locale)} <small>/ {unitLabel(p.unit, locale)}</small></> : L("Price on request", "السعر عند الطلب")}
            </span>
          </div>
          <div className="pe-check">
            <b>{gaps.length ? L("Before buyers can find it", "قبل ما يلقاه المشترون") : L("Ready for buyers", "جاهز للمشترين")}</b>
            <ul>
              {(["photo", "description", "category", "price", "arabic", "brand"] as const).map((g) => {
                const done = !gaps.includes(g);
                return <li key={g} className={done ? "is-done" : ""}>{done ? <Check size={15} aria-hidden /> : <Circle size={15} aria-hidden />} {isAr ? GAP_LABEL[g].ar : GAP_LABEL[g].en}</li>;
              })}
            </ul>
          </div>
        </aside>
      </div>

      <div className="pe-bar" role="region" aria-label={L("Save", "حفظ")}>
        <span className="pe-bar__hint">{dirty ? L("Unsaved changes", "تعديلات غير محفوظة") : gaps.length && canSubmit ? (isAr ? GAP_LABEL[gaps[0]].ar : GAP_LABEL[gaps[0]].en) : ""}</span>
        <button type="button" className="bh-btn" onClick={() => save(false)} disabled={busy !== ""}>
          {busy === "save" ? L("Saving…", "جارٍ الحفظ…") : live ? L("Save changes", "احفظ التعديلات") : L("Save draft", "احفظ كمسودة")}
        </button>
        {canSubmit ? (
          <button type="button" className="qb-send" onClick={() => save(true)} disabled={busy !== "" || gaps.length > 0}>
            {busy === "submit" ? L("Sending…", "جارٍ الإرسال…") : L("Send for review", "أرسل للمراجعة")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
