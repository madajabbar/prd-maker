import { readJsonBody, sanitizeError } from "@/lib/http";
import {
  buildCreateUserMessage,
  buildRefineUserMessage,
  buildSystemPrompt,
  DEFAULT_TEMPLATE_ID,
  isPrdLanguage,
  isTemplateId,
  MAX_CURRENT_PRD_LENGTH,
  MAX_IDEA_LENGTH,
  MAX_REFINE_LENGTH,
  MIN_IDEA_LENGTH,
  MIN_REFINE_LENGTH,
  STREAM_ERROR_MARKER,
  type GenerateMode,
} from "@/lib/prompts";
import { getModel, isProviderId } from "@/lib/providers";
import { createTextStreamResponse, streamText, toTextStream } from "ai";

export async function POST(req: Request) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const body = parsed.value as
    | {
        idea?: unknown;
        template?: unknown;
        lang?: unknown;
        provider?: unknown;
        apiKey?: unknown;
        model?: unknown;
        mode?: unknown;
        currentPrd?: unknown;
        refineInstruction?: unknown;
      }
    | null;

  if (!body) {
    return Response.json({ error: "Body kosong." }, { status: 400 });
  }

  const mode: GenerateMode = body.mode === "refine" ? "refine" : "create";
  const lang = isPrdLanguage(body.lang) ? body.lang : "id";
  const templateId = isTemplateId(body.template)
    ? body.template
    : DEFAULT_TEMPLATE_ID;
  const provider = isProviderId(body.provider) ? body.provider : null;
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  const model =
    typeof body.model === "string" ? body.model.trim().slice(0, 200) : "";

  if (!provider) {
    return Response.json({ error: "Provider tidak dikenal." }, { status: 400 });
  }
  if (!apiKey) {
    return Response.json(
      { error: "API key belum diisi. Buka Pengaturan untuk menambahkan key." },
      { status: 400 },
    );
  }
  if (!model) {
    return Response.json({ error: "Model belum dipilih." }, { status: 400 });
  }

  const idea = typeof body.idea === "string" ? body.idea.trim() : "";
  const refineInstruction =
    typeof body.refineInstruction === "string"
      ? body.refineInstruction.trim()
      : "";
  const currentPrd = typeof body.currentPrd === "string" ? body.currentPrd : "";

  if (mode === "create") {
    if (idea.length < MIN_IDEA_LENGTH) {
      return Response.json(
        { error: `Ide minimal ${MIN_IDEA_LENGTH} karakter.` },
        { status: 400 },
      );
    }
    if (idea.length > MAX_IDEA_LENGTH) {
      return Response.json(
        { error: `Ide maksimal ${MAX_IDEA_LENGTH} karakter.` },
        { status: 400 },
      );
    }
  } else {
    if (refineInstruction.length < MIN_REFINE_LENGTH) {
      return Response.json(
        { error: `Instruksi refine minimal ${MIN_REFINE_LENGTH} karakter.` },
        { status: 400 },
      );
    }
    if (refineInstruction.length > MAX_REFINE_LENGTH) {
      return Response.json(
        { error: `Instruksi maksimal ${MAX_REFINE_LENGTH} karakter.` },
        { status: 400 },
      );
    }
    if (!currentPrd.trim() || currentPrd.length > MAX_CURRENT_PRD_LENGTH) {
      return Response.json(
        { error: "Dokumen saat ini kosong atau terlalu besar." },
        { status: 400 },
      );
    }
  }

  const languageModel = getModel(provider, apiKey, model);
  const system = buildSystemPrompt(lang, templateId, mode);
  const userMessage =
    mode === "refine"
      ? buildRefineUserMessage(currentPrd, refineInstruction)
      : buildCreateUserMessage(idea);

  let streamError = "";
  const result = streamText({
    model: languageModel,
    system,
    prompt: userMessage,
    abortSignal: req.signal,
    onError: ({ error }) => {
      streamError = sanitizeError(error, apiKey);
      console.error("generate stream error:", streamError);
    },
  });

  const text = toTextStream({ stream: result.stream }).pipeThrough(
    new TransformStream<string, string>({
      flush(controller) {
        if (streamError) {
          controller.enqueue(`${STREAM_ERROR_MARKER}${streamError}\n`);
        }
      },
    }),
  );

  return createTextStreamResponse({ stream: text });
}
