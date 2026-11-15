export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type AICompletionResult = {
  content: string;
  model: string;
  usage?: { promptTokens?: number; completionTokens?: number };
};

export type AIImageResult = {
  buffer: Buffer;
  mimeType: string;
  model: string;
  revisedPrompt?: string;
};

export interface AIProvider {
  isConfigured(): boolean;
  complete(messages: ChatMessage[], options?: { temperature?: number }): Promise<AICompletionResult>;
  generateImage(prompt: string, options?: { size?: string }): Promise<AIImageResult>;
}

export class OpenAICompatibleProvider implements AIProvider {
  constructor(
    private apiKey = process.env.AI_API_KEY || "",
    private baseUrl = process.env.AI_BASE_URL || "https://api.openai.com/v1",
    private model = process.env.AI_MODEL || "gpt-4o-mini",
    private imageModel = process.env.AI_IMAGE_MODEL || "dall-e-3"
  ) {}

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async complete(messages: ChatMessage[], options?: { temperature?: number }): Promise<AICompletionResult> {
    if (!this.isConfigured()) {
      throw Object.assign(new Error("AI provider not configured"), { status: 503, code: "AI_NOT_CONFIGURED" });
    }
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: options?.temperature ?? 0.2,
        messages,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw Object.assign(new Error(`AI provider error: ${res.status} ${text}`), { status: 502 });
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      model?: string;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    return {
      content: json.choices?.[0]?.message?.content || "",
      model: json.model || this.model,
      usage: {
        promptTokens: json.usage?.prompt_tokens,
        completionTokens: json.usage?.completion_tokens,
      },
    };
  }

  /** OpenAI image models (gpt-image-*) — returns PNG buffer (no stock library). */
  async generateImage(prompt: string, options?: { size?: string }): Promise<AIImageResult> {
    if (!this.isConfigured()) {
      throw Object.assign(new Error("AI provider not configured"), { status: 503, code: "AI_NOT_CONFIGURED" });
    }
    const size = options?.size || process.env.AI_IMAGE_SIZE || "1024x1024";
    // Newer gpt-image models reject response_format / dall-e-only params — request defaults (b64).
    const payload: Record<string, unknown> = {
      model: this.imageModel,
      prompt: prompt.slice(0, 3900),
      n: 1,
      size,
    };
    // Legacy dall-e-* still accepts response_format when explicitly configured.
    if (/^dall-e/i.test(this.imageModel)) {
      payload.response_format = "b64_json";
    }
    const res = await fetch(`${this.baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw Object.assign(new Error(`AI image error: ${res.status} ${text}`), { status: 502 });
    }
    const json = (await res.json()) as {
      data?: { b64_json?: string; url?: string; revised_prompt?: string }[];
    };
    const item = json.data?.[0];
    if (item?.b64_json) {
      return {
        buffer: Buffer.from(item.b64_json, "base64"),
        mimeType: "image/png",
        model: this.imageModel,
        revisedPrompt: item.revised_prompt,
      };
    }
    if (item?.url) {
      const imgRes = await fetch(item.url);
      if (!imgRes.ok) {
        throw Object.assign(new Error(`Failed to download generated image: ${imgRes.status}`), { status: 502 });
      }
      const ab = await imgRes.arrayBuffer();
      const ctype = imgRes.headers.get("content-type") || "image/png";
      return {
        buffer: Buffer.from(ab),
        mimeType: ctype.includes("jpeg") ? "image/jpeg" : "image/png",
        model: this.imageModel,
        revisedPrompt: item.revised_prompt,
      };
    }
    throw Object.assign(new Error("AI image response missing data"), { status: 502 });
  }
}

export const aiProvider: AIProvider = new OpenAICompatibleProvider();

export function confidenceThreshold() {
  const n = Number(process.env.AI_CONFIDENCE_THRESHOLD || "0.8");
  return Number.isFinite(n) ? n : 0.8;
}

export function aiImageCount() {
  const n = Number(process.env.AI_IMAGE_COUNT || "3");
  if (!Number.isFinite(n)) return 3;
  return Math.min(3, Math.max(1, Math.round(n)));
}
