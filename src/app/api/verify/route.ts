import { readJsonBody, sanitizeError } from "@/lib/http";
import { getModel, isProviderId, isValidBaseUrl } from "@/lib/providers";
import { generateText } from "ai";

export async function POST(req: Request) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return Response.json({ ok: false, error: parsed.error });
  }
  const body = parsed.value as
    | { provider?: unknown; apiKey?: unknown; model?: unknown; baseUrl?: unknown }
    | null;

  const provider = body && isProviderId(body.provider) ? body.provider : null;
  const apiKey =
    body && typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  const model =
    body && typeof body.model === "string"
      ? body.model.trim().slice(0, 200)
      : "";
  const baseUrl =
    body && typeof body.baseUrl === "string"
      ? body.baseUrl.trim().slice(0, 500)
      : "";

  if (!provider) {
    return Response.json({ ok: false, error: "Provider tidak dikenal." });
  }
  if (!apiKey && provider !== "custom") {
    return Response.json({ ok: false, error: "API key kosong." });
  }
  if (!model) {
    return Response.json({ ok: false, error: "Model belum dipilih." });
  }
  if (provider === "custom") {
    if (!baseUrl) {
      return Response.json({ ok: false, error: "Base URL wajib diisi." });
    }
    if (!isValidBaseUrl(baseUrl)) {
      return Response.json({
        ok: false,
        error: "Base URL tidak valid (harus http/https).",
      });
    }
  }

  try {
    await generateText({
      model: getModel(provider, apiKey, model, baseUrl),
      prompt: "Reply with exactly: OK",
      maxOutputTokens: 10,
    });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ ok: false, error: sanitizeError(err, apiKey) });
  }
}
