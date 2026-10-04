# PRD Maker

Ubah ide produk dalam bahasa natural menjadi PRD (Product Requirements Document) markdown 16 bab lengkap — siap dipakai AI coding agent. Publik, tanpa akun, BYOK (bawa API key sendiri).

## Fitur

- **Generate streaming**: ide → PRD 16 bab (ringkasan eksekutif s.d. glossary) via Vercel AI SDK.
- **Refine**: revisi dokumen penuh dengan instruksi bebas.
- **Edit mode**: sunting markdown langsung.
- **Export**: download `.md` / copy.
- **Share**: publish ke Postgres (Neon) → link publik `/p/[id]`.
- **BYOK**: key disimpan hanya di localStorage, dikirim per-request via body POST (tidak pernah di-log server).
- Provider: OpenRouter (default, ada model gratis), OpenAI, Anthropic, Google, Groq.

## Setup

```bash
npm install
cp .env.example .env.local   # isi POSTGRES_URL dari Neon
psql $POSTGRES_URL -f sql/0001_init.sql   # atau jalankan SQL lewat editor Neon
npm run dev
```

## Struktur kunci

- `src/lib/prompts.ts` — inti produk: outline 16 bab, 7 preset template, system prompt builder (output ID/EN).
- `src/lib/providers.ts` — registry provider BYOK + factory model per-request.
- `src/lib/store.ts` — localStorage (keys, model, riwayat LRU cap 25).
- `src/app/api/generate` — streamText mode `create`/`refine`.
- `src/app/api/verify` — tes key murah.
- `src/app/api/documents` — publish + GET dokumen share.

## Deploy (Vercel)

1. Import repo ke Vercel.
2. Set env var `POSTGRES_URL` (connection string Neon/Vercel Postgres).
3. Jalankan `sql/0001_init.sql` di database.
