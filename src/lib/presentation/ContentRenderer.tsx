"use client";

import React, { useEffect, useRef } from 'react';
import { ContentItem } from '@/types';

interface Props {
  item: ContentItem;
}

/**
 * ContentRenderer: The "Presentation Module" orchestrator.
 * Dynamically renders content based on source type (RSS, YouTube, PDF, etc.)
 */
export const ContentRenderer: React.FC<Props> = ({ item }) => {
  // Inject KaTeX styles globally if not present
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('katex-css')) {
      const link = document.createElement('link');
      link.id = 'katex-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
      document.head.appendChild(link);
    }
  }, []);

  switch (item.sourceType) {
    case 'rss':
    case 'medium':
    case 'arxiv':
    case 'github':
      return <RssRenderer content={item.fullText || ''} />;
    default:
      return <RssRenderer content={item.fullText || ''} />;
  }
};

const RssRenderer: React.FC<{ content: string }> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scientific math rendering detection
    if (containerRef.current && (content.includes('$') || content.includes('\\(') || content.includes('\\['))) {
      const scriptId = 'katex-auto-render-script';
      
      const renderMath = () => {
        if ((window as any).renderMathInElement) {
          (window as any).renderMathInElement(containerRef.current, {
            delimiters: [
              {left: '$$', right: '$$', display: true},
              {left: '$', right: '$', display: false},
              {left: '\\(', right: '\\)', display: false},
              {left: '\\[', right: '\\]', display: true}
            ],
            throwOnError: false
          });
        }
      };

      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js';
        script.onload = renderMath;
        document.head.appendChild(script);
      } else {
        renderMath();
      }
    }
  }, [content]);

  return (
    <div 
      ref={containerRef}
      className="article-body prose prose-lg md:prose-xl max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
