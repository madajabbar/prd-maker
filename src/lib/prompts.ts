export type PrdLanguage = "id" | "en";
export type GenerateMode = "create" | "refine" | "clarify";

export const MIN_IDEA_LENGTH = 10;
export const MAX_IDEA_LENGTH = 4000;
export const MIN_REFINE_LENGTH = 3;
export const MAX_REFINE_LENGTH = 2000;
export const MAX_CURRENT_PRD_LENGTH = 512_000;
export const MAX_TITLE_LENGTH = 300;

export const STREAM_ERROR_MARKER = "\n\n---\n> ⚠️ Error: ";

export interface ClarifyAnswer {
  question: string;
  answer: string;
}

export interface PrdTemplate {
  id: string;
  label: string;
  description: string;
  emphasis: string;
  example: string;
}

export const TEMPLATES: PrdTemplate[] = [
  {
    id: "saas",
    label: "SaaS / Web App",
    description: "Aplikasi web multi-tenant dengan subscription.",
    emphasis:
      "Emphasize multi-tenancy, subscription/billing plans, role-based access control, onboarding funnel, and dashboard/analytics modules.",
    example:
      "A SaaS tool that lets small agencies manage client projects, invoices, and time tracking in one place.",
  },
  {
    id: "mobile",
    label: "Mobile App",
    description: "Aplikasi iOS/Android native atau hybrid.",
    emphasis:
      "Emphasize platform strategy (native/hybrid), offline behavior, push notifications, app store requirements, and mobile-specific NFR (battery, data usage).",
    example:
      "A habit tracker app with streaks, reminders, and social accountability features.",
  },
  {
    id: "ecommerce",
    label: "E-Commerce / Marketplace",
    description: "Toko online atau marketplace multi-vendor.",
    emphasis:
      "Emphasize catalog & search, cart and checkout flow, payment gateway integration, order/inventory management, seller side (if marketplace), and logistics/shipping.",
    example:
      "A marketplace connecting local farmers directly with restaurants for weekly produce orders.",
  },
  {
    id: "internal",
    label: "Internal Tool / Dashboard",
    description: "Tool internal untuk operasional tim.",
    emphasis:
      "Emphasize data model & reporting, permission mapping to org roles, bulk operations, audit trail, and integration with existing internal systems.",
    example:
      "An internal dashboard for the support team to triage tickets, track SLA breaches, and export weekly reports.",
  },
  {
    id: "ai",
    label: "AI App / Agent",
    description: "Produk berbasis LLM/agent.",
    emphasis:
      "Emphasize prompt/agent architecture, model provider abstraction, context management, evaluation & guardrails, cost/latency budget per request, and human-in-the-loop checkpoints.",
    example:
      "An AI assistant that reads a company's HR policy docs and answers employee questions with citations.",
  },
  {
    id: "api",
    label: "API / Backend Service",
    description: "Service backend/API publik atau internal.",
    emphasis:
      "Emphasize API spec (REST/GraphQL/gRPC, versioning, pagination, idempotency), auth (API keys/OAuth), rate limiting, webhooks/events, and observability.",
    example:
      "A PDF generation API that accepts JSON templates and returns hosted PDF links with webhooks.",
  },
  {
    id: "landing",
    label: "Landing Page",
    description: "Halaman marketing satu halaman.",
    emphasis:
      "Emphasize section-by-section wireframe, copy direction, conversion/CTA strategy, SEO, and analytics event tracking. Keep the data model minimal.",
    example:
      "A landing page for a developer-focused error tracking SaaS with pricing and changelog sections.",
  },
];

export const DEFAULT_TEMPLATE_ID = TEMPLATES[0].id;

export function isTemplateId(value: unknown): value is string {
  return (
    typeof value === "string" && TEMPLATES.some((t) => t.id === value)
  );
}

export function isPrdLanguage(value: unknown): value is PrdLanguage {
  return value === "id" || value === "en";
}

