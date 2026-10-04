import { isValidElement, memo, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const BASE_DOC_STYLE = `<style>
  body{margin:0;font:14px/1.6 system-ui,-apple-system,sans-serif;color:#111;background:#fff}
  *{box-sizing:border-box}
  h1,h2,h3{margin:0 0 8px}
  h1{font-size:18px}h2{font-size:16px}h3{font-size:14px}
  p{margin:0 0 8px}
  ul{margin:0;padding-left:18px}
</style>`;

function cleanWireframeHtml(raw: string): string {
  return raw
    .replace(/^```[a-zA-Z]*\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();
}

function isWireframeClass(className?: string, meta?: string): boolean {
  if (className === "language-wireframe") return true;
  return (
    className === "language-html" && (meta ?? "").includes("wireframe")
  );
}

function nodeMeta(node: unknown): string | undefined {
  const data = (node as { data?: { meta?: string } } | undefined)?.data;
  return data?.meta;
}

function WireframeFrame({ html }: { html: string }) {
  const content = cleanWireframeHtml(html);
  if (!content || !content.startsWith("<")) {
    return (
      <div className="not-prose my-5 rounded-xl border border-dashed border-amber-400 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
        Wireframe dari model tidak valid/kosong — coba <b>Refine</b> dengan
        instruksi "perbaiki wireframe di bab 11 agar berisi HTML mockup visual".
      </div>
    );
  }
  return (
    <div className="not-prose my-5 overflow-hidden rounded-xl border border-zinc-300 dark:border-zinc-700">
      <div className="border-b border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
        Wireframe preview
      </div>
      <iframe
        title="Wireframe preview"
        sandbox=""
        srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8">${BASE_DOC_STYLE}</head><body>${content}</body></html>`}
        className="block h-96 w-full bg-white"
      />
    </div>
  );
}

function wireframeChildOfPre(children: ReactNode): boolean {
  const child = Array.isArray(children) ? children[0] : children;
  if (!isValidElement(child)) return false;
  const props = child.props as {
    className?: string;
    node?: unknown;
  };
  return isWireframeClass(props.className, nodeMeta(props.node));
}

const components: Components = {
  pre({ children }) {
    if (wireframeChildOfPre(children)) {
      return <>{children}</>;
    }
    return <pre>{children}</pre>;
  },
  code({ className, children, node }) {
    if (isWireframeClass(className, nodeMeta(node))) {
      return <WireframeFrame html={String(children)} />;
    }
    return <code className={className}>{children}</code>;
  },
  table({ children }) {
    return (
      <div className="not-prose my-5 overflow-x-auto rounded-xl border border-zinc-300 dark:border-zinc-700">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th className="border-b border-zinc-300 bg-zinc-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        {children}
      </th>
    );
  },
  td({ children }) {
    return (
      <td className="border-b border-zinc-200 px-3 py-2 align-top text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
        {children}
      </td>
    );
  },
};

function MarkdownView({ content }: { content: string }) {
  return (
    <div className="prose prose-zinc dark:prose-invert prose-headings:scroll-mt-24 max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default memo(MarkdownView);
