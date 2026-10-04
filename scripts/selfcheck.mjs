import assert from "node:assert/strict";
import {
  TEMPLATES,
  buildClarifySystemPrompt,
  buildCreateUserMessage,
  buildRefineUserMessage,
  buildSystemPrompt,
  MAX_IDEA_LENGTH,
  MAX_REFINE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_IDEA_LENGTH,
  MIN_REFINE_LENGTH,
  parseClarifyQuestions,
  STREAM_ERROR_MARKER,
} from "../src/lib/prompts.ts";
import { PROVIDERS, DEFAULT_PROVIDER, isValidBaseUrl } from "../src/lib/providers.ts";
import { sanitizeError } from "../src/lib/http.ts";

// sanitizeError: key kosong tak boleh merusak pesan; key terisi wajib ter-redact
assert.ok(!sanitizeError(new Error("boom"), "").includes("•"));
assert.equal(sanitizeError(new Error("sk-secret boom"), "sk-secret"), "•••• boom");

// Konstanta batasan: min < max, marker aman
assert.ok(MIN_IDEA_LENGTH >= 1 && MAX_IDEA_LENGTH > MIN_IDEA_LENGTH);
assert.ok(MIN_REFINE_LENGTH >= 1 && MAX_REFINE_LENGTH > MIN_REFINE_LENGTH);
assert.ok(MAX_TITLE_LENGTH >= 10);
assert.ok(STREAM_ERROR_MARKER.startsWith("\n\n") && STREAM_ERROR_MARKER.length > 5);

// Templates: 7 preset, field lengkap
assert.equal(TEMPLATES.length, 7);
for (const t of TEMPLATES) {
  for (const field of ["id", "label", "description", "emphasis", "example"]) {
    assert.ok(t[field].length > 0, `template ${t.id}.${field} kosong`);
  }
}
assert.equal(new Set(TEMPLATES.map((t) => t.id)).size, 7);

// System prompt: 16 bab bernomor, bahasa, penekanan template
for (const lang of ["id", "en"]) {
  const sys = buildSystemPrompt(lang, "saas");
  const numbered = sys.match(/^## \d+\. /gm) ?? [];
  assert.equal(numbered.length, 16, `outline 16 bab (lang=${lang})`);
  assert.ok(sys.includes("Design System & UI"), "bab desain hilang");
  assert.ok(sys.toLowerCase().includes(lang === "id" ? "bahasa indonesia" : "in english"));
}

// Mode refine menambah instruksi revisi
assert.ok(
  buildSystemPrompt("id", "saas", "refine").includes("REVISION MODE"),
  "mode refine tidak mengubah system prompt",
);
assert.ok(buildCreateUserMessage("ide").includes("<idea>"));
// Jawaban clarify masuk konteks generate
const withAnswers = buildCreateUserMessage("ide", [
  { question: "Siapa target?", answer: "UMKM" },
]);
assert.ok(withAnswers.includes("<qa>") && withAnswers.includes("A: UMKM"));
assert.ok(!buildCreateUserMessage("ide", []).includes("<qa>"));

// Clarify: format prompt ketat + parser Q-lines
const clarifySys = buildClarifySystemPrompt("id");
assert.ok(clarifySys.includes('Q: ') && clarifySys.includes("3-5"));
assert.deepEqual(parseClarifyQuestions("Q: Siapa target?\nQ: Budget?\nprose lain\nQ: Timeline?"), [
  "Siapa target?",
  "Budget?",
  "Timeline?",
]);
assert.deepEqual(parseClarifyQuestions("no questions here"), []);
assert.equal(parseClarifyQuestions("Q: a\nQ: b\nQ: c\nQ: d\nQ: e\nQ: f\nQ: g\nQ: h\nQ: i").length, 8);

// System prompt menyuruh wireframe HTML self-contained
assert.ok(buildSystemPrompt("id", "saas").includes("wireframe"));
const refineMsg = buildRefineUserMessage("# Lama", "tambah fitur X");
assert.ok(refineMsg.includes("<current_prd>") && refineMsg.includes("<instruction>"));

// Provider registry: 6 provider BYOK + default valid + custom OpenAI-compatible
assert.equal(Object.keys(PROVIDERS).length, 6);
assert.ok(PROVIDERS[DEFAULT_PROVIDER].defaultModel);
assert.ok("custom" in PROVIDERS);
for (const p of Object.values(PROVIDERS)) {
  assert.ok(
    p.defaultModel === "" ? p.models.length === 0 : p.models.includes(p.defaultModel),
    `default ${p.id} tidak konsisten dengan list`,
  );
}
assert.ok(isValidBaseUrl("https://api.example.com/v1"));
assert.ok(isValidBaseUrl("http://localhost:11434/v1"));
assert.ok(!isValidBaseUrl("ftp://api.example.com"));
assert.ok(!isValidBaseUrl("bukan url"));
assert.ok(!isValidBaseUrl(""));

console.log("selfcheck OK");
