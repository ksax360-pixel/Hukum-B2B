"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { rfqPromise } from "@/lib/rfq-promise";
import { parseItemList } from "@/lib/parse-item-list";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  ListPlus,
  Package,
  Plus,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import { isLocale, type Locale } from "@/i18n/config";
import type { ApiBody } from "@/lib/api";
import { KtSelect } from "@/components/ui/KtSelect";

const UNITS = [
  { value: "piece", en: "Piece", ar: "قطعة" },
  { value: "unit", en: "Unit", ar: "وحدة" },
  { value: "set", en: "Set", ar: "طقم" },
  { value: "box", en: "Box", ar: "صندوق" },
  { value: "carton", en: "Carton", ar: "كرتون" },
  { value: "pack", en: "Pack", ar: "عبوة" },
  { value: "kg", en: "Kilogram", ar: "كيلوغرام" },
  { value: "ton", en: "Ton", ar: "طن" },
  { value: "meter", en: "Meter", ar: "متر" },
  { value: "sqm", en: "Square meter", ar: "متر مربع" },
  { value: "liter", en: "Liter", ar: "لتر" },
  { value: "pair", en: "Pair", ar: "زوج" },
  { value: "roll", en: "Roll", ar: "لفة" },
  { value: "bag", en: "Bag", ar: "كيس" },
  { value: "pallet", en: "Pallet", ar: "طبلية" },
  { value: "container", en: "Container", ar: "حاوية" },
] as const;

const CURRENCIES = [
  { value: "SAR", en: "SAR", ar: "ر.س" },
  { value: "USD", en: "USD", ar: "دولار" },
  { value: "EUR", en: "EUR", ar: "يورو" },
  { value: "AED", en: "AED", ar: "درهم" },
] as const;

const PAYMENT_TERMS = [
  { value: "net_30", en: "Net 30", ar: "صافي 30 يوماً" },
  { value: "net_60", en: "Net 60", ar: "صافي 60 يوماً" },
  { value: "advance_30_70", en: "30% advance / 70% on delivery", ar: "30% مقدّم / 70% عند التسليم" },
  { value: "advance_50_50", en: "50% advance / 50% on delivery", ar: "50% مقدّم / 50% عند التسليم" },
  { value: "lc", en: "Letter of credit (LC)", ar: "اعتماد مستندي" },
  { value: "cad", en: "Cash against documents", ar: "الدفع مقابل المستندات" },
  { value: "cod", en: "Cash on delivery", ar: "الدفع عند الاستلام" },
  { value: "negotiable", en: "Open to negotiation", ar: "قابل للتفاوض" },
] as const;

const INCOTERMS = [
  { value: "EXW", en: "EXW — Ex Works", ar: "EXW — تسليم المصنع" },
] as const;

const CITIES = [
  { value: "Riyadh", en: "Riyadh", ar: "الرياض" },
  { value: "Jeddah", en: "Jeddah", ar: "جدة" },
  { value: "Dammam", en: "Dammam", ar: "الدمام" },
  { value: "Khobar", en: "Khobar", ar: "الخبر" },
  { value: "Dhahran", en: "Dhahran", ar: "الظهران" },
  { value: "Mecca", en: "Mecca", ar: "مكة" },
  { value: "Medina", en: "Medina", ar: "المدينة" },
  { value: "Jubail", en: "Jubail", ar: "الجبيل" },
  { value: "Yanbu", en: "Yanbu", ar: "ينبع" },
  { value: "Neom", en: "NEOM", ar: "نيوم" },
  { value: "Other", en: "Other city", ar: "مدينة أخرى" },
] as const;

const REQUEST_TYPES = [
  { value: "product", en: "Product supply", ar: "توريد منتج" },
  { value: "service", en: "Service", ar: "خدمة" },
  { value: "project", en: "Project / turnkey", ar: "مشروع / تسليم مفتاح" },
  { value: "recurring", en: "Recurring supply", ar: "توريد متكرر" },
] as const;

function opts(
  items: readonly { value: string; en: string; ar: string }[],
  isAr: boolean,
  empty?: string
) {
  const list = items.map((o) => ({ value: o.value, label: isAr ? o.ar : o.en }));
  return empty ? [{ value: "", label: empty }, ...list] : list;
}

export default function RfqPage() {
  return (
    <Suspense fallback={null}>
      <RfqForm />
    </Suspense>
  );
}

