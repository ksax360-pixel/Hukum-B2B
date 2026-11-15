# AI Architecture

## Principle

AI assists; humans approve consequential actions. Never auto-publish sensitive/important data without required approval.

## Pipeline

```
Upload → Ingest → Extract → Classify → Normalize → Translate → SEO → Validate → Dedupe → Confidence → Human Review → Publish
```

## Abstractions

- `AIProvider` — OpenAI-compatible chat/completions
- `DocumentExtractor` — PDF/image/Excel/CSV/URL
- `Classifier` — industry/category/product type
- `Translator` — EN↔AR (stores original + translation + approval)
- `SeoGenerator` — titles/descriptions/keywords
- `VendorMatcher` — factual match reasons
- `Moderator` — flags for human review

## Confidence

Each extracted field may include confidence, sourceDocumentId, aiGenerated, humanVerified. Below threshold → require human verification.

## Config (admin)

Provider, model, confidence threshold, prompt templates (versioned), moderation rules. API keys never exposed to frontend.

## Missing keys

If `AI_API_KEY` is unset, AI endpoints return `503` with message `AI provider not configured` — never fake success.
