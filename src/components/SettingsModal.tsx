"use client";

import { useEffect, useState } from "react";
import {
  isValidBaseUrl,
  PROVIDERS,
  type ProviderId,
} from "@/lib/providers";

interface Props {
  open: boolean;
  onClose: () => void;
  keys: Partial<Record<ProviderId, string>>;
  baseUrls: Partial<Record<ProviderId, string>>;
  provider: ProviderId;
  model: string;
  onSave: (
    provider: ProviderId,
    model: string,
    apiKeyForProvider: string,
    baseUrl: string,
  ) => void;
}

export default function SettingsModal({
  open,
  onClose,
  keys,
  baseUrls,
  provider,
  model,
  onSave,
}: Props) {
  const [draftProvider, setDraftProvider] = useState<ProviderId>(provider);
  const [draftModel, setDraftModel] = useState(model);
  const [draftKey, setDraftKey] = useState("");
  const [draftBaseUrl, setDraftBaseUrl] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraftProvider(provider);
      setDraftModel(model);
      setDraftKey(keys[provider] ?? "");
      setDraftBaseUrl(baseUrls[provider] ?? "");
      setVerifyResult(null);
    }
  }, [open, provider, model, keys, baseUrls]);

  if (!open) return null;

  const isCustom = draftProvider === "custom";

  const switchProvider = (p: ProviderId) => {
    setDraftProvider(p);
    setDraftModel(PROVIDERS[p].defaultModel);
    setDraftKey(keys[p] ?? "");
    setDraftBaseUrl(baseUrls[p] ?? "");
    setVerifyResult(null);
  };

  const customBaseUrl = draftBaseUrl.trim();
  const customUrlValid = customBaseUrl && isValidBaseUrl(customBaseUrl);

  const verify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: draftProvider,
          apiKey: draftKey.trim(),
          model: draftModel.trim(),
          baseUrl: isCustom ? customBaseUrl : undefined,
        }),
      });
      const j = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      setVerifyResult(
        j?.ok ? "✓ Key & model valid." : (j?.error ?? "Verifikasi gagal."),
      );
    } catch {
      setVerifyResult("Verifikasi gagal (jaringan).");
    } finally {
      setVerifying(false);
    }
  };

  const info = PROVIDERS[draftProvider];
  const canSave =
    Boolean(draftModel.trim()) &&
    (isCustom ? Boolean(customUrlValid) : true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Pengaturan
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 text-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Provider
        </label>
        <select
          value={draftProvider}
          onChange={(e) => switchProvider(e.target.value as ProviderId)}
          className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 p-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        >
          {Object.values(PROVIDERS).map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>

        {isCustom && (
          <>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Base URL (OpenAI-compatible)
            </label>
            <input
              value={draftBaseUrl}
              onChange={(e) => setDraftBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1 — atau http://localhost:11434/v1 (Ollama)"
              autoComplete="off"
              className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 p-2.5 font-mono text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Endpoint harus kompatibel dengan API OpenAI chat completions.
            </p>
          </>
        )}

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
          API Key {isCustom && "(opsional untuk server lokal)"}
        </label>
        <input
          type="password"
          value={draftKey}
          onChange={(e) => setDraftKey(e.target.value)}
          placeholder="sk-…"
          autoComplete="off"
          className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 p-2.5 font-mono text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Key hanya disimpan di browser kamu (localStorage) dan dikirim
          per-request.
          {info.keyUrl && (
            <>
              {" "}
              Ambil key:{" "}
              <a
                href={info.keyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {info.keyUrl}
              </a>
            </>
          )}
        </p>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Model
        </label>
        <input
          value={draftModel}
          onChange={(e) => setDraftModel(e.target.value)}
          list="model-options"
          className="mt-1 w-full rounded-xl border border-zinc-300 bg-zinc-50 p-2.5 font-mono text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <datalist id="model-options">
          {info.models.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>

        <button
          type="button"
          onClick={verify}
          disabled={
            verifying ||
            !draftModel.trim() ||
            (isCustom ? !customUrlValid : !draftKey.trim())
          }
          className="mt-3 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-500 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
        >
          {verifying ? "Memverifikasi…" : "Verifikasi key"}
        </button>
        {verifyResult && (
          <p
            className={`mt-2 text-xs ${
              verifyResult.startsWith("✓")
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {verifyResult}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-300"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() =>
              onSave(
                draftProvider,
                draftModel.trim(),
                draftKey.trim(),
                customBaseUrl,
              )
            }
            disabled={!canSave}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
