"use client";

import type { HistoryItem } from "@/lib/store";

interface Props {
  history: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

export default function HistoryList({ history, onLoad, onDelete }: Props) {
  if (history.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Riwayat
        </h2>
        <p className="mt-2 text-xs text-zinc-500">
          Belum ada PRD tersimpan. Riwayat disimpan di browser kamu.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
        Riwayat ({history.length})
      </h2>
      <ul className="mt-3 space-y-2">
        {history.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-700"
          >
            <button
              type="button"
              onClick={() => onLoad(item)}
              className="block w-full truncate text-left text-sm font-medium text-zinc-800 hover:underline dark:text-zinc-200"
              title={item.title}
            >
              {item.title}
            </button>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                {new Date(item.createdAt).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {item.shareId && " · dibagikan"}
              </span>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="text-xs text-zinc-400 hover:text-red-500"
                aria-label={`Hapus ${item.title}`}
              >
                Hapus
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
