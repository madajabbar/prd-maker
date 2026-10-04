"use client";

import { useState } from "react";

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "prd";
}

export default function ShareActions({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  const [copied, setCopied] = useState(false);

  const download = () => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(title)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={download}
        className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
      >
        Download .md
      </button>
      <button
        type="button"
        onClick={copy}
        className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
      >
        {copied ? "✓ Tersalin" : "Copy markdown"}
      </button>
    </div>
  );
}
