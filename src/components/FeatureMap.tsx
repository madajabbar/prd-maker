"use client";

import { useState } from "react";
import type { FeatureModule } from "@/lib/featuremap";

type Filter = "all" | "P0" | "P1" | "P2";

const PRIORITY_STYLE: Record<string, string> = {
  P0: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900",
  P1: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900",
  P2: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
};

const PRIORITY_LABEL: Record<string, string> = {
  P0: "P0 · Wajib (MVP)",
  P1: "P1 · Penting",
  P2: "P2 · Nanti",
};

export default function FeatureMap({ modules }: { modules: FeatureModule[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const all = modules.flatMap((m) => m.items);
  const counts = {
    P0: all.filter((i) => i.priority === "P0").length,
    P1: all.filter((i) => i.priority === "P1").length,
    P2: all.filter((i) => i.priority === "P2").length,
  };
  const total = all.length;

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: `Semua (${total})` },
    { key: "P0", label: `P0 (${counts.P0})` },
    { key: "P1", label: `P1 (${counts.P1})` },
    { key: "P2", label: `P2 (${counts.P2})` },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              filter === f.key
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                : "border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {modules.map((m) => {
          const items = m.items.filter(
            (i) => filter === "all" || i.priority === filter,
          );
          if (items.length === 0) return null;
          return (
            <section
              key={m.module}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h3 className="flex items-center justify-between text-sm font-bold text-zinc-900 dark:text-zinc-100">
                <span className="truncate">{m.module}</span>
                <span className="ml-2 shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {items.length} fitur
                </span>
              </h3>
              <ul className="mt-3 space-y-2">
                {items.map((item, i) => (
                  <li
                    key={`${item.code}-${i}`}
                    className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {item.code}
                    </span>
                    {item.priority && (
                      <span
                        className={`shrink-0 rounded-md border px-1.5 py-0.5 text-xs font-semibold ${PRIORITY_STYLE[item.priority]}`}
                        title={PRIORITY_LABEL[item.priority]}
                      >
                        {item.priority}
                      </span>
                    )}
                    <span className="min-w-0">{item.description}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {modules.every((m) => m.items.filter((i) => filter === "all" || i.priority === filter).length === 0) && (
        <p className="mt-5 text-sm text-zinc-500">
          Tidak ada fitur dengan prioritas ini.
        </p>
      )}
    </div>
  );
}
