import { memo } from "react";
import ReactMarkdown from "react-markdown";

function MarkdownView({ content }: { content: string }) {
  return (
    <div className="prose prose-zinc dark:prose-invert prose-headings:scroll-mt-24 max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export default memo(MarkdownView);