function RfqForm() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = typeof params.locale === "string" ? params.locale : "en";
  const locale = (isLocale(raw) ? raw : "en") as Locale;
  const isAr = locale === "ar";

  const productId =
    searchParams.get("product") || searchParams.get("productId") || "";
  const vendorId =
    searchParams.get("vendor") || searchParams.get("vendorId") || "";
  const intent = searchParams.get("intent") || "";
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const submitLock = useRef(false);
  const idempotencyKey = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `rfq_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  // Prefill from search ("Request quotes" on results/suggestions): ?q=&qty=&unit=&city=&categoryId=
  const preQ = (searchParams.get("q") || "").trim().slice(0, 160);
  const preQty = searchParams.get("qty") || "";
  const preUnit = searchParams.get("unit") || "";
  const preCity = searchParams.get("city") || "";
  const knownCity = CITIES.find((c) => c.value.toLowerCase() === preCity.toLowerCase())?.value;
  const [title, setTitle] = useState(preQ ? `RFQ — ${preQ}` : "");
  const [requestType, setRequestType] = useState("product");
  const [itemName, setItemName] = useState(preQ);
  const [specifications, setSpecifications] = useState("");
  // More items in the same request (one request, several lines: the quote basket).
  type Line = { name: string; qty: string; unit: string; specs: string };
  const [extra, setExtra] = useState<Line[]>([]);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [editContact, setEditContact] = useState(false);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(/^\d+(\.\d+)?$/.test(preQty) ? preQty : "");
  const [unit, setUnit] = useState<string>(UNITS.some((u) => u.value === preUnit) ? preUnit : "piece");
  const [brandPreference, setBrandPreference] = useState("");
  const [certifications, setCertifications] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [incoterms, setIncoterms] = useState("");
  const [city, setCity] = useState<string>(knownCity || (preCity ? "Other" : "Riyadh"));
  const [region, setRegion] = useState(knownCity ? "" : preCity.slice(0, 60));
  const [address, setAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [samplesNeeded, setSamplesNeeded] = useState(false);
  const [installationNeeded, setInstallationNeeded] = useState(false);
  const [warrantyNeeded, setWarrantyNeeded] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rfqId, setRfqId] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  const [preferredVendorId, setPreferredVendorId] = useState(vendorId);

  const checklist = useMemo(
    () => [
      {
        icon: Package,
        title: isAr ? "تفاصيل المنتج" : "Product clarity",
        copy: isAr
          ? "الاسم، المواصفات، الكمية، والوحدة — حتى لا يطلب المورد توضيحاً لاحقاً."
          : "Name, specs, quantity, and unit — so vendors don’t come back with clarifying questions.",
      },
      {
        icon: ClipboardList,
        title: isAr ? "الشروط التجارية" : "Commercial terms",
        copy: isAr
          ? "الميزانية، العملة، الدفع، والإنكوترمز تساعد المورد على تسعير دقيق."
          : "Budget, currency, payment, and Incoterms help vendors price accurately.",
      },
      {
        icon: Truck,
        title: isAr ? "التسليم" : "Delivery",
        copy: isAr
          ? "المدينة والتاريخ المتوقع يحددان التكلفة والجدول الزمني."
          : "City and target date drive logistics cost and lead time.",
      },
      {
        icon: ShieldCheck,
        title: isAr ? "متطلبات الجودة" : "Quality requirements",
        copy: isAr
          ? "الشهادات والضمان والعينات تُصفّي الموردين غير المناسبين مبكراً."
          : "Certifications, warranty, and samples filter unsuitable suppliers early.",
      },
    ],
    [isAr]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let fullName = "";
        let company = "";
        let phone = "";
        let email = "";
        try {
          const raw = localStorage.getItem("kt_buyer_profile");
          if (raw) {
            const p = JSON.parse(raw) as {
              fullName?: string;
              companyName?: string;
              phone?: string;
              email?: string;
            };
            fullName = p.fullName || "";
            company = p.companyName || "";
            phone = p.phone || "";
            email = p.email || "";
          }
        } catch {
          /* ignore */
        }
        const auth = await fetch("/api/auth", { credentials: "include" }).then((r) => r.json());
        if (auth?.success) {
          setSignedIn(true);
          const u = auth.data?.user || {};
          fullName = fullName || u.name || "";
          phone = phone || u.mobile || "";
          email = email || u.email || auth.data?.session?.email || "";
        }
        if (cancelled) return;
        if (fullName) setContactName((v) => v || fullName);
        if (company) setCompanyName((v) => v || company);
        if (phone) setContactPhone((v) => v || phone);
        if (email) setContactEmail((v) => v || email);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Prefill from product page (?product= / ?productId=)
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/products?id=${encodeURIComponent(productId)}`, {
          credentials: "include",
        });
        const json = await res.json();
        const p = json?.data?.product || json?.data || null;
        if (!p || cancelled) return;
        const nameEn =
          (typeof p.name === "object" ? p.name?.en : p.name) ||
          p.title?.en ||
          "";
        const specs =
          (typeof p.description === "object" ? p.description?.en : p.description) ||
          p.specifications ||
          "";
        if (nameEn) {
          setItemName((v) => v || String(nameEn));
          setTitle((v) => v || `RFQ — ${String(nameEn)}`);
        }
        if (specs) setSpecifications((v) => v || String(specs).slice(0, 2000));
        if (p.moq) setQuantity((v) => v || String(p.moq).replace(/\D/g, "") || "1");
        else if (p.minOrderQty) setQuantity((v) => v || String(p.minOrderQty));
        if (p.unit) setUnit(String(p.unit));
        if (p.categoryId) setCategoryId(String(p.categoryId));
        const vid =
          typeof p.vendorId === "object" ? p.vendorId?._id : p.vendorId;
        if (vid) setPreferredVendorId(String(vid));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  function buildAdditionalRequirements() {
    const lines: string[] = [];
    if (requestType) {
      const rt = REQUEST_TYPES.find((r) => r.value === requestType);
      lines.push(`Request type: ${rt ? (isAr ? rt.ar : rt.en) : requestType}`);
    }
    if (brandPreference) lines.push(`Brand preference: ${brandPreference}`);
    if (certifications) lines.push(`Required certifications: ${certifications}`);
    if (samplesNeeded) lines.push("Samples required before award");
    if (installationNeeded) lines.push("Installation / commissioning required");
    if (warrantyNeeded) lines.push("Warranty terms required in quotation");
    if (companyName) lines.push(`Buyer company: ${companyName}`);
    if (contactName) lines.push(`Contact person: ${contactName}`);
    if (contactEmail) lines.push(`Contact email: ${contactEmail}`);
    if (contactPhone) lines.push(`Contact phone: ${contactPhone}`);
    if (vendorId) lines.push(`Preferred vendor id: ${vendorId}`);
    if (productId) lines.push(`Related product id: ${productId}`);
    if (intent) lines.push(`Intent: ${intent}`);
    if (additionalNotes) lines.push(`Notes: ${additionalNotes}`);
    return lines.join("\n");
  }

  function buildDescriptionText() {
    const parts = [description.trim()];
    if (specifications.trim()) {
      parts.push(`${isAr ? "المواصفات" : "Specifications"}:\n${specifications.trim()}`);
    }
    return parts.filter(Boolean).join("\n\n");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (loading || rfqId || submitLock.current) return;
    if (deadline && deadline < todayIso) {
      setError(isAr ? "آخر موعد للعروض يجب أن يكون اليوم أو لاحقاً." : "Quote deadline must be today or in the future.");
      return;
    }
    if (deliveryDate && deliveryDate < todayIso) {
      setError(isAr ? "تاريخ التسليم يجب أن يكون اليوم أو لاحقاً." : "Delivery date must be today or in the future.");
      return;
    }
    if (!signedIn) {
      // The draft (all lines) is already saved; it comes back after sign-in.
      router.push(`/${locale}/login?next=${encodeURIComponent(`/${locale}/rfq`)}`);
      return;
    }
    submitLock.current = true;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const descriptionText = buildDescriptionText();
      const paymentLabel = PAYMENT_TERMS.find((p) => p.value === paymentTerms);
      const res = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "create",
          idempotencyKey: idempotencyKey.current,
          titleEn: extraLines.length ? `${itemName.trim()} + ${extraLines.length} more` : title.trim() || itemName.trim(),
          descriptionText: descriptionText || itemName.trim(),
          categoryId: categoryId || undefined,
          vendorId: preferredVendorId || vendorId || undefined,
          preferredVendorId: preferredVendorId || vendorId || undefined,
          productId: productId || undefined,
          items: [
            {
              quantity: Number(quantity) || 1,
              unit: unit || "piece",
              name: { en: itemName || title, ar: "" },
              specifications: specifications || undefined,
              productId: productId || undefined,
              categoryId: categoryId || undefined,
            },
            ...extraLines.map((l) => ({
              quantity: Number(l.qty) || 1,
              unit: l.unit || "piece",
              name: { en: l.name.trim(), ar: "" },
              specifications: l.specs || (l.qty ? undefined : "Quantity to confirm"),
            })),
          ],
          deliveryLocation: {
            city: city === "Other" ? region || city : city,
            region: region || undefined,
            address: address || undefined,
            country: "SA",
          },
          deliveryDate: deliveryDate || undefined,
          deadline: deadline || undefined,
          budget: budget || undefined,
          currency,
          paymentTerms: paymentLabel ? (isAr ? paymentLabel.ar : paymentLabel.en) : paymentTerms || undefined,
          incoterms: incoterms || undefined,
          additionalRequirements: buildAdditionalRequirements(),
          useAI: true,
          status: "open",
        }),
      });
      const json = (await res.json()) as ApiBody<{ _id?: string }>;
      if (!json.success || !json.data) {
        setError(json.message || json.error || (isAr ? "فشل الإنشاء" : "Create failed"));
        submitLock.current = false;
        return;
      }
      const createdId = String(json.data._id);
      setRfqId(createdId);
      // Send to matching suppliers now; nothing else triggers matching after create.
      let matched = 0;
      try {
        const m = await fetch("/api/rfqs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "match", rfqId: createdId }),
        }).then((r) => r.json() as Promise<ApiBody<{ matches?: unknown[] }>>);
        matched = m.success ? m.data?.matches?.length || 0 : 0;
      } catch {
        /* request is saved; admin can match it */
      }
      setMessage(
        isAr
          ? "تم إنشاء طلب عرض السعر. يمكنك الآن مطابقة الموردين المناسبين."
          : "RFQ created. You can now match relevant vendors."
      );
      router.push(`/${locale}/rfq/sent?ref=${encodeURIComponent(createdId)}&n=${matched}`);
    } catch {
      setError(isAr ? "خطأ في الشبكة" : "Network error");
      submitLock.current = false;
    } finally {
      setLoading(false);
    }
  }

  async function handleMatch() {
    if (!rfqId) return;
    setMatching(true);
    setError(null);
    try {
      const res = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "match", rfqId }),
      });
      const json = (await res.json()) as ApiBody;
      if (!json.success) {
        setError(json.message || json.error || (isAr ? "فشل المطابقة" : "Match failed"));
        return;
      }
      const n = ((json.data as { matches?: unknown[] } | null)?.matches || []).length;
      setMessage(
        n > 0
          ? isAr
            ? `أرسلنا طلبك إلى ${n} ${n === 1 ? "مورد" : "موردين"} يبيعون هذا المنتج. تصلك عروضهم هنا وتقارن بينها.`
            : `Sent to ${n} supplier${n === 1 ? "" : "s"} who sell this. Their quotes arrive here for you to compare.`
          : isAr
            ? "لا يوجد مورد مسجّل لهذا المنتج حالياً. فريق حكم سيبحث لك عن موردين ويضيفهم لطلبك."
            : "No listed supplier sells this yet. The Hukum team will look for suppliers and add them to your request."
      );
    } catch {
      setError(isAr ? "خطأ في الشبكة" : "Network error");
    } finally {
      setMatching(false);
    }
  }

  const [more, setMore] = useState(false);
  const extraLines = extra.filter((l) => l.name.trim());
  const setLine = (i: number, patch: Partial<Line>) => setExtra((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const addPasted = () => {
    const parsed = parseItemList(pasteText).map((l) => ({ name: l.name, qty: l.qty, unit: l.unit || "piece", specs: "" }));
    if (!parsed.length) return;
    if (!itemName.trim()) {
      const [first, ...rest] = parsed;
      setItemName(first.name);
      if (first.qty) setQuantity(first.qty);
      setUnit(first.unit);
      setExtra((ls) => [...ls, ...rest]);
    } else {
      setExtra((ls) => [...ls, ...parsed]);
    }
    setPasteText("");
    setPasteOpen(false);
  };
  const contactReady = signedIn && Boolean(contactName && companyName && contactPhone) && !editContact;
  const plusDays = (n: number): string => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const NEEDED_BY = [
    { days: 7, en: "This week", ar: "هذا الأسبوع" },
    { days: 14, en: "2 weeks", ar: "أسبوعين" },
    { days: 30, en: "1 month", ar: "شهر" },
    { days: 0, en: "Flexible", ar: "مرن" },
  ];
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const cityLabel = CITIES.find((c) => c.value === city);
  const summaryCity = city === "Other" ? region || L("Other city", "مدينة أخرى") : cityLabel ? (isAr ? cityLabel.ar : cityLabel.en) : city;
  const unitLabel = UNITS.find((u) => u.value === unit);

  // Live reach preview (D18): how many suppliers this request would go to, before sending.
  const [reach, setReach] = useState<{ suppliers: number; verified: number } | null>(null);
  useEffect(() => {
    if (!itemName.trim() && !categoryId && !productId) {
      setReach(null);
      return;
    }
    const ctrl = new AbortController();
    const id = window.setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ q: itemName.trim() });
        if (categoryId) qs.set("categoryId", categoryId);
        if (productId) qs.set("productId", productId);
        if (city && city !== "Other") qs.set("city", city);
        const j = await fetch(`/api/rfqs/preview?${qs}`, { signal: ctrl.signal }).then((r) => r.json());
        if (j?.success) setReach({ suppliers: j.data.suppliers, verified: j.data.verified });
      } catch {
        /* preview is a hint only */
      }
    }, 500);
    return () => {
      window.clearTimeout(id);
      ctrl.abort();
    };
  }, [itemName, categoryId, productId, city]);

  // Draft survives a sign-in or a closed tab (D17). URL prefill (search, product) wins over the draft.
  const DRAFT_KEY = "hukum_rfq_draft";
  const [draftRestored, setDraftRestored] = useState(false);
  useEffect(() => {
    if (preQ || productId) return;
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") as Record<string, string> | null;
      if (!d?.itemName) return;
      setItemName(d.itemName);
      if (d.quantity) setQuantity(d.quantity);
      if (d.unit) setUnit(d.unit);
      if (d.specifications) setSpecifications(d.specifications);
      if (d.city) setCity(d.city);
      if (d.region) setRegion(d.region);
      if (d.deliveryDate) setDeliveryDate(d.deliveryDate);
      if (d.extra) setExtra(JSON.parse(d.extra) as Line[]);
      setDraftRestored(true);
    } catch {
      /* storage blocked */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (rfqId) {
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      return;
    }
    if (!itemName.trim()) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ itemName, quantity, unit, specifications, city, region, deliveryDate, extra: JSON.stringify(extra) }));
    } catch {
      /* storage blocked */
    }
  }, [itemName, quantity, unit, specifications, city, region, deliveryDate, extra, rfqId]);

  return (
    <div className="rfq2" dir={isAr ? "rtl" : "ltr"}>
      <div className="rfq2__wrap">
        <header className="rfq2__head">
          <h1>{L("Request quotes", "اطلب عروض أسعار")}</h1>
          <p>
            {rfqPromise(locale)}
          </p>
          <ul className="rfq2__trust">
            <li><CheckCircle2 size={15} aria-hidden /> {L("Free for buyers", "مجاني للمشترين")}</li>
            <li><ShieldCheck size={15} aria-hidden /> {L("Your number stays private until you accept a quote", "رقمك يبقى خاصاً حتى تقبل عرضاً")}</li>
            <li><Truck size={15} aria-hidden /> {L("Suppliers across the Kingdom", "موردون في كل المملكة")}</li>
          </ul>
        </header>

        <form onSubmit={handleCreate} className="rfq2__grid">
          <div className="rfq2__main">
            <section className="rfq2__card">
              <h2><span>1</span>{L("What do you need?", "وش تحتاج؟")}</h2>
              <div className="rfq2__types" role="radiogroup" aria-label={L("Request type", "نوع الطلب")}>
                {REQUEST_TYPES.map((t) => (
                  <button key={t.value} type="button" role="radio" aria-checked={requestType === t.value} className={requestType === t.value ? "is-on" : ""} onClick={() => setRequestType(t.value)}>
                    {isAr ? t.ar : t.en}
                  </button>
                ))}
              </div>
              <label className="rfq2__field rfq2__field--big">
                <span>{L("Product or service", "المنتج أو الخدمة")} <em>*</em></span>
                <input id="rfq-item" required value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder={L("e.g. Safety helmets, white, EN 397", "مثال: خوذ سلامة بيضاء EN 397")} />
              </label>
              <div className="rfq2__row">
                <label className="rfq2__field">
                  <span>{L("Quantity", "الكمية")} <em>*</em></span>
                  <input id="rfq-qty" required inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/[^\d.]/g, ""))} placeholder="500" />
                </label>
                <label className="rfq2__field">
                  <span>{L("Unit", "الوحدة")}</span>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                    {UNITS.map((u) => <option key={u.value} value={u.value}>{isAr ? u.ar : u.en}</option>)}
                  </select>
                </label>
              </div>
              <label className="rfq2__field">
                <span>{L("Details for suppliers", "تفاصيل للمورد")} <small>{L("optional", "اختياري")}</small></span>
                <textarea rows={3} value={specifications} onChange={(e) => setSpecifications(e.target.value)} placeholder={L("Size, material, standard (e.g. SASO), colour, brand…", "المقاس، الخامة، المواصفة (مثل SASO)، اللون، العلامة…")} />
              </label>

              {extra.length ? (
                <ol className="rfq2__lines" aria-label={L("More items", "منتجات إضافية")}>
                  {extra.map((l, i) => (
                    <li key={i} className="rfq2__line">
                      <span className="rfq2__line-n" aria-hidden>{i + 2}</span>
                      <input aria-label={L(`Item ${i + 2}`, `المنتج ${i + 2}`)} value={l.name} onChange={(e) => setLine(i, { name: e.target.value })} placeholder={L("Item name", "اسم المنتج")} />
                      <input aria-label={L("Quantity", "الكمية")} inputMode="decimal" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value.replace(/[^\d.]/g, "") })} placeholder={L("Qty", "الكمية")} />
                      <select aria-label={L("Unit", "الوحدة")} value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value })}>
                        {UNITS.map((u) => <option key={u.value} value={u.value}>{isAr ? u.ar : u.en}</option>)}
                      </select>
                      <button type="button" className="rfq2__line-x" aria-label={L("Remove item", "حذف المنتج")} onClick={() => setExtra((ls) => ls.filter((_, j) => j !== i))}>
                        <X size={16} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ol>
              ) : null}

              <div className="rfq2__add">
                <button type="button" onClick={() => setExtra((ls) => [...ls, { name: "", qty: "", unit: "piece", specs: "" }])}>
                  <Plus size={15} aria-hidden /> {L("Add another item", "أضف منتجاً آخر")}
                </button>
                <button type="button" aria-expanded={pasteOpen} onClick={() => setPasteOpen((v) => !v)}>
                  <ListPlus size={15} aria-hidden /> {L("Paste a list", "الصق قائمة")}
                </button>
                <Link href={`/${locale}/upload-boq`}>
                  <FileSpreadsheet size={15} aria-hidden /> {L("Upload a BOQ", "ارفع جدول كميات")}
                </Link>
              </div>
              {pasteOpen ? (
                <div className="rfq2__paste">
                  <label className="rfq2__field">
                    <span>{L("One item per line, with quantity if you have it", "منتج في كل سطر، مع الكمية إن وجدت")}</span>
                    <textarea rows={5} value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={L("500 pcs safety helmets\nNitrile gloves - 1000 pairs\nHi-vis vests x 200", "500 خوذة سلامة\nقفازات نتريل - 1000 زوج\nسترات عاكسة × 200")} />
                  </label>
                  <button type="button" className="rfq2__paste-go" disabled={!parseItemList(pasteText).length} onClick={addPasted}>
                    {(() => {
                      const n = parseItemList(pasteText).length;
                      return n ? L(`Add ${n} item${n === 1 ? "" : "s"}`, `أضف ${n} ${n === 1 ? "منتج" : "منتجات"}`) : L("Add items", "أضف المنتجات");
                    })()}
                  </button>
                </div>
              ) : null}
            </section>

            <section className="rfq2__card">
              <h2><span>2</span>{L("Where and when?", "وين ومتى؟")}</h2>
              <div className="rfq2__field">
                <span>{L("Deliver to", "التوصيل إلى")} <em>*</em></span>
                <div className="rfq2__chips">
                  {CITIES.map((c) => (
                    <button key={c.value} type="button" className={city === c.value ? "is-on" : ""} onClick={() => setCity(c.value)}>
                      {isAr ? c.ar : c.en}
                    </button>
                  ))}
                </div>
                {city === "Other" ? (
                  <input className="rfq2__mt" value={region} onChange={(e) => setRegion(e.target.value)} placeholder={L("City name", "اسم المدينة")} required />
                ) : null}
              </div>
              <div className="rfq2__field">
                <span>{L("Needed by", "مطلوب قبل")}</span>
                <div className="rfq2__chips">
                  {NEEDED_BY.map((n) => {
                    const v = n.days ? plusDays(n.days) : "";
                    return (
                      <button key={n.en} type="button" className={deliveryDate === v ? "is-on" : ""} onClick={() => { setDeliveryDate(v); if (!deadline && n.days) setDeadline(plusDays(Math.min(5, n.days - 2))); }}>
                        {isAr ? n.ar : n.en}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="rfq2__card">
              <h2><span>3</span>{L("How suppliers reach you", "كيف يتواصل معك الموردون")}</h2>
              {contactReady ? (
                <div className="rfq2__me">
                  <p><b>{contactName}</b> <span>{companyName}</span> <span dir="ltr">{contactPhone}</span></p>
                  <button type="button" onClick={() => setEditContact(true)}>{L("Edit", "تعديل")}</button>
                </div>
              ) : (
              <>
              <div className="rfq2__row">
                <label className="rfq2__field">
                  <span>{L("Your name", "اسمك")} <em>*</em></span>
                  <input required value={contactName} onChange={(e) => setContactName(e.target.value)} autoComplete="name" />
                </label>
                <label className="rfq2__field">
                  <span>{L("Company", "الشركة")} <em>*</em></span>
                  <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} autoComplete="organization" />
                </label>
              </div>
              <div className="rfq2__row">
                <label className="rfq2__field">
                  <span>{L("Mobile / WhatsApp", "الجوال / واتساب")} <em>*</em></span>
                  <input required type="tel" dir="ltr" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+966 5X XXX XXXX" autoComplete="tel" />
                </label>
                <label className="rfq2__field">
                  <span>{L("Email", "البريد")} <small>{L("optional", "اختياري")}</small></span>
                  <input type="email" dir="ltr" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} autoComplete="email" />
                </label>
              </div>
              </>
              )}
            </section>

            <section className="rfq2__card rfq2__card--more">
              <button type="button" className="rfq2__more" aria-expanded={more} onClick={() => setMore((v) => !v)}>
                <ClipboardList size={16} aria-hidden />
                {L("Add budget, payment terms, certificates…", "أضف الميزانية وشروط الدفع والشهادات…")}
                <small>{L("optional", "اختياري")}</small>
              </button>
              {more ? (
                <div className="rfq2__more-body">
                  <div className="rfq2__row">
                    <label className="rfq2__field">
                      <span>{L("Budget", "الميزانية")}</span>
                      <input inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^\d.]/g, ""))} placeholder="SAR" />
                    </label>
                    <label className="rfq2__field">
                      <span>{L("Currency", "العملة")}</span>
                      <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                        {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{isAr ? c.ar : c.en}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="rfq2__row">
                    <label className="rfq2__field">
                      <span>{L("Payment terms", "شروط الدفع")}</span>
                      <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}>
                        <option value="">{L("Any", "أي")}</option>
                        {PAYMENT_TERMS.map((t) => <option key={t.value} value={t.value}>{isAr ? t.ar : t.en}</option>)}
                      </select>
                    </label>
                    <label className="rfq2__field">
                      <span>Incoterms</span>
                      <select value={incoterms} onChange={(e) => setIncoterms(e.target.value)}>
                        <option value="">{L("Any", "أي")}</option>
                        {INCOTERMS.map((t) => <option key={t.value} value={t.value}>{isAr ? t.ar : t.en}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="rfq2__row">
                    <label className="rfq2__field">
                      <span>{L("Brand preference", "العلامة المفضلة")}</span>
                      <input value={brandPreference} onChange={(e) => setBrandPreference(e.target.value)} />
                    </label>
                    <label className="rfq2__field">
                      <span>{L("Required certificates", "الشهادات المطلوبة")}</span>
                      <input value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder="SASO, ISO 9001…" />
                    </label>
                  </div>
                  <div className="rfq2__row">
                    <label className="rfq2__field">
                      <span>{L("Delivery date", "تاريخ التسليم")}</span>
                      <input type="date" min={todayIso} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                    </label>
                    <label className="rfq2__field">
                      <span>{L("Quotes needed by", "آخر موعد للعروض")}</span>
                      <input type="date" min={todayIso} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                    </label>
                  </div>
                  <label className="rfq2__field">
                    <span>{L("Delivery address", "عنوان التسليم")}</span>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} />
                  </label>
                  <div className="rfq2__toggles">
                    <label><input type="checkbox" checked={samplesNeeded} onChange={(e) => setSamplesNeeded(e.target.checked)} /> {L("Samples first", "عينات أولاً")}</label>
                    <label><input type="checkbox" checked={installationNeeded} onChange={(e) => setInstallationNeeded(e.target.checked)} /> {L("Installation", "تركيب")}</label>
                    <label><input type="checkbox" checked={warrantyNeeded} onChange={(e) => setWarrantyNeeded(e.target.checked)} /> {L("Warranty", "ضمان")}</label>
                  </div>
                  <label className="rfq2__field">
                    <span>{L("Notes", "ملاحظات")}</span>
                    <textarea rows={2} value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} />
                  </label>
                </div>
              ) : null}
            </section>
          </div>

          <aside className="rfq2__side">
            <div className="rfq2__summary">
              <p className="rfq2__label">{L("Your request", "طلبك")}</p>
              {draftRestored ? (
                <p className="rfq2__ok">
                  {searchParams.get("from") === "boq"
                    ? L(`Loaded ${extra.length + 1} items from your BOQ. Add the delivery city and send.`, `حمّلنا ${extra.length + 1} بنود من جدولك. أضف مدينة التوصيل وأرسل.`)
                    : L("We kept your draft from last time.", "حفظنا مسودتك من المرة السابقة.")}
                </p>
              ) : null}
              <p className="rfq2__what">
                {extraLines.length ? L(`${extraLines.length + 1} items`, `${extraLines.length + 1} منتجات`) : itemName || L("Product or service", "المنتج أو الخدمة")}
              </p>
              {extraLines.length ? (
                <ul className="rfq2__sumlines">
                  {[{ name: itemName, qty: quantity, unit, specs: "" }, ...extraLines].map((l, i) => (
                    <li key={i}><span>{l.name}</span>{l.qty ? <b>{l.qty} {(() => { const u = UNITS.find((x) => x.value === l.unit); return u ? (isAr ? u.ar : u.en) : l.unit; })()}</b> : null}</li>
                  ))}
                </ul>
              ) : null}
              <dl>
                {extraLines.length ? null : <div><dt>{L("Quantity", "الكمية")}</dt><dd>{quantity ? `${quantity} ${unitLabel ? (isAr ? unitLabel.ar : unitLabel.en) : unit}` : "—"}</dd></div>}
                <div><dt>{L("Deliver to", "التوصيل")}</dt><dd>{summaryCity}</dd></div>
                <div><dt>{L("Needed by", "مطلوب قبل")}</dt><dd>{deliveryDate || L("Flexible", "مرن")}</dd></div>
              </dl>
              {reach ? (
                <p className={`rfq2__reach${reach.suppliers ? "" : " is-zero"}`} aria-live="polite">
                  {reach.suppliers
                    ? L(
                        `Reaches ${reach.suppliers} supplier${reach.suppliers === 1 ? "" : "s"} who sell this${reach.verified ? ` (${reach.verified} verified)` : ""}`,
                        `يصل إلى ${reach.suppliers} ${reach.suppliers === 1 ? "مورد" : "موردين"} يبيعون هذا المنتج${reach.verified ? ` (${reach.verified} موثّق)` : ""}`
                      )
                    : L("No listed supplier yet — the Hukum team will source it for you", "لا يوجد مورد مسجّل حالياً — فريق حكم يبحث لك عن موردين")}
                </p>
              ) : null}
              {error ? <p className="rfq2__error" role="alert">{error}</p> : null}
              {message ? <p className="rfq2__ok">{message}</p> : null}
              <button type="submit" className="rfq2__send" disabled={loading || !!rfqId}>
                {loading
                  ? L("Sending…", "جارٍ الإرسال…")
                  : rfqId
                    ? L("Sent", "تم الإرسال")
                    : !signedIn
                      ? L("Sign in and send", "سجّل الدخول وأرسل")
                      : extraLines.length
                        ? L(`Send request for ${extraLines.length + 1} items`, `أرسل طلب ${extraLines.length + 1} منتجات`)
                        : L("Send request", "أرسل الطلب")}
              </button>
              {!signedIn ? <p className="rfq2__hint">{L("You confirm with your mobile number. Your request is kept while you sign in.", "تأكيد برقم جوالك، وطلبك محفوظ أثناء تسجيل الدخول.")}</p> : null}
              <ol className="rfq2__next">
                <li>{L("We send it to suppliers who sell this.", "نرسله للموردين اللي يبيعون هذا المنتج.")}</li>
                <li>{L("Their quotes arrive in your account.", "تصلك عروضهم في حسابك.")}</li>
                <li>{L("You compare and accept one — then contacts unlock.", "تقارن وتقبل عرضاً — ثم تظهر بيانات التواصل.")}</li>
              </ol>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
