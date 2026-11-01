"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Package,
  ShieldCheck,
  Truck,
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
  { value: "FCA", en: "FCA — Free Carrier", ar: "FCA — تسليم للناقل" },
  { value: "FOB", en: "FOB — Free on Board", ar: "FOB — تسليم على ظهر السفينة" },
  { value: "CIF", en: "CIF — Cost, Insurance & Freight", ar: "CIF — التكلفة والتأمين والشحن" },
  { value: "DAP", en: "DAP — Delivered at Place", ar: "DAP — التسليم في المكان" },
  { value: "DDP", en: "DDP — Delivered Duty Paid", ar: "DDP — تسليم مع الرسوم" },
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

  const [title, setTitle] = useState("");
  const [requestType, setRequestType] = useState("product");
  const [itemName, setItemName] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("piece");
  const [brandPreference, setBrandPreference] = useState("");
  const [certifications, setCertifications] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [incoterms, setIncoterms] = useState("");
  const [city, setCity] = useState("Riyadh");
  const [region, setRegion] = useState("");
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
  const [categoryId, setCategoryId] = useState("");
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
          titleEn: title,
          descriptionText,
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
      setMessage(
        isAr
          ? "تم إنشاء طلب عرض السعر. يمكنك الآن مطابقة الموردين المناسبين."
          : "RFQ created. You can now match relevant vendors."
      );
      router.push(`/${locale}/rfq/sent?ref=${encodeURIComponent(createdId)}`);
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
      setMessage(isAr ? "تمت دعوة الموردين المطابقين." : "Matching vendors have been invited.");
    } catch {
      setError(isAr ? "خطأ في الشبكة" : "Network error");
    } finally {
      setMatching(false);
    }
  }

  return (
    <div className="kt-rfq">
      <header className="kt-rfq__hero">
        <div className="container-custom kt-rfq__hero-inner">
          <p className="kt-rfq__eyebrow">{isAr ? "طلب عرض سعر" : "Request for quotation"}</p>
          <h1 className="kt-rfq__title">{isAr ? "أنشئ طلب عرض سعر دقيق" : "Create a precise RFQ"}</h1>
          <p className="kt-rfq__lead">
            {isAr
              ? "كل تفصيل تضيفه هنا يصل إلى المورد مباشرة. كلما كان الطلب أوضح، كانت العروض أسرع وأكثر دقة — وأقل حاجة للتوضيح لاحقاً."
              : "Everything you enter here is sent to suppliers. The clearer your request, the faster and more accurate their quotes — with far fewer follow-up questions."}
          </p>
          <ul className="kt-rfq__steps" aria-hidden>
            <li>
              <span>01</span>
              {isAr ? "صف الاحتياج" : "Define need"}
            </li>
            <li>
              <span>02</span>
              {isAr ? "الشروط والتسليم" : "Terms & delivery"}
            </li>
            <li>
              <span>03</span>
              {isAr ? "أرسل وطابق" : "Submit & match"}
            </li>
          </ul>
        </div>
      </header>

      <div className="container-custom kt-rfq__body">
        <aside className="kt-rfq__aside">
          <div className="kt-rfq__aside-card">
            <p className="kt-rfq__aside-label">{isAr ? "لماذا نطلب هذه البيانات؟" : "Why we ask for this"}</p>
            <h2 className="kt-rfq__aside-title">
              {isAr ? "ما يحتاجه المورد لتسعير صحيح" : "What vendors need to quote properly"}
            </h2>
            <ul className="kt-rfq__checklist">
              {checklist.map((item) => (
                <li key={item.title}>
                  <span className="kt-rfq__check-icon">
                    <item.icon size={16} strokeWidth={1.75} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.copy}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="kt-rfq__aside-note">
              <FileText size={15} strokeWidth={1.75} />
              <p>
                {isAr
                  ? "الحقول ذات العلامة مطلوبة. الباقي اختياري لكنه يحسّن جودة العروض بشكل كبير."
                  : "Marked fields are required. The rest is optional — but dramatically improves quote quality."}
              </p>
            </div>
          </div>
        </aside>

        <form onSubmit={handleCreate} className="kt-rfq__form">
          {/* 1 — Requirement */}
          <section className="kt-rfq__section">
            <header className="kt-rfq__section-head">
              <span className="kt-rfq__section-num">01</span>
              <div>
                <h2>{isAr ? "نظرة عامة على الطلب" : "Requirement overview"}</h2>
                <p>{isAr ? "عنوان واضح ونوع الطلب حتى يفهم المورد السياق فوراً." : "A clear title and request type so vendors grasp the context instantly."}</p>
              </div>
            </header>

            <div className="kt-rfq__fields">
              <div className="kt-rfq__field kt-rfq__field--full">
                <label htmlFor="rfq-title">
                  {isAr ? "عنوان الطلب" : "RFQ title"} <em>*</em>
                </label>
                <input
                  id="rfq-title"
                  className="kt-rfq__input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder={
                    isAr
                      ? "مثال: توريد 500 كوب طباعة مخصّصة للفعاليات"
                      : "e.g. Supply of 500 custom printed event cups"
                  }
                />
              </div>

              <div className="kt-rfq__field">
                <label htmlFor="rfq-type">{isAr ? "نوع الطلب" : "Request type"}</label>
                <KtSelect
                  id="rfq-type"
                  value={requestType}
                  onChange={setRequestType}
                  options={opts(REQUEST_TYPES, isAr)}
                  placeholder={isAr ? "اختر النوع" : "Select type"}
                />
              </div>

              <div className="kt-rfq__field">
                <label htmlFor="rfq-item">
                  {isAr ? "اسم المنتج / الخدمة" : "Product / service name"} <em>*</em>
                </label>
                <input
                  id="rfq-item"
                  className="kt-rfq__input"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                  placeholder={isAr ? "مثال: كوب سيراميك مطبوع" : "e.g. Printed ceramic mug"}
                />
              </div>

              <div className="kt-rfq__field kt-rfq__field--full">
                <label htmlFor="rfq-desc">
                  {isAr ? "وصف الاحتياج" : "Need description"} <em>*</em>
                </label>
                <textarea
                  id="rfq-desc"
                  className="kt-rfq__input kt-rfq__textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder={
                    isAr
                      ? "اشرح الاستخدام، الجودة المتوقعة، والهدف من الشراء…"
                      : "Explain use case, expected quality, and why you are buying…"
                  }
                />
              </div>
            </div>
          </section>

          {/* 2 — Specs & quantity */}
          <section className="kt-rfq__section">
            <header className="kt-rfq__section-head">
              <span className="kt-rfq__section-num">02</span>
              <div>
                <h2>{isAr ? "المواصفات والكمية" : "Specifications & quantity"}</h2>
                <p>
                  {isAr
                    ? "التفاصيل الفنية التي يسأل عنها المورد عادةً قبل إرسال السعر."
                    : "The technical details vendors almost always ask before sending a price."}
                </p>
              </div>
            </header>

            <div className="kt-rfq__fields">
              <div className="kt-rfq__field kt-rfq__field--full">
                <label htmlFor="rfq-specs">
                  {isAr ? "المواصفات الفنية" : "Technical specifications"} <em>*</em>
                </label>
                <textarea
                  id="rfq-specs"
                  className="kt-rfq__input kt-rfq__textarea"
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  required
                  rows={5}
                  placeholder={
                    isAr
                      ? "الأبعاد، المواد، الألوان، الطباعة، المعايير، التوافق، أو أي متطلبات فنية…"
                      : "Dimensions, materials, colours, print, standards, compatibility, or any technical requirements…"
                  }
                />
              </div>

              <div className="kt-rfq__field">
                <label htmlFor="rfq-qty">
                  {isAr ? "الكمية" : "Quantity"} <em>*</em>
                </label>
                <input
                  id="rfq-qty"
                  type="number"
                  min={1}
                  className="kt-rfq__input"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  placeholder="100"
                />
              </div>

              <div className="kt-rfq__field">
                <label htmlFor="rfq-unit">{isAr ? "وحدة القياس" : "Unit of measure"}</label>
                <KtSelect
                  id="rfq-unit"
                  value={unit}
                  onChange={setUnit}
                  options={opts(UNITS, isAr)}
                  placeholder={isAr ? "الوحدة" : "Unit"}
                />
              </div>

              <div className="kt-rfq__field">
                <label htmlFor="rfq-brand">{isAr ? "تفضيل العلامة" : "Brand preference"}</label>
                <input
                  id="rfq-brand"
                  className="kt-rfq__input"
                  value={brandPreference}
                  onChange={(e) => setBrandPreference(e.target.value)}
                  placeholder={isAr ? "أو اكتب: لا تفضيل / مكافئ" : "Or write: no preference / equivalent"}
                />
              </div>

              <div className="kt-rfq__field">
                <label htmlFor="rfq-certs">{isAr ? "شهادات مطلوبة" : "Required certifications"}</label>
                <input
                  id="rfq-certs"
                  className="kt-rfq__input"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder={isAr ? "مثال: ISO، SASO، FDA…" : "e.g. ISO, SASO, FDA…"}
                />
              </div>
            </div>
          </section>

          {/* 3 — Commercial */}
          <section className="kt-rfq__section">
            <header className="kt-rfq__section-head">
              <span className="kt-rfq__section-num">03</span>
              <div>
                <h2>{isAr ? "الشروط التجارية" : "Commercial terms"}</h2>
                <p>
                  {isAr
                    ? "ساعد المورد على تقديم عرض قابل للمقارنة — وليس تقديراً عاماً."
                    : "Help vendors return a comparable offer — not a vague estimate."}
                </p>
              </div>
            </header>

            <div className="kt-rfq__fields">
              <div className="kt-rfq__field">
                <label htmlFor="rfq-budget">{isAr ? "الميزانية التقديرية" : "Indicative budget"}</label>
                <input
                  id="rfq-budget"
                  type="number"
                  min={0}
                  step="0.01"
                  className="kt-rfq__input"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder={isAr ? "اختياري لكن مفيد" : "Optional but helpful"}
                />
              </div>

              <div className="kt-rfq__field">
                <label htmlFor="rfq-currency">{isAr ? "العملة" : "Currency"}</label>
                <KtSelect
                  id="rfq-currency"
                  value={currency}
                  onChange={setCurrency}
                  options={opts(CURRENCIES, isAr)}
                  placeholder="SAR"
                />
              </div>

              <div className="kt-rfq__field">
                <label htmlFor="rfq-pay">{isAr ? "شروط الدفع" : "Payment terms"}</label>
                <KtSelect
                  id="rfq-pay"
                  value={paymentTerms}
                  onChange={setPaymentTerms}
                  options={opts(PAYMENT_TERMS, isAr, isAr ? "اختر…" : "Select…")}
                  placeholder={isAr ? "اختر…" : "Select…"}
                />
              </div>

              <div className="kt-rfq__field">
                <label htmlFor="rfq-incoterms">{isAr ? "الإنكوترمز" : "Incoterms"}</label>
                <KtSelect
                  id="rfq-incoterms"
                  value={incoterms}
                  onChange={setIncoterms}
                  options={opts(INCOTERMS, isAr, isAr ? "اختر…" : "Select…")}
                  placeholder={isAr ? "اختر…" : "Select…"}
                />
              </div>

              <div className="kt-rfq__field">
                <label htmlFor="rfq-deadline">{isAr ? "آخر موعد لاستلام العروض" : "Quote deadline"}</label>
                <input
                  id="rfq-deadline"
                  type="date"
                  className="kt-rfq__input"
                  value={deadline}
                  min={todayIso}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* 4 — Delivery */}
          <section className="kt-rfq__section">
            <header className="kt-rfq__section-head">
              <span className="kt-rfq__section-num">04</span>
              <div>
                <h2>{isAr ? "التسليم والجدول" : "Delivery & timeline"}</h2>
                <p>
                  {isAr
                    ? "الموقع والموعد يؤثران مباشرة على التكلفة ووقت التوريد."
                    : "Location and timing directly affect cost and lead time."}
                </p>
              </div>
            </header>

            <div className="kt-rfq__fields">
              <div className="kt-rfq__field">
                <label htmlFor="rfq-city">
                  {isAr ? "مدينة التسليم" : "Delivery city"} <em>*</em>
                </label>
                <KtSelect
                  id="rfq-city"
                  value={city}
                  onChange={setCity}
                  options={opts(CITIES, isAr)}
                  placeholder={isAr ? "المدينة" : "City"}
                  required
                />
              </div>

              <div className="kt-rfq__field">
                <label htmlFor="rfq-region">{isAr ? "المنطقة / الحي" : "Region / district"}</label>
                <input
                  id="rfq-region"
                  className="kt-rfq__input"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder={isAr ? "اختياري" : "Optional"}
                />
              </div>

              <div className="kt-rfq__field kt-rfq__field--full">
                <label htmlFor="rfq-address">{isAr ? "عنوان التسليم" : "Delivery address"}</label>
                <input
                  id="rfq-address"
                  className="kt-rfq__input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isAr ? "الشارع، المبنى، الرمز البريدي…" : "Street, building, postal code…"}
                />
              </div>

              <div className="kt-rfq__field">
                <label htmlFor="rfq-delivery">
                  {isAr ? "تاريخ التسليم المطلوب" : "Required delivery date"}
                </label>
                <input
                  id="rfq-delivery"
                  type="date"
                  className="kt-rfq__input"
                  value={deliveryDate}
                  min={todayIso}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* 5 — Buyer */}
          <section className="kt-rfq__section">
            <header className="kt-rfq__section-head">
              <span className="kt-rfq__section-num">05</span>
              <div>
                <h2>{isAr ? "بيانات المشتري" : "Buyer details"}</h2>
                <p>
                  {isAr
                    ? "حتى يتمكن المورد وفريقنا من التواصل بسرعة عند الحاجة."
                    : "So vendors and our team can reach you quickly when needed."}
                </p>
              </div>
            </header>

            <div className="kt-rfq__fields">
              <div className="kt-rfq__field">
                <label htmlFor="rfq-company">
                  <Building2 size={12} className="inline-block me-1 opacity-50" />
                  {isAr ? "اسم الشركة" : "Company name"} <em>*</em>
                </label>
                <input
                  id="rfq-company"
                  className="kt-rfq__input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div className="kt-rfq__field">
                <label htmlFor="rfq-contact">
                  {isAr ? "اسم المسؤول" : "Contact person"} <em>*</em>
                </label>
                <input
                  id="rfq-contact"
                  className="kt-rfq__input"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
              </div>

              <div className="kt-rfq__field">
                <label htmlFor="rfq-email">
                  {isAr ? "البريد الإلكتروني" : "Work email"} <em>*</em>
                </label>
                <input
                  id="rfq-email"
                  type="email"
                  className="kt-rfq__input"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
              </div>

              <div className="kt-rfq__field">
                <label htmlFor="rfq-phone">
                  {isAr ? "رقم الجوال" : "Mobile / WhatsApp"} <em>*</em>
                </label>
                <input
                  id="rfq-phone"
                  type="tel"
                  className="kt-rfq__input"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                  placeholder="+966…"
                />
              </div>
            </div>
          </section>

          {/* 6 — Extra vendor questions */}
          <section className="kt-rfq__section">
            <header className="kt-rfq__section-head">
              <span className="kt-rfq__section-num">06</span>
              <div>
                <h2>{isAr ? "متطلبات إضافية للمورد" : "Extra requirements for vendors"}</h2>
                <p>
                  {isAr
                    ? "أجب مسبقاً على الأسئلة التي يطرحها الموردون غالباً قبل التسعير."
                    : "Answer upfront the questions suppliers usually ask before quoting."}
                </p>
              </div>
            </header>

            <div className="kt-rfq__toggles">
              <label className="kt-rfq__toggle">
                <input
                  type="checkbox"
                  checked={samplesNeeded}
                  onChange={(e) => setSamplesNeeded(e.target.checked)}
                />
                <span>
                  <strong>{isAr ? "عينات مطلوبة" : "Samples required"}</strong>
                  <em>{isAr ? "قبل ترسية الطلب" : "Before award / bulk order"}</em>
                </span>
              </label>
              <label className="kt-rfq__toggle">
                <input
                  type="checkbox"
                  checked={installationNeeded}
                  onChange={(e) => setInstallationNeeded(e.target.checked)}
                />
                <span>
                  <strong>{isAr ? "تركيب / تشغيل" : "Installation / commissioning"}</strong>
                  <em>{isAr ? "مطلوب ضمن العرض" : "Must be included in the offer"}</em>
                </span>
              </label>
              <label className="kt-rfq__toggle">
                <input
                  type="checkbox"
                  checked={warrantyNeeded}
                  onChange={(e) => setWarrantyNeeded(e.target.checked)}
                />
                <span>
                  <strong>{isAr ? "الضمان مطلوب" : "Warranty required"}</strong>
                  <em>{isAr ? "اذكر مدة الضمان في العرض" : "State warranty period in the quote"}</em>
                </span>
              </label>
            </div>

            <div className="kt-rfq__fields" style={{ marginTop: "1.25rem" }}>
              <div className="kt-rfq__field kt-rfq__field--full">
                <label htmlFor="rfq-notes">
                  {isAr ? "ملاحظات إضافية للمورد" : "Additional notes for vendors"}
                </label>
                <textarea
                  id="rfq-notes"
                  className="kt-rfq__input kt-rfq__textarea"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={3}
                  placeholder={
                    isAr
                      ? "التعبئة، الملصقات، شروط الزيارة الميدانية، أو أي تفاصيل أخرى…"
                      : "Packaging, labelling, site visit terms, or anything else vendors should know…"
                  }
                />
              </div>
            </div>
          </section>

          {(error || message) && (
            <div className={`kt-rfq__banner${error ? " is-error" : " is-ok"}`}>
              {error ? error : (
                <>
                  <CheckCircle2 size={16} strokeWidth={1.75} />
                  {message}
                </>
              )}
            </div>
          )}

          <div className="kt-rfq__foot">
            <div className="kt-rfq__foot-copy">
              <p>
                {isAr
                  ? "بإرسال هذا الطلب، تؤكد أن البيانات دقيقة ويمكن مشاركتها مع الموردين المطابقين."
                  : "By submitting, you confirm these details are accurate and may be shared with matched vendors."}
              </p>
              {!signedIn ? (
                <p className="kt-rfq__login-hint">
                  {isAr ? "يلزم تسجيل الدخول كمشتري." : "Sign in as a buyer is required."}{" "}
                  <Link href={`/${locale}/login`}>{isAr ? "تسجيل الدخول" : "Log in"}</Link>
                </p>
              ) : (
                <p className="kt-rfq__login-hint">
                  {isAr ? "أنت مسجّل الدخول كمشتري." : "Signed in as a buyer."}
                </p>
              )}
            </div>
            <div className="kt-rfq__actions">
              <button type="submit" className="kt-rfq__submit" disabled={loading || !!rfqId}>
                {loading
                  ? isAr
                    ? "جاري الإرسال…"
                    : "Submitting…"
                  : rfqId
                    ? isAr
                      ? "تم الإرسال"
                      : "Submitted"
                    : isAr
                      ? "إرسال طلب عرض السعر"
                      : "Submit RFQ"}
              </button>
              {rfqId && (
                <button
                  type="button"
                  className="kt-rfq__match"
                  disabled={matching}
                  onClick={handleMatch}
                >
                  {matching
                    ? isAr
                      ? "جاري المطابقة…"
                      : "Matching…"
                    : isAr
                      ? "مطابقة الموردين"
                      : "Match vendors"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
