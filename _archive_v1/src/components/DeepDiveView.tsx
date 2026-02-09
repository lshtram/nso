"use client";

import React from "react";
import { StoryCluster, SourceEntity } from "@/types";
import { ChevronLeft, Share2, Bookmark, ExternalLink, Sparkles, AlertTriangle, ThumbsUp, ThumbsDown, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { SteeringBar } from "./SteeringBar";
import { ContentRenderer } from "@/lib/presentation/ContentRenderer";

interface Props {
  cluster: StoryCluster;
  onBack: () => void;
  sources: SourceEntity[];
  weights: Record<string, number>;
  onAddSource: (source: Partial<SourceEntity>) => void;
}

export const DeepDiveView: React.FC<Props> = ({ cluster, onBack, sources, weights, onAddSource }) => {
  const primaryItem = cluster.items[0];
  const mainImage = primaryItem?.imageUrl;

  const [leftWidth, setLeftWidth] = React.useState(540); 
  const [isResizing, setIsResizing] = React.useState(false);

  const startResizing = React.useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 400 && newWidth < (window.innerWidth - 400)) {
        setLeftWidth(newWidth);
      }
    }
  }, [isResizing]);

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.cursor = 'default';
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'default';
    };
  }, [isResizing, resize, stopResizing]);

  // Parse refined narrative structure
  let pulse = {
    brief: "Analysis pending...",
    summary: cluster.narrative,
    takeaways: cluster.highlights || []
  };

  try {
    if (cluster.narrative.startsWith('{')) {
      pulse = JSON.parse(cluster.narrative);
    }
  } catch (e) {}

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-row overflow-hidden select-none">
      {/* LEFT PANE: AI Intelligence Overlay */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        style={{ width: `${leftWidth}px` }}
        className="shrink-0 bg-[#0a0a0a] text-white p-6 md:p-12 overflow-y-auto flex flex-col relative border-r border-white/5 no-scrollbar select-text"
      >
        <div className="flex items-center justify-between mb-12 pb-6 border-b border-white/5">
          <button 
            onClick={onBack}
            className="flex items-center gap-3 text-gray-500 hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 border-r border-white/10 pr-3">
               <button className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 text-gray-500 hover:text-white transition-all">
                 <Bookmark size={16} />
               </button>
               <button className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 text-gray-500 hover:text-white transition-all">
                 <Share2 size={16} />
               </button>
            </div>
            
            <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1.5 px-4 border border-white/5">
               <button className="text-gray-600 hover:text-green-500 p-1"><ThumbsUp size={16} /></button>
               <button className="text-gray-600 hover:text-red-500 p-1"><ThumbsDown size={16} /></button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-12">
          <div className="px-3 py-1 bg-[var(--chrome-yellow)] text-black rounded-sm text-[9px] font-black tracking-widest uppercase shadow-[0_0_20px_rgba(255,184,0,0.3)]">
            Intelligence Pulse
          </div>
          <div className="h-[1px] w-8 bg-white/10"></div>
          <span className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Active Synthesis</span>
        </div>

        <div className="space-y-16 flex-grow">
          {/* Brief Section */}
          <section className="space-y-8">
            <h3 className="text-[12px] font-black text-[var(--chrome-yellow)] uppercase tracking-[0.4em] border-b border-white/10 pb-4">The Selection Brief</h3>
            <p className="text-white text-2xl md:text-3xl leading-[1.3] font-bold tracking-tight">
              {pulse.brief}
            </p>
          </section>

          {/* Summary Section */}
          <section className="space-y-10">
            <h3 className="text-[12px] font-black text-[var(--chrome-yellow)] uppercase tracking-[0.4em] border-b border-white/10 pb-4">Full Analysis</h3>
            <div className="text-white text-[18px] md:text-[20px] leading-[1.7] space-y-8 font-medium font-serif">
               {pulse.summary.split('\n\n').map((p, i) => (
                 <p key={i} className="drop-shadow-sm">{p}</p>
               ))}
            </div>
          </section>

          {/* Key Takeaways Section */}
          <section className="space-y-10">
            <h3 className="text-[12px] font-black text-[var(--chrome-yellow)] uppercase tracking-[0.4em] border-b border-white/10 pb-4">Strategic Intelligence</h3>
            <ul className="space-y-8">
              {pulse.takeaways.map((h, i) => (
                <li key={i} className="flex gap-6 text-[17px] md:text-[19px] text-white leading-relaxed font-bold">
                  <div className="w-2 h-2 rounded-full bg-[var(--chrome-yellow)] mt-2.5 shrink-0 shadow-[0_0_15px_rgba(255,184,0,0.6)]" />
                  {h}
                </li>
              ))}
            </ul>
          </section>

          {/* METRICS & VERIFICATION BOTTOM */}
          <div className="mt-8 space-y-12 opacity-60 hover:opacity-100 transition-opacity">
            {cluster.items.length > 1 && (
              <section className="space-y-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2">Verification Grid</h3>
                <div className="flex flex-col gap-3">
                  {Array.from(new Map(cluster.items.map(i => [i.sourceName, i])).values()).map((node, i) => (
                    <a 
                      key={i}
                      href={node.url}
                      target="_blank"
                      className="flex items-center justify-between p-4 bg-white/5 rounded-xl text-[10px] text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                    >
                      <span className="font-black uppercase tracking-widest">{node.sourceName}</span>
                      <ExternalLink size={12} className="opacity-40" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            <section className="p-8 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md">
               <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-6">Neural Signal Metrics</h3>
               <div className="grid grid-cols-2 gap-8">
                  <div>
                     <div className="text-[9px] text-gray-600 uppercase font-black mb-1 tracking-widest">Clusters</div>
                     <div className="text-lg font-bold text-white tracking-tighter">{cluster.items.length} Nodes</div>
                  </div>
                  <div>
                     <div className="text-[9px] text-gray-600 uppercase font-black mb-1 tracking-widest">Confidence</div>
                     <div className="text-lg font-bold text-[var(--chrome-yellow)] tracking-tighter">94.8%</div>
                  </div>
               </div>
            </section>
          </div>
        </div>
      </motion.aside>

      {/* RESIZE HANDLE */}
      <div 
        onMouseDown={startResizing}
        className={`w-1.5 relative z-[150] cursor-col-resize group flex items-center justify-center transition-colors ${isResizing ? 'bg-[var(--chrome-yellow)]' : 'bg-white/5 hover:bg-[var(--chrome-yellow)]/30'}`}
      >
        <div className="w-[1px] h-32 bg-white/10 group-hover:bg-white/40" />
      </div>

      {/* RIGHT PANE: Original Source Content */}
      <main className="flex-grow bg-[#fff] overflow-y-auto scroll-smooth relative select-text no-scrollbar">
        <div className="max-w-4xl mx-auto py-12 px-10 md:px-20 pb-48">
          <div className="mb-12 flex items-center justify-between border-b border-gray-100 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg grayscale border border-gray-100">
                {primaryItem?.sourceType === 'github' ? '🛠️' : '📰'}
              </div>
              <div>
                <div className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">{primaryItem?.sourceType} SOURCE</div>
                <div className="text-xs font-black text-gray-900 uppercase">
                  {primaryItem?.sourceName}
                </div>
              </div>
            </div>
            
            <a 
              href={primaryItem?.url} 
              target="_blank" 
              className="px-5 py-2.5 bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              Examine Raw <ExternalLink size={12} className="text-[var(--chrome-yellow)]" />
            </a>
          </div>

          <article>
             <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tighter leading-[1.05]">
                {primaryItem?.title}
             </h2>
             
             <div className="flex items-center gap-6 mb-12 text-gray-400">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">👤</div>
                   <span className="text-[10px] font-black uppercase tracking-widest">{primaryItem?.author || primaryItem?.sourceName || 'Unknown Author'}</span>
                </div>
                <div className="flex items-center gap-2">
                   <Calendar size={12} />
                   <span className="text-[10px] font-black uppercase tracking-widest">
                      {primaryItem?.publishedAt ? new Date(primaryItem.publishedAt).toLocaleDateString() : 'N/A'}
                   </span>
                </div>
             </div>
             
             {mainImage && (
               <div className="mb-16 overflow-hidden rounded-[2.5rem] bg-gray-50 border border-gray-100 min-h-[100px] flex items-center justify-center">
                 <img 
                    src={mainImage} 
                    className="w-full h-auto max-h-[600px] object-contain mx-auto" 
                    alt="Article Hero" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.style.display = 'none';
                    }}
                 />
               </div>
             )}

             <div className="max-w-[750px] mx-auto space-y-10">
                <ContentRenderer item={primaryItem} />
             </div>
          </article>
        </div>
      </main>

      <SteeringBar 
        sources={sources} 
        weights={weights} 
        onAddSource={onAddSource} 
      />
    </div>
  );
};
