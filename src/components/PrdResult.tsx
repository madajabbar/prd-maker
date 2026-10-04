"use client";

import { MIN_REFINE_LENGTH } from "@/lib/prompts";
import MarkdownView from "./MarkdownView";

interface Props {
  prd: string;
  streaming: boolean;
  error: string;
  editing: boolean;
  onEditingChange: (value: boolean) => void;
  onPrdChange: (value: string) => void;
  refineInput: string;
  onRefineInputChange: (value: string) => void;
  onRefine: () => void;
  onDownload: () => void;
  onCopy: () => void;
  onPublish: () => void;
  publishing: boolean;
  shareId: string | null;
  toast: string;
}

export default function PrdResult({
  prd,
  streaming,
  error,
  editing,
  onEditingChange,
  onPrdChange,
  refineInput,
  onRefineInputChange,
  onRefine,
  onDownload,
  onCopy,
  onPublish,
  publishing,
  shareId,
  toast,
}: Props) {
  if (!prd && !streaming && !error) {
    return (
      <section className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
        Hasil PRD akan muncul di sini.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {error && (
        <div className="m-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {streaming ? "Sedang menulis…" : "PRD"}
          {streaming && (
            <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-green-500 align-middle" />
          )}
        </span>
        {prd && !streaming && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onEditingChange(!editing)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
            >
              {editing ? "Lihat hasil" : "Edit"}
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
            >
              Download .md
            </button>
            <button
              type="button"
              onClick={onCopy}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={onPublish}
              disabled={publishing}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
            >
              {publishing ? "Mempublikasikan…" : "Bagikan"}
            </button>
          </div>
        )}
      </div>

      <div className="px-5 py-6">
        {editing ? (
          <textarea
            value={prd}
            onChange={(e) => onPrdChange(e.target.value)}
            rows={24}
            className="w-full resize-y rounded-xl border border-zinc-300 bg-zinc-50 p-3 font-mono text-xs leading-relaxed text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        ) : (
          <MarkdownView content={prd} />
        )}
      </div>

      {toast && (
        <div className="px-5 pb-3 text-xs font-medium text-green-600 dark:text-green-400">
          {toast}
        </div>
      )}

      {shareId && (
        <div className="mx-5 mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-green-300 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-950">
          <span className="text-green-700 dark:text-green-300">
            Link publik:
          </span>
          <a
            href={`/p/${shareId}`}
            className="truncate font-mono text-xs text-green-800 underline dark:text-green-200"
          >
            /p/{shareId}
          </a>
        </div>
      )}

      {prd && !streaming && (
        <div className="flex gap-2 border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <input
            value={refineInput}
            onChange={(e) => onRefineInputChange(e.target.value)}
            placeholder="Instruksi refine, mis. 'tambahkan modul notifikasi WhatsApp dan perluas bab keamanan'"
            className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-zinc-50 p-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={onRefine}
            disabled={refineInput.trim().length < MIN_REFINE_LENGTH}
            className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900"
          >
            Refine
          </button>
        </div>
      )}
    </section>
  );
}
