import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MarkdownView from "@/components/MarkdownView";
import ShareActions from "@/components/ShareActions";
import { getDocument } from "@/lib/db";

function snippet(markdown: string): string {
  return markdown
    .replace(/[#>*`\-|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

export async function generateMetadata({
  params,
}: PageProps<"/p/[id]">): Promise<Metadata> {
  const { id } = await params;
  const doc = await getDocument(id).catch(() => null);
  if (!doc) return { title: "PRD tidak ditemukan — PRD Maker" };
  const description = snippet(doc.content_md);
  return {
    title: `${doc.title} — PRD Maker`,
    description,
    openGraph: { title: doc.title, description, type: "article" },
    twitter: { card: "summary", title: doc.title, description },
  };
}

export default async function SharePage({
  params,
}: PageProps<"/p/[id]">) {
  const { id } = await params;
  const doc = await getDocument(id).catch((err: unknown) => {
    console.error("getDocument failed:", err);
    return null;
  });
  if (!doc) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          PRD Maker · dokumen publik
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
          {doc.title}
        </h1>
        <p className="mt-2 text-xs text-zinc-500">
          {new Date(doc.created_at).toLocaleString("id-ID", {
            dateStyle: "long",
          })}
          {doc.model ? ` · ${doc.model}` : ""}
        </p>
        <div className="mt-4">
          <ShareActions title={doc.title} content={doc.content_md} />
        </div>
      </header>
      <article>
        <MarkdownView content={doc.content_md} />
      </article>
      <footer className="mt-12 border-t border-zinc-200 pt-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
        Dibuat dengan{" "}
        <a href="/" className="underline">
          PRD Maker
        </a>
      </footer>
    </main>
  );
}
