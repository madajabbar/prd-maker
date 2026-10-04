import { getDocument } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/documents/[id]">,
) {
  const { id } = await ctx.params;

  try {
    const doc = await getDocument(id);
    if (!doc) {
      return Response.json({ error: "Dokumen tidak ditemukan." }, { status: 404 });
    }
    return Response.json(doc);
  } catch (err) {
    console.error("getDocument failed:", err);
    return Response.json(
      { error: "Gagal memuat dokumen." },
      { status: 500 },
    );
  }
}