const SECTIONS = `The document MUST contain exactly these 16 numbered sections, in this order, as level-2 headings:

## 1. Executive Summary
Product name, one-paragraph pitch, target user, and primary value proposition.

## 2. Background & Problem
Current pain points with concrete scenarios; why existing alternatives fall short.

## 3. Goals & Success Metrics
3-5 measurable goals plus a KPI table (metric, baseline, target, how measured).

## 4. Target Users & Personas
2-3 personas: role, context, goals, frustrations, technical skill level.

## 5. Competitive Analysis
3-4 alternatives in a table: positioning, strengths, weaknesses, our differentiation.

## 6. Scope
Explicit in-scope for v1 vs out-of-scope (bulleted lists).

## 7. User Journey & User Stories
End-to-end journey per persona, then user stories US-xx each with Given/When/Then acceptance criteria.

## 8. Functional Requirements
Grouped per module; each requirement coded FR-xx with description, priority (P0/P1/P2), and acceptance criteria.

## 9. Non-Functional Requirements
Performance, security, privacy, accessibility (WCAG), SEO, reliability — with concrete numeric targets.

## 10. Data Model & API Spec
Entities with fields and relationships (markdown table or mermaid erDiagram), plus a REST endpoint table (method, path, description, auth).

## 11. Design System & UI
Design direction (mood, references), color palette with hex values, typography scale, spacing scale; then descriptive wireframes for EVERY key screen (describe layout top-to-bottom in words, per screen); for the 2-4 MOST important screens, also include a visual mockup as a fenced code block with the info string "wireframe" containing self-contained HTML (see wireframe rules); finish with a UI component inventory.

## 12. Tech Stack Recommendation
Frontend, backend, database, infrastructure, third-party services — each with a one-line rationale.

## 13. Milestones & Roadmap
Phased plan (MVP -> v1 -> later) with scope and rough effort per phase.

## 14. Risks & Mitigation
Table: risk, likelihood, impact, mitigation.

## 15. Open Questions
Unresolved decisions, each with the options under consideration.

## 16. Glossary
Key terms used in the document.`;

export function buildSystemPrompt(
  language: PrdLanguage,
  templateId: string,
  mode: GenerateMode = "create",
): string {
  const template =
    TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
  const langLine =
    language === "id"
      ? "Write the ENTIRE document content in Bahasa Indonesia (formal but clear). Section titles use the Indonesian translations of the outline above."
      : "Write the entire document in English.";
  const refineLine =
    mode === "refine"
      ? `\n\nREVISION MODE: the user will supply the current PRD and a revision instruction. Apply the instruction and regenerate the COMPLETE revised document (full regeneration, not a diff), keeping all 16 sections and all unchanged content intact. Output only the final document.`
      : "";

  return [
    `You are a senior product manager and technical writer. Your job: turn a rough product idea into a complete, high-signal Product Requirements Document (PRD) in Markdown that an AI coding agent could implement from directly.`,
    `OUTPUT RULES:
- Output ONLY the Markdown document. No conversational intro/outro, no wrapping code fence.
- Start with "# <Product Name>" plus a one-line tagline, then the 16 numbered "## N. ..." sections in the exact order below. Never skip or reorder sections.
- Use Markdown tables for metrics, competitors, requirements, endpoints, data model, and risks.
- WIREFRAME RULES: a wireframe mockup is a fenced code block whose info string is exactly "wireframe" and whose content is a single self-contained HTML snippet representing ONE screen: plain HTML elements with INLINE STYLES only (grayscale boxes, borders, padding, flex/grid via style attribute), realistic labels and placeholder text, roughly 600-900 chars. NO <script>, NO external assets, NO Tailwind classes, NO <html>/<head>/<body> wrapper — just the fragment (e.g. a single <div style="...">). Include 2-4 such wireframe blocks for the most important screens inside section 11, each preceded by the screen name in bold.
- Be specific and concrete: real numbers, named examples, testable acceptance criteria. When the idea lacks detail, invent reasonable decisions instead of leaving placeholders.`,
    SECTIONS,
    `PRODUCT TYPE: ${template.label}. ${template.emphasis}`,
    `LANGUAGE: ${langLine}${refineLine}`,
  ].join("\n\n");
}

export function buildCreateUserMessage(
  idea: string,
  answers?: ClarifyAnswer[],
): string {
  const qa =
    answers && answers.length > 0
      ? `\n\nClarifying Q&A (user's answers, treat as authoritative):\n<qa>\n${answers
          .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
          .join("\n")}\n</qa>`
      : "";
  return `Product idea:\n\n<idea>\n${idea}\n</idea>${qa}`;
}

export function buildClarifySystemPrompt(language: PrdLanguage): string {
  const langLine =
    language === "id"
      ? "Write the questions in Bahasa Indonesia."
      : "Write the questions in English.";
  return [
    `You are a senior product manager preparing to write a PRD. Your job right now: ask the 3-5 MOST decision-critical clarifying questions about the product idea — the answers must materially change scope, features, or priorities. Skip questions you can reasonably decide yourself.`,
    `OUTPUT FORMAT (strict): each question on its own line, prefixed exactly with "Q: ", maximum 15 words per question, no numbering, no explanations, no markdown, no opening or closing prose. Output nothing else.`,
    langLine,
  ].join("\n\n");
}

export function parseClarifyQuestions(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("Q:"))
    .map((line) => line.slice(2).trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function buildRefineUserMessage(
  currentPrd: string,
  instruction: string,
): string {
  return `Current PRD:\n\n<current_prd>\n${currentPrd}\n</current_prd>\n\nRevision instruction:\n\n<instruction>\n${instruction}\n</instruction>\n\nRegenerate the full revised PRD now, following the system rules.`;
}
