// src/lib/cities.ts
// Cities are stored in English; Arabic pages show the Arabic name. One list for the whole site.

export const CITY_AR: Record<string, string> = {
  Riyadh: "الرياض", Jeddah: "جدة", Dammam: "الدمام", Khobar: "الخبر", Dhahran: "الظهران", Mecca: "مكة", Makkah: "مكة",
  Medina: "المدينة", Madinah: "المدينة", Jubail: "الجبيل", Yanbu: "ينبع", Tabuk: "تبوك", Abha: "أبها", Qassim: "القصيم",
  Buraidah: "بريدة", Taif: "الطائف", Hail: "حائل", Jazan: "جازان", Najran: "نجران", NEOM: "نيوم", "Al Ahsa": "الأحساء",
};
const BY_LOWER = new Map(Object.entries(CITY_AR).map(([k, v]) => [k.toLowerCase(), v]));

export function cityName(city: string | undefined, locale: string): string {
  if (!city) return "";
  return locale === "ar" ? BY_LOWER.get(city.trim().toLowerCase()) || city : city;
}
