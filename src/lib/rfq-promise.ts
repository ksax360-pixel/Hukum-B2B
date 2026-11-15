// The request promise, one wording everywhere a buyer can start a request (Khalid, 2026-11-10).
export const RFQ_PROMISE = {
  en: "We'll get you verified quotations from 3 or more suppliers, in days, not weeks",
  ar: "نجيب لك عروض أسعار من 3 موردين موثّقين أو أكثر، خلال أيام مو أسابيع",
} as const;

export const rfqPromise = (locale: string): string => (locale === "ar" ? RFQ_PROMISE.ar : RFQ_PROMISE.en);
