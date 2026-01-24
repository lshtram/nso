"use client";

import React from "react";
import { StoryCluster } from "@/types";
import { ChevronLeft, Share2, Bookmark, ExternalLink, Sparkles, Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { SteeringBar } from "./SteeringBar";
import { KnowledgeMap } from "./KnowledgeMap";

interface Props {
  cluster: StoryCluster;
  onBack: () => void;
}

export const DeepDiveView: React.FC<Props> = ({ cluster, onBack }) => {
  const mainImage = cluster.topItems[0]?.imageUrl || "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1200";

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col md:flex-row overflow-hidden">
      {/* LEFT PANE: AI Intelligence Overlay (Dark Glassmorphism) */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full md:w-[480px] bg-[#0a0a0a] text-white p-6 md:p-12 overflow-y-auto flex flex-col relative border-r border-white/5"
      >
        <button 
          onClick={onBack}
          className="flex items-center gap-3 text-gray-500 hover:text-white mb-12 transition-colors uppercase text-[10px] font-black tracking-widest self-start"
        >
          <ChevronLeft size={16} /> Dashboard
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="px-2 py-1 bg-[var(--chrome-yellow)] text-black rounded text-[9px] font-black tracking-widest">INTEL V1</div>
          <div className="h-[1px] w-8 bg-white/10"></div>
          <span className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Analysis Engine Active</span>
        </div>

        <div className="mb-12">
          <h1 className="text-3xl md:text-5xl font-black mb-8 leading-[1] tracking-tighter text-white">
            {cluster.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            {cluster.topItems[0]?.entities?.slice(0, 4).map(ent => (
              <span key={ent} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-tighter hover:bg-white/10 transition-colors">
                {ent}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-12 flex-grow">
          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-[var(--chrome-yellow)] uppercase tracking-[0.2em]">Full Synthesis</h3>
            <p className="text-xl text-gray-300 leading-relaxed font-medium italic border-l-2 border-[var(--chrome-yellow)]/30 pl-8 py-2">
              {cluster.narrative}
            </p>
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-[var(--chrome-yellow)] uppercase tracking-[0.2em]">Visual Synthesis</h3>
            <KnowledgeMap />
          </section>

          <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-3">
               <Sparkles size={14} className="text-[var(--chrome-yellow)]" /> Reasoning
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed font-medium">
              {cluster.whyItMatters}
            </p>
          </section>
        </div>

        <div className="mt-16 pt-10 border-t border-white/5 flex items-center justify-between pb-32">
          <div className="flex gap-4">
             <button className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 text-gray-500 hover:text-white transition-all">
               <Bookmark size={20} />
             </button>
             <button className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 text-gray-500 hover:text-white transition-all">
               <Share2 size={20} />
             </button>
          </div>
        </div>
      </motion.aside>

      {/* RIGHT PANE: Original Source Content */}
      <main className="flex-grow bg-[#fcfcfc] overflow-y-auto scroll-smooth relative">
        <div className="max-w-4xl mx-auto py-20 px-10 md:px-20 pb-48">
          <div className="mb-16 flex items-center justify-between border-b border-gray-100 pb-10">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl shadow-inner grayscale">
                {cluster.topItems[0]?.sourceType === 'youtube' ? '📺' : '📰'}
              </div>
              <div>
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{cluster.topItems[0]?.sourceType} origin</div>
                <div className="text-sm font-black text-gray-900">
                  {cluster.topItems[0]?.sourceName}
                </div>
              </div>
            </div>
            
            <a 
              href={cluster.topItems[0]?.url} 
              target="_blank" 
              className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center gap-3"
            >
              Examine Raw <ExternalLink size={14} className="text-[var(--chrome-yellow)]" />
            </a>
          </div>

          <article>
             <h2 className="text-4xl md:text-7xl font-black text-gray-900 mb-12 tracking-tighter leading-[0.95]">
                {cluster.topItems[0]?.title}
             </h2>
             
             <div className="mb-20 overflow-hidden rounded-[3rem] shadow-2xl border-[12px] border-white">
               <img src={mainImage} className="w-full h-[550px] object-cover" alt="Article Hero" />
             </div>

             <div className="max-w-[700px] mx-auto space-y-12">
               <p className="text-2xl font-bold text-gray-900 leading-snug tracking-tight border-l-4 border-gray-100 pl-10 mb-16 py-3 italic">
                 {cluster.topItems[0]?.summary}
               </p>
               
               <div className="text-gray-700 text-xl leading-relaxed font-serif space-y-8">
                 <p className="first-letter:text-6xl first-letter:font-black first-letter:text-black first-letter:mr-3 first-letter:float-left">
                   The acceleration of research in this sector marks a pivotal shift in how we approach large-scale deployments. As entities transition from prototype to global systems, the focus on signal integrity becomes paramount.
                 </p>
                 <p>
                   Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                 </p>
               </div>
             </div>
          </article>
        </div>
      </main>

      {/* Global Brain Chat - Enabled on all pages */}
      <SteeringBar />
    </div>
  );
};
