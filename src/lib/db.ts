import { sql } from "@vercel/postgres";
import { cache } from "react";

export interface DocumentRow {
  id: string;
  title: string;
  content_md: string;
  language: string;
  model: string | null;
  created_at: string;
}

export async function insertDocument(doc: {
  id: string;
  title: string;
  contentMd: string;
  language: string;
  model: string | null;
}) {
  await sql`
    INSERT INTO documents (id, title, content_md, language, model)
    VALUES (${doc.id}, ${doc.title}, ${doc.contentMd}, ${doc.language}, ${doc.model})
  `;
}

export const getDocument = cache(
  async (id: string): Promise<DocumentRow | null> => {
    const result = await sql`
    SELECT id, title, content_md, language, model, created_at
    FROM documents WHERE id = ${id}
  `;
    const row = result.rows[0] as DocumentRow | undefined;
    return row ?? null;
  },
);
