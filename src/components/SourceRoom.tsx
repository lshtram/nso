"use client";

import React, { useState } from "react";
import { SourceEntity } from "@/types";
import { AI_SEED_SOURCES } from "@/lib/pipeline/seed";
import { Plus, Search, ArrowUpDown, ChevronLeft, Zap, LayoutGrid, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SteeringBar } from "./SteeringBar";
import { SourceEntityCard } from "./SourceEntityCard";

interface Props {
  onBack: () => void;
  persona: string;
  onPersonaChange: (p: string) => void;
  onBrainDiscovery: () => void;
  sources: SourceEntity[];
  onToggleSource: (id: string) => void;
}

export const SourceRoom: React.FC<Props> = ({ 
  onBack, 
  persona, 
  onPersonaChange, 
  onBrainDiscovery,
  sources,
  onToggleSource
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const toggleSource = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSource(id);
  };

  const channelTypes = ["All", "github", "rss", "youtube"];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Compact Header */}
      <header className="bg-black py-6 px-12 sticky top-0 z-30 border-b border-white/5 flex items-center justify-between gap-10">
        <div className="flex items-center gap-6">
           <button onClick={onBack} className="text-gray-500 hover:text-white transition-colors">
              <ChevronLeft size={20} />
           </button>
           <h1 className="text-xl font-black uppercase tracking-tighter text-white">The Collection</h1>
           <div className="h-6 w-[1px] bg-white/20"></div>
           <div className="flex gap-2">
              {channelTypes.map(type => (
                <button 
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-[var(--chrome-yellow)] text-black' : 'text-gray-500 hover:text-white'}`}
                >
                  {type}
                </button>
              ))}
           </div>
        </div>
        
        <div className="relative flex-grow max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white outline-none focus:border-[var(--chrome-yellow)]/50 transition-all font-medium"
          />
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
             {[
               { id: 'Neutral Brief', icon: '📄' },
               { id: 'News Anchor', icon: '🎙️' },
               { id: 'Scientific Review', icon: '🔬' }
             ].map(p => (
               <button
                 key={p.id}
                 onClick={() => onPersonaChange(p.id)}
                 className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${persona === p.id ? 'bg-[var(--chrome-yellow)] text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                 title={p.id}
               >
                 {p.icon}
               </button>
             ))}
          </div>

          <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden p-1">
            <button 
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? 'bg-[var(--chrome-yellow)] text-black' : 'text-gray-500 hover:text-white'}`}
            >
              <List size={14} />
            </button>
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? 'bg-[var(--chrome-yellow)] text-black' : 'text-gray-500 hover:text-white'}`}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
          <button 
            onClick={onBrainDiscovery}
            className="bg-black text-[var(--chrome-yellow)] border border-[var(--chrome-yellow)]/30 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[var(--chrome-yellow)]/10 transition-all flex items-center gap-2"
          >
            <Zap size={14} /> Brain Discovery
          </button>
          <button className="bg-[var(--chrome-yellow)] text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
            <Plus size={14} /> Add Source
          </button>
        </div>
      </header>

      {/* Tight List View */}
      <main className="flex-grow max-w-[1400px] mx-auto w-full border-x border-gray-100 pb-60">
        {viewMode === "list" ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 divide-x divide-gray-100 border-x border-gray-100">
            {sources.map((source) => {
              const isExpanded = expandedId === source.id;
              return (
                <div 
                  key={source.id}
                  onClick={() => setExpandedId(isExpanded ? null : source.id)}
                  className={`group border-b border-gray-100 transition-all cursor-pointer hover:bg-gray-50/50 ${source.isActive ? 'opacity-100' : 'opacity-50 grayscale'}`}
                >
                  <div className="px-6 py-4 flex items-center justify-between gap-6">
                   <div className="flex items-center gap-4 min-w-[200px]">
                       <div className="text-lg w-8 text-center bg-gray-50 p-2 rounded-lg grayscale group-hover:grayscale-0 transition-all">
                         {source.type === 'youtube' && '📺'}
                         {source.type === 'rss' && '📰'}
                         {source.type === 'github' && '🛠️'}
                       </div>
                       <div className="flex flex-col">
                         <h3 className="font-black text-[12px] uppercase tracking-tight text-gray-900 leading-none mb-1">{source.name}</h3>
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                           {source.type} <span className="text-gray-300 mx-1">/</span> intelligence node
                         </p>
                       </div>
                   </div>

                   {!isExpanded && (
                     <div className="flex-grow flex items-center justify-end gap-6 text-[9px] font-black uppercase tracking-widest text-gray-400">
                         <div className="flex items-center gap-1">
                           <Zap size={10} className="text-[var(--chrome-yellow)]" /> {source.signalScore || 94}%
                         </div>
                         <div className="font-mono text-[8px] lowercase opacity-40 truncate max-w-[100px]">{new URL(source.url).hostname}</div>
                     </div>
                   )}

                   <div className="flex items-center gap-4">
                       <button 
                         onClick={(e) => toggleSource(source.id, e)}
                         className={`w-10 h-5 rounded-full transition-all relative flex items-center ${source.isActive ? 'bg-black' : 'bg-gray-200'}`}
                       >
                         <motion.div 
                           animate={{ x: source.isActive ? 22 : 2 }}
                           className={`w-3.5 h-3.5 rounded-full shadow-md ${source.isActive ? 'bg-[var(--chrome-yellow)]' : 'bg-white'}`}
                         />
                       </button>
                   </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-gray-50/30"
                    >
                      <div className="px-6 pb-8 pt-2 space-y-6">
                          <p className="text-[12px] text-gray-600 leading-relaxed font-medium italic border-l-2 border-gray-200 pl-4">
                            Polling logic: Discovery Stage 1 (6-hour interval). 
                            Anchoring applied for key AI entities.
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">Source URL</div>
                                <div className="text-[10px] font-mono text-black truncate">{source.url}</div>
                              </div>
                              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">Integrity</div>
                                <div className="text-sm font-black text-black">Active Pulse</div>
                              </div>
                          </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {sources.map((source) => (
              <SourceEntityCard 
                 key={source.id} 
                 source={source} 
                 onClick={() => setExpandedId(expandedId === source.id ? null : source.id)} 
              />
            ))}
          </div>
        )}
      </main>

      {/* <SteeringBar /> Removed to fix build, will replace with proper Add Source workflow */}
    </div>
  );
};
