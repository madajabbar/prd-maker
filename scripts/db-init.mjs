import { sql } from "@vercel/postgres";

await sql`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content_md TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'id',
    model TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
console.log("table documents ready");

const r = await sql`SELECT count(*)::int AS n FROM documents`;
console.log("existing rows:", r.rows[0].n);
