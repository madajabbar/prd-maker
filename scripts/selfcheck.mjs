import assert from "node:assert/strict";
import {
  TEMPLATES,
  buildCreateUserMessage,
  buildRefineUserMessage,
  buildSystemPrompt,
  MAX_IDEA_LENGTH,
  MAX_REFINE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_IDEA_LENGTH,
  MIN_REFINE_LENGTH,
  STREAM_ERROR_MARKER,
} from "../src/lib/prompts.ts";
import { PROVIDERS, DEFAULT_PROVIDER } from "../src/lib/providers.ts";

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
const refineMsg = buildRefineUserMessage("# Lama", "tambah fitur X");
assert.ok(refineMsg.includes("<current_prd>") && refineMsg.includes("<instruction>"));

// Provider registry: 5 provider BYOK + default valid
assert.equal(Object.keys(PROVIDERS).length, 5);
assert.ok(PROVIDERS[DEFAULT_PROVIDER].defaultModel);
for (const p of Object.values(PROVIDERS)) {
  assert.ok(p.models.includes(p.defaultModel), `default ${p.id} tidak ada di list`);
}

console.log("selfcheck OK");
