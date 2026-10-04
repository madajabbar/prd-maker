export interface FeatureItem {
  code: string;
  description: string;
  priority: "P0" | "P1" | "P2" | null;
}

export interface FeatureModule {
  module: string;
  items: FeatureItem[];
}

const MAX_ITEMS = 200;

function normalizeCode(line: string): string | null {
  const m = line.match(/FR[-\s]?(\d+)/i);
  return m ? `FR-${m[1]}` : null;
}

function findPriority(text: string): "P0" | "P1" | "P2" | null {
  const m = text.match(/\bP([012])\b/);
  return m ? (`P${m[1]}` as "P0" | "P1" | "P2") : null;
}

function cleanDescription(line: string): string {
  return line
    .replace(/^[-*+>\s]+/, "")
    .replace(/FR[-\s]?\d+/i, "")
    .replace(/\bP[012]\b/g, "")
    .replace(/\(\s*\)|\[\s*\]/g, "")
    .replace(/^[:;.\s]*[-—–:]?\s*/, "")
    .replace(/[*_`]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseTableRow(line: string): FeatureItem | null {
  const cells = line
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean);
  const codeCell = cells.find((c) => /FR[-\s]?\d+/i.test(c));
  if (!codeCell) return null;
  const code = normalizeCode(codeCell);
  if (!code) return null;
  const priorityCell = cells.find((c) => /^\*{0,2}P[012]\*{0,2}$/.test(c));
  const description = cells
    .filter((c) => c !== codeCell && c !== priorityCell)
    .join(" ")
    .replace(/[*_`]/g, "")
    .trim();
  return { code, description, priority: findPriority(priorityCell ?? line) };
}

export function parseFeatureMap(markdown: string): FeatureModule[] {
  const lines = markdown.split("\n");
  const modules: FeatureModule[] = [];
  const index = new Map<string, number>();
  let inSection = false;
  let currentModule = "Lainnya";
  let count = 0;
  const seen = new Set<string>();

  for (const raw of lines) {
    const line = raw.trim();

    if (/^##\s/.test(line)) {
      if (inSection) break;
      if (/^##\s*8[\.\s]/.test(line)) {
        inSection = true;
        currentModule = "Lainnya";
      }
      continue;
    }
    if (!inSection) continue;

    const heading = line.match(/^#{3,4}\s+(.+)$/) ?? line.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (heading && !/FR[-\s]?\d+/i.test(line)) {
      currentModule = heading[1].replace(/[*_`#]/g, "").trim() || "Lainnya";
      continue;
    }

    if (!/FR[-\s]?\d+/i.test(line)) continue;
    if (count >= MAX_ITEMS) break;

    const item = line.startsWith("|")
      ? parseTableRow(line)
      : (() => {
          const code = normalizeCode(line);
          return code
            ? { code, description: cleanDescription(line), priority: findPriority(line) }
            : null;
        })();
    if (!item || !item.description) continue;

    const key = `${currentModule}::${item.code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    count++;

    let idx = index.get(currentModule);
    if (idx === undefined) {
      modules.push({ module: currentModule, items: [] });
      idx = modules.length - 1;
      index.set(currentModule, idx);
    }
    modules[idx].items.push(item);
  }

  return modules.filter((m) => m.items.length > 0);
}
