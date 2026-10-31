/**
 * Email adapter — Resend when RESEND_API_KEY set; else console stub (logged + Notification trail).
 */

export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  tags?: string[];
};

export type EmailResult = { id: string; mode: "resend" | "smtp" | "stub" };

function fromAddress() {
  return process.env.EMAIL_FROM || process.env.RESEND_FROM || "Hukum <noreply@hukum.sa>";
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY || process.env.SMTP_URL);
}

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const to = String(payload.to || "").trim();
  if (!to || !to.includes("@")) {
    return { id: `email_skip_${Date.now()}`, mode: "stub" };
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress(),
          to: [to],
          subject: payload.subject,
          text: payload.text,
          html: payload.html || `<pre style="font-family:sans-serif">${payload.text}</pre>`,
          tags: (payload.tags || []).map((name) => ({ name, value: "hukum" })),
        }),
      });
      const json = (await res.json()) as { id?: string; message?: string };
      if (!res.ok) throw new Error(json.message || "Resend failed");
      return { id: json.id || `resend_${Date.now()}`, mode: "resend" };
    } catch (e) {
      console.warn("[email] Resend error", (e as Error).message);
    }
  }

  console.info("[email] stub →", to, "|", payload.subject, "|", payload.text.slice(0, 120));
  return { id: `stub_email_${Date.now()}`, mode: "stub" };
}
