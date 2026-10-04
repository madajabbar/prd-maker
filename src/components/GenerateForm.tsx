"use client";

import {
  MAX_IDEA_LENGTH,
  MIN_IDEA_LENGTH,
  TEMPLATES,
  type PrdLanguage,
} from "@/lib/prompts";
import { PROVIDERS, type ProviderId } from "@/lib/providers";

interface Props {
  idea: string;
  onIdeaChange: (value: string) => void;
  templateId: string;
  onTemplateChange: (value: string) => void;
  lang: PrdLanguage;
  onLangChange: (value: PrdLanguage) => void;
  provider: ProviderId;
  model: string;
  hasKey: boolean;
  onOpenSettings: () => void;
  busy: boolean;
  onGenerate: () => void;
  onStop: () => void;
}

export default function GenerateForm({
  idea,
  onIdeaChange,
  templateId,
  onTemplateChange,
  lang,
  onLangChange,
  provider,
  model,
  hasKey,
  onOpenSettings,
  busy,
  onGenerate,
  onStop,
}: Props) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <label
        htmlFor="idea"
        className="mb-2 block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
      >
        Ceritakan idemu
      </label>
      <textarea
        id="idea"
        value={idea}
        onChange={(e) => onIdeaChange(e.target.value.slice(0, MAX_IDEA_LENGTH))}
        placeholder="Buatkan dashboard CRM untuk tim sales yang bisa melihat pipeline, mencatat aktivitas, dan laporan performa otomatis tiap minggu…"
        rows={5}
        className="w-full resize-y rounded-xl border border-zinc-300 bg-zinc-50 p-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      />
      <div className="mt-1 text-right text-xs text-zinc-400">
        {idea.length}/{MAX_IDEA_LENGTH}
      </div>

      <div className="mt-4">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Tipe produk
        </span>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.description}
              onClick={() => onTemplateChange(t.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                templateId === t.id
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                  : "border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-zinc-300 p-0.5 text-xs font-medium dark:border-zinc-700">
            {(["id", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => onLangChange(l)}
                className={`rounded-md px-3 py-1 ${
                  lang === l
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {l === "id" ? "Bahasa ID" : "English"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
            title="Atur API key & model"
          >
            {PROVIDERS[provider].label} · {model} ⚙
          </button>
          {!hasKey && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {provider === "custom"
                ? "Base URL belum diatur"
                : "API key belum diatur"}
            </span>
          )}
        </div>

        {busy ? (
          <button
            type="button"
            onClick={onStop}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
          >
            Hentikan
          </button>
        ) : (
          <button
            type="button"
            onClick={onGenerate}
            disabled={idea.trim().length < MIN_IDEA_LENGTH}
            className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Generate PRD →
          </button>
        )}
      </div>
    </section>
  );
}
