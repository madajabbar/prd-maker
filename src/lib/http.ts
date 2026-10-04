export const MAX_BODY_BYTES = 2_097_152;

export async function readJsonBody(
  req: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY_BYTES) {
    return { ok: false, error: "Body terlalu besar (maks 2 MB)." };
  }
  try {
    return { ok: true, value: await req.json() };
  } catch {
    return { ok: false, error: "Body JSON tidak valid." };
  }
}

export function sanitizeError(err: unknown, apiKey: string): string {
  let msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  msg = String(msg).replaceAll(apiKey, "••••");
  return msg.slice(0, 300);
}
