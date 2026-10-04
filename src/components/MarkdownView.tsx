import { isValidElement, memo, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";

function WireframeFrame({ html }: { html: string }) {
  return (
    <div className="not-prose my-5 overflow-hidden rounded-xl border border-zinc-300 dark:border-zinc-700">
      <div className="border-b border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
        Wireframe preview
      </div>
      <iframe
        title="Wireframe preview"
        sandbox=""
        srcDoc={html}
        className="h-96 w-full block bg-white"
      />
    </div>
  );
}

function childClassName(children: ReactNode): string | undefined {
  const child = Array.isArray(children) ? children[0] : children;
  if (isValidElement(child)) {
    return (child.props as { className?: string }).className;
  }
  return undefined;
}

const components: Components = {
  pre({ children }) {
    if (childClassName(children) === "language-wireframe") {
      return <>{children}</>;
    }
    return <pre>{children}</pre>;
  },
  code({ className, children }) {
    if (className === "language-wireframe") {
      return <WireframeFrame html={String(children)} />;
    }
    return <code className={className}>{children}</code>;
  },
};

function MarkdownView({ content }: { content: string }) {
  return (
    <div className="prose prose-zinc dark:prose-invert prose-headings:scroll-mt-24 max-w-none">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}

export default memo(MarkdownView);
