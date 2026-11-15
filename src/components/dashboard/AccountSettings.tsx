"use client";
// Account settings shared by buyers and suppliers: who you are, language, password, what we email you, leaving.

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, Mail, UserRound } from "lucide-react";
import { toast } from "@/components/ui/Feedback";

type Role = "buyer" | "vendor";
const post = async (body: Record<string, unknown>) => {
  const j = await (await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();
  if (!j.success) throw new Error(j.message);
  return j.data;
};

export function AccountSettings({ locale, role }: { locale: string; role: Role }) {
  const isAr = locale === "ar";
  const L = (en: string, ar: string): string => (isAr ? ar : en);
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [lang, setLang] = useState<"en" | "ar">(isAr ? "ar" : "en");
  const [pw, setPw] = useState({ current: "", next: "" });
  const [busy, setBusy] = useState("");

  useEffect(() => {
    post({ action: "me" })
      .then((d) => {
        setEmail(d?.user?.email || "");
        setName(d?.user?.name || "");
        setMobile(d?.user?.mobile || "");
        if (d?.user?.preferredLanguage === "ar" || d?.user?.preferredLanguage === "en") setLang(d.user.preferredLanguage);
      })
      .catch(() => toast(L("Couldn't load your account. Refresh to try again.", "تعذّر تحميل حسابك. حدّث الصفحة."), "error"))
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("profile");
    try {
      await post({ action: "update_profile", name, mobile: mobile.replace(/[^\d+ ]/g, ""), preferredLanguage: lang });
      toast(L("Saved.", "تم الحفظ."), "success");
      if (lang !== locale) router.push(window.location.pathname.replace(/^\/(en|ar)/, `/${lang}`));
    } catch {
      toast(L("Check the mobile number and try again.", "تأكد من رقم الجوال وحاول مرة ثانية."), "error");
    } finally {
      setBusy("");
    }
  };
  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 8) return toast(L("Use at least 8 characters.", "استخدم ٨ أحرف على الأقل."), "error");
    setBusy("pw");
    try {
      await post({ action: "change_password", ...pw });
      setPw({ current: "", next: "" });
      toast(L("Password changed.", "تم تغيير كلمة المرور."), "success");
    } catch (err) {
      toast((err as Error).message === "Current password is wrong" ? L("Your current password is wrong.", "كلمة المرور الحالية غلط.") : L("Couldn't change it. Try again.", "تعذّر التغيير. حاول مرة ثانية."), "error");
    } finally {
      setBusy("");
    }
  };
  const signOut = async () => {
    await post({ action: "logout" }).catch(() => null);
    router.push(`/${locale}`);
    router.refresh();
  };

  const emails =
    role === "vendor"
      ? [L("A new request matches what you sell", "طلب جديد يطابق منتجاتك"), L("A buyer accepts or asks about your quote", "مشتري يقبل عرضك أو يسأل عنه"), L("Verification and listing reviews", "نتائج التوثيق ومراجعة المنتجات")]
      : [L("A supplier sends you a quote", "مورد يرسل لك عرض سعر"), L("A request is about to close", "طلب قرب يقفل"), L("Replies to your messages", "ردود على رسائلك")];

  return (
    <div className="bh as" dir={isAr ? "rtl" : "ltr"}>
      <header className="bh-head">
        <div>
          <h1>{L("Settings", "الإعدادات")}</h1>
          <p>{L("Your sign-in, language and what we email you.", "بيانات دخولك ولغتك ووش نرسل لك بالإيميل.")}</p>
        </div>
      </header>

      <div className="as-grid">
        <form className="sfe-card" onSubmit={saveProfile} aria-labelledby="as-you">
          <div className="sfe-card__head"><h2 id="as-you" className="as-h"><UserRound size={18} aria-hidden /> {L("You", "بياناتك")}</h2></div>
          <div className="sfe-grid">
            <label className="sfe-field"><span>{L("Full name", "الاسم الكامل")}</span><input maxLength={80} value={name} onChange={(e) => setName(e.target.value)} disabled={!loaded} autoComplete="name" /></label>
            <label className="sfe-field"><span>{L("Mobile", "الجوال")}</span><input type="tel" dir="ltr" value={mobile} onChange={(e) => setMobile(e.target.value)} disabled={!loaded} placeholder="+966 5X XXX XXXX" autoComplete="tel" /></label>
            <label className="sfe-field is-wide"><span>{L("Email", "البريد")} <small>{L("used to sign in", "للدخول")}</small></span><input dir="ltr" value={email} disabled readOnly /></label>
            <fieldset className="sfe-field is-wide">
              <legend>{L("Language", "اللغة")}</legend>
              <div className="td-topics">
                {(["en", "ar"] as const).map((k) => (
                  <label key={k} className={`td-topic${lang === k ? " is-on" : ""}`}>
                    <input type="radio" name="as-lang" checked={lang === k} onChange={() => setLang(k)} /> {k === "en" ? "English" : "العربية"}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="sfe-act"><button type="submit" className="qb-send" disabled={!loaded || busy !== ""}>{busy === "profile" ? L("Saving…", "جارٍ الحفظ…") : L("Save", "احفظ")}</button></div>
        </form>

        <div className="as-side">
          <form className="sfe-card" onSubmit={savePassword} aria-labelledby="as-pw">
            <div className="sfe-card__head"><h2 id="as-pw" className="as-h"><KeyRound size={18} aria-hidden /> {L("Password", "كلمة المرور")}</h2></div>
            <label className="sfe-field"><span>{L("Current password", "كلمة المرور الحالية")}</span><input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
            <label className="sfe-field"><span>{L("New password", "كلمة المرور الجديدة")} <small>{L("8+ characters", "٨ أحرف أو أكثر")}</small></span><input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
            <div className="sfe-act"><button type="submit" className="bh-btn" disabled={busy !== "" || !pw.current || !pw.next}>{busy === "pw" ? L("Changing…", "جارٍ التغيير…") : L("Change password", "غيّر كلمة المرور")}</button></div>
          </form>

          <section className="sfe-card" aria-labelledby="as-mail">
            <h2 id="as-mail" className="as-h"><Mail size={18} aria-hidden /> {L("We email you when", "نرسل لك إيميل لما")}</h2>
            <ul className="as-list">{emails.map((e) => <li key={e}>{e}</li>)}</ul>
            <p className="van-note">{L("We don't send marketing without asking.", "ما نرسل تسويق بدون إذنك.")}</p>
          </section>

          <section className="sfe-card as-leave">
            <button type="button" className="bh-btn" onClick={signOut}><LogOut size={15} aria-hidden /> {L("Sign out", "تسجيل الخروج")}</button>
            <p className="van-note">
              {L("Want to close your account? ", "تبي تقفل حسابك؟ ")}
              <Link href={`/${locale}/${role === "vendor" ? "vendor" : "buyer"}/tickets`}>{L("Ask support", "اطلب من الدعم")}</Link>
              {L(". We remove your data as set out in the privacy policy.", ". نحذف بياناتك حسب سياسة الخصوصية.")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
