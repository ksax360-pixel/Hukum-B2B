import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { aiProvider } from "@/modules/ai/provider";
import {
  extractProductsFromText,
  translateText,
  generateSeo,
  understandRfq,
  moderateContent,
} from "@/modules/ai/ai.service";
import { AIExtraction, PromptTemplate } from "@/modules/platform/platform.model";
import { jobQueue } from "@/lib/queue";

export async function GET(req: Request) {
  try {
    await requireSession("ai:view");
    await connectDB();
    const sp = new URL(req.url).searchParams;
    if (sp.get("resource") === "prompts") {
      return ok(await PromptTemplate.find().sort({ key: 1 }).lean());
    }
    if (sp.get("resource") === "extractions") {
      return ok(await AIExtraction.find().sort({ createdAt: -1 }).limit(50).lean());
    }
    return ok({
      configured: aiProvider.isConfigured(),
      model: process.env.AI_MODEL || "gpt-4o-mini",
      threshold: Number(process.env.AI_CONFIDENCE_THRESHOLD || 0.8),
    });
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession("ai:create");
    await connectDB();
    const body = await req.json();
    const action = body.action as string;

    if (!aiProvider.isConfigured() && action !== "save_prompt") {
      return fail("AI provider not configured", 503);
    }

    if (action === "extract_products") {
      const queued = await jobQueue.enqueue({ name: "ai.extract_products", payload: { userId: session.id } });
      const record = await AIExtraction.create({
        type: "product",
        status: "processing",
        stages: [
          { name: "queued", status: "done", at: new Date() },
          { name: "extracting", status: "running", at: new Date() },
        ],
        createdBy: session.id,
        vendorId: session.vendorId,
        sourceUrl: body.sourceUrl,
      });
      try {
        const result = await extractProductsFromText(body.text || "");
        record.extracted = result.extracted;
        record.confidence = result.threshold;
        record.status = "needs_review";
        record.stages.push({ name: "completed", status: "done", at: new Date() });
        await record.save();
        return ok({ extraction: record, queue: queued }, "Extraction ready for human review");
      } catch (err) {
        record.status = "failed";
        record.errorMessages = [(err as Error).message];
        await record.save();
        throw err;
      }
    }

    if (action === "translate") {
      const result = await translateText(body.text, body.from || "en", body.to || "ar");
      return ok(result);
    }

    if (action === "seo") {
      const result = await generateSeo(body);
      return ok(result);
    }

    if (action === "understand_rfq") {
      const result = await understandRfq(body.text);
      return ok(result);
    }

    if (action === "moderate") {
      const result = await moderateContent(body.text);
      return ok(result);
    }

    if (action === "save_prompt") {
      await requireSession("ai:configure");
      const doc = await PromptTemplate.findOneAndUpdate(
        { key: body.key },
        {
          key: body.key,
          name: body.name,
          prompt: body.prompt,
          $inc: { version: 1 },
          active: body.active !== false,
          createdBy: session.id,
        },
        { upsert: true, new: true }
      );
      return ok(doc);
    }

    return fail("Unknown action", 400);
  } catch (e) {
    const err = e as Error & { status?: number };
    return fail(err.message, err.status || 500);
  }
}
