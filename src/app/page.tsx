import type { Metadata } from "next";
import Studio from "@/components/Studio";

export const metadata: Metadata = {
  title: "PRD Maker — Ubah Ide Jadi PRD Lengkap",
  description:
    "Tulis ide dalam bahasa natural, AI menghasilkan PRD 16 bab lengkap siap dipakai AI coding agent. BYOK, streaming, share link, tanpa akun.",
  openGraph: {
    title: "PRD Maker — Ubah Ide Jadi PRD Lengkap",
    description:
      "Dari ide satu kalimat ke PRD 16 bab lengkap: persona, FR, data model, bab desain, roadmap.",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16">
      <header className="py-12 text-center">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          PRD Maker
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
          Dari ide satu kalimat → PRD 16 bab lengkap: persona, kebutuhan
          fungsional, data model, bab desain, sampai roadmap. Siap dilempar ke
          AI coding agent.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <span className="rounded-full border border-zinc-300 px-3 py-1 dark:border-zinc-700">
            BYOK — pakai API key sendiri
          </span>
          <span className="rounded-full border border-zinc-300 px-3 py-1 dark:border-zinc-700">
            Streaming real-time
          </span>
          <span className="rounded-full border border-zinc-300 px-3 py-1 dark:border-zinc-700">
            Share link publik
          </span>
          <span className="rounded-full border border-zinc-300 px-3 py-1 dark:border-zinc-700">
            Bahasa Indonesia / EN
          </span>
        </div>
      </header>
      <Studio />
    </main>
  );
}
