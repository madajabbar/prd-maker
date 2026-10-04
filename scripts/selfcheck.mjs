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
import { parseFeatureMap } from "../src/lib/featuremap.ts";

// Feature map: parse FR dari bab 8 (format list + tabel), grouping modul
const fmSample = `# Judul

## 8. Functional Requirements

### Modul Autentikasi

- FR-01: Login email + password (P0)
- **FR-02:** SSO Google Workspace (P1)

**Modul Laporan**

| Kode | Deskripsi | Prioritas |
|---|---|---|
| FR-03 | Ekspor laporan PDF | P0 |
| FR-04 | Filter rentang tanggal | P2 |

## 9. Non-Functional Requirements

- FR-99: tidak boleh ikut
`;
const fm = parseFeatureMap(fmSample);
const auth = fm.find((m) => m.module === "Modul Autentikasi");
assert.ok(auth && auth.items.length === 2, "modul auth 2 item");
assert.equal(auth.items[0].code, "FR-01");
assert.equal(auth.items[0].priority, "P0");
assert.ok(auth.items[0].description.includes("Login email"));
assert.equal(auth.items[1].priority, "P1");
const rep = fm.find((m) => /Laporan/.test(m.module));
assert.ok(rep && rep.items.length === 2, "modul laporan 2 item (tabel)");
assert.equal(rep.items[0].code, "FR-03");
assert.equal(rep.items[0].priority, "P0");
assert.ok(rep.items[0].description.includes("Ekspor laporan PDF"));
assert.equal(rep.items[1].priority, "P2");
assert.ok(!fm.some((m) => m.items.some((i) => i.code === "FR-99")), "FR di luar bab 8 diabaikan");
assert.equal(parseFeatureMap("# tanpa bab 8").length, 0);
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

// System prompt menyuruh wireframe HTML self-contained + contoh fence eksplisit
const sysForWire = buildSystemPrompt("id", "saas");
assert.ok(sysForWire.includes("wireframe"));
assert.ok(sysForWire.includes("```wireframe"));
assert.ok(sysForWire.includes('never "html"'));
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
