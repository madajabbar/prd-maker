import { insertDocument } from "@/lib/db";
import { readJsonBody } from "@/lib/http";
import { isPrdLanguage, MAX_TITLE_LENGTH } from "@/lib/prompts";
import { nanoid } from "nanoid";

const MAX_CONTENT_BYTES = 1_048_576; // 1 MB

export async function POST(req: Request) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const body = parsed.value as
    | { title?: unknown; content_md?: unknown; language?: unknown; model?: unknown }
    | null;

  const title =
    body && typeof body.title === "string"
      ? body.title.trim().slice(0, MAX_TITLE_LENGTH)
      : "";
  const content =
    body && typeof body.content_md === "string" ? body.content_md : "";
  const language = body && isPrdLanguage(body.language) ? body.language : "id";
  const model =
    body && typeof body.model === "string"
      ? body.model.trim().slice(0, 200)
      : null;

  if (!title) {
    return Response.json({ error: "Judul kosong." }, { status: 400 });
  }
  if (!content.trim()) {
    return Response.json({ error: "Konten kosong." }, { status: 400 });
  }
  if (
    content.length > MAX_CONTENT_BYTES ||
    Buffer.byteLength(content, "utf8") > MAX_CONTENT_BYTES
  ) {
    return Response.json(
      { error: "Konten melebihi batas 1 MB." },
      { status: 413 },
    );
  }

  const id = nanoid(10);

  try {
    await insertDocument({ id, title, contentMd: content, language, model });
  } catch (err) {
    console.error("insertDocument failed:", err);
    return Response.json({ error: "Gagal menyimpan." }, { status: 500 });
  }

  return Response.json({ id }, { status: 201 });
}
