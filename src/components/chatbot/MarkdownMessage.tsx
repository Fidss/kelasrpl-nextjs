"use client";

import { useEffect, useState, useMemo } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import katex from "katex";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";

interface MarkdownMessageProps {
  content: string;
}

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  const [html, setHtml] = useState("");

  const rendered = useMemo(() => {
    try {
      // 1. Pre-process math expressions ($...$ and $$...$$)
      let processed = content;

      // Display math: $$...$$
      processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
        } catch {
          return `$$${math}$$`;
        }
      });

      // Inline math: $...$
      processed = processed.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return `$${math}$`;
        }
      });

      // 2. Parse Markdown with Highlight.js
      const rawHtml = marked.parse(processed, {
        breaks: true,
        gfm: true,
      }) as string;

      return rawHtml;
    } catch {
      return content;
    }
  }, [content]);

  useEffect(() => {
    setHtml(rendered);
  }, [rendered]);

  useEffect(() => {
    // Apply syntax highlighting to code blocks
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  }, [html]);

  return (
    <div
      className="markdown-body prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html || content }}
    />
  );
}
