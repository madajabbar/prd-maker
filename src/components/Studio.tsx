"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_TEMPLATE_ID,
  MAX_TITLE_LENGTH,
  MIN_IDEA_LENGTH,
  MIN_REFINE_LENGTH,
  STREAM_ERROR_MARKER,
  type GenerateMode,
  type PrdLanguage,
} from "@/lib/prompts";
import type { ProviderId } from "@/lib/providers";
import {
  addToHistory,
  loadBaseUrls,
  loadHistory,
  loadKeys,
  loadModel,
  removeFromHistory,
  saveBaseUrl,
  saveKey,
  saveModel,
  updateHistory,
  type HistoryItem,
} from "@/lib/store";
import GenerateForm from "./GenerateForm";
import HistoryList from "./HistoryList";
import PrdResult from "./PrdResult";
import SettingsModal from "./SettingsModal";

const FLUSH_INTERVAL_MS = 120;

function deriveTitle(md: string): string {
  const match = md.match(/^#\s+(.+)$/m);
  const title = (match?.[1] ?? md.slice(0, 60)).trim();
  return title.slice(0, MAX_TITLE_LENGTH) || "PRD Tanpa Judul";
}

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "prd";
}

export default function Studio() {
  const [keys, setKeys] = useState<Partial<Record<ProviderId, string>>>({});
  const [baseUrls, setBaseUrls] = useState<Partial<Record<ProviderId, string>>>(
    {},
  );
  const [provider, setProvider] = useState<ProviderId>("openrouter");
  const [model, setModel] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [idea, setIdea] = useState("");
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [lang, setLang] = useState<PrdLanguage>("id");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [clarifying, setClarifying] = useState(false);

  const [prd, setPrd] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [refineInput, setRefineInput] = useState("");
  const [shareId, setShareId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setKeys(loadKeys());
    setBaseUrls(loadBaseUrls());
    const m = loadModel();
    setProvider(m.provider);
    setModel(m.model);
    setHistory(loadHistory());
  }, []);

  const clarify = async () => {
    if (idea.trim().length < MIN_IDEA_LENGTH) {
      setError(`Tulis idemu dulu (minimal ${MIN_IDEA_LENGTH} karakter).`);
      return;
    }
    const apiKey = keys[provider]?.trim() ?? "";
    const baseUrl = (baseUrls[provider] ?? "").trim();
    if (!apiKey && provider !== "custom") {
      setSettingsOpen(true);
      return;
    }
    if (provider === "custom" && !baseUrl) {
      setSettingsOpen(true);
      return;
    }
    setClarifying(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idea,
          lang,
          provider,
          apiKey,
          model,
          mode: "clarify",
          baseUrl: provider === "custom" ? baseUrl : undefined,
        }),
      });
      const j = (await res.json().catch(() => null)) as {
        questions?: string[];
        error?: string;
      } | null;
      if (!res.ok || !j) {
        setError(j?.error ?? `Gagal memuat pertanyaan (HTTP ${res.status}).`);
        return;
      }
      setQuestions(j.questions ?? []);
      setAnswers(new Array(j.questions?.length ?? 0).fill(""));
    } catch {
      setError("Gagal memuat pertanyaan (jaringan).");
    } finally {
      setClarifying(false);
    }
  };

  const setAnswerAt = (index: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value.slice(0, 2000);
      return next;
    });
  };

  const run = async (mode: GenerateMode) => {
    if (mode === "create" && idea.trim().length < MIN_IDEA_LENGTH) {
      setError(`Tulis idemu dulu (minimal ${MIN_IDEA_LENGTH} karakter).`);
      return;
    }
    if (mode === "refine" && refineInput.trim().length < MIN_REFINE_LENGTH) {
      setError("Tulis instruksi refine dulu.");
      return;
    }
    const apiKey = keys[provider]?.trim();
    const baseUrl = (baseUrls[provider] ?? "").trim();
    if (!apiKey && provider !== "custom") {
      setSettingsOpen(true);
      return;
    }
    if (provider === "custom" && !baseUrl) {
      setSettingsOpen(true);
      return;
    }

    const prev = prd;
    const prevHistoryId = currentHistoryId;
    const ac = new AbortController();
    abortRef.current = ac;
    setStreaming(true);
    setError("");
    setToast("");
    setShareId(null);
    setEditing(false);
    setPrd("");

    let acc = "";
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          idea,
          template: templateId,
          lang,
          provider,
          apiKey,
          model,
          mode,
          baseUrl: provider === "custom" ? baseUrl : undefined,
          answers:
            mode === "create"
              ? questions
                  .map((question, index) => ({
                    question,
                    answer: answers[index] ?? "",
                  }))
                  .filter((a) => a.answer.trim())
              : undefined,
          currentPrd: mode === "refine" ? prev : undefined,
          refineInstruction: mode === "refine" ? refineInput : undefined,
        }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(j?.error ?? `Gagal memuat (HTTP ${res.status}).`);
        setPrd(prev);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let lastFlush = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const now = Date.now();
        if (now - lastFlush > FLUSH_INTERVAL_MS) {
          lastFlush = now;
          setPrd(acc);
        }
      }
      acc += decoder.decode();

      let streamErrorMessage = "";
      const markerIdx = acc.indexOf(STREAM_ERROR_MARKER);
      if (markerIdx !== -1) {
        streamErrorMessage = acc
          .slice(markerIdx + STREAM_ERROR_MARKER.length)
          .trim();
        acc = acc.slice(0, markerIdx);
      }
      setPrd(acc);

      if (streamErrorMessage) {
        setError(`Stream berhenti: ${streamErrorMessage}`);
        if (!acc.trim()) setPrd(prev);
        return;
      }

      setRefineInput("");
      const title = deriveTitle(acc);
      if (mode === "create" || !prevHistoryId) {
        const hid = crypto.randomUUID();
        setHistory(
          addToHistory({
            id: hid,
            title,
            createdAt: Date.now(),
            language: lang,
            content: acc,
          }),
        );
        setCurrentHistoryId(hid);
      } else {
        setHistory(updateHistory(prevHistoryId, { title, content: acc }));
      }
      if (mode === "create") {
        setQuestions([]);
        setAnswers([]);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        if (!acc.trim()) setPrd(prev);
      } else {
        setError(e instanceof Error ? e.message : "Terjadi error jaringan.");
        setPrd(acc.trim() ? acc : prev);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  const saveSettings = (
    p: ProviderId,
    m: string,
    apiKeyForProvider: string,
    baseUrl: string,
  ) => {
    saveKey(p, apiKeyForProvider);
    setKeys((prev) => ({ ...prev, [p]: apiKeyForProvider }));
    saveBaseUrl(p, baseUrl.trim());
    setBaseUrls((prev) => ({ ...prev, [p]: baseUrl.trim() }));
    saveModel(p, m);
    setProvider(p);
    setModel(m);
    setSettingsOpen(false);
  };

  const download = () => {
    const blob = new Blob([prd], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(deriveTitle(prd))}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(prd);
    setToast("Tersalin ke clipboard.");
    setTimeout(() => setToast(""), 2000);
  };

  const publish = async () => {
    if (!prd.trim()) return;
    setPublishing(true);
    setError("");
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: deriveTitle(prd),
          content_md: prd,
          language: lang,
          model: `${provider}/${model}`,
        }),
      });
      const j = (await res.json().catch(() => null)) as {
        id?: string;
        error?: string;
      } | null;
      if (!res.ok || !j?.id) {
        setError(j?.error ?? `Gagal publish (HTTP ${res.status}).`);
        return;
      }
      setShareId(j.id);
      setToast(`Terbit. Link: /p/${j.id}`);
      const title = deriveTitle(prd);
      if (currentHistoryId) {
        setHistory(
          updateHistory(currentHistoryId, {
            title,
            content: prd,
            shareId: j.id,
          }),
        );
      } else {
        const hid = crypto.randomUUID();
        setHistory(
          addToHistory({
            id: hid,
            title,
            createdAt: Date.now(),
            language: lang,
            content: prd,
            shareId: j.id,
          }),
        );
        setCurrentHistoryId(hid);
      }
    } catch {
      setError("Gagal publish (jaringan).");
    } finally {
      setPublishing(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setPrd(item.content);
    setShareId(item.shareId ?? null);
    setLang(item.language);
    setCurrentHistoryId(item.id);
    setError("");
    setEditing(false);
    setQuestions([]);
    setAnswers([]);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <GenerateForm
          idea={idea}
          onIdeaChange={setIdea}
          templateId={templateId}
          onTemplateChange={setTemplateId}
          lang={lang}
          onLangChange={setLang}
          provider={provider}
          model={model}
          hasKey={
            provider === "custom"
              ? Boolean(baseUrls.custom?.trim())
              : Boolean(keys[provider])
          }
          onOpenSettings={() => setSettingsOpen(true)}
          busy={streaming}
          onGenerate={() => run("create")}
          onStop={stop}
          questions={questions}
          answers={answers}
          clarifying={clarifying}
          onClarify={clarify}
          onAnswerChange={setAnswerAt}
        />
        <PrdResult
          prd={prd}
          streaming={streaming}
          error={error}
          editing={editing}
          onEditingChange={setEditing}
          onPrdChange={setPrd}
          refineInput={refineInput}
          onRefineInputChange={setRefineInput}
          onRefine={() => run("refine")}
          onDownload={download}
          onCopy={copy}
          onPublish={publish}
          publishing={publishing}
          shareId={shareId}
          toast={toast}
        />
      </div>
      <aside>
        <HistoryList
          history={history}
          onLoad={loadFromHistory}
          onDelete={(id) => {
            setHistory(removeFromHistory(id));
            if (currentHistoryId === id) setCurrentHistoryId(null);
          }}
        />
      </aside>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        keys={keys}
        baseUrls={baseUrls}
        provider={provider}
        model={model}
        onSave={saveSettings}
      />
    </div>
  );
}
