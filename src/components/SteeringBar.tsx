"use client";

import React, { useState } from "react";
import { Command, X, Send, Sparkles, Plus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SourceEntity } from "@/types";
import { discoveryChatAction } from "@/lib/actions/discovery";

interface Props {
  sources: SourceEntity[];
  weights: Record<string, number>;
  onAddSource: (source: Partial<SourceEntity>) => void;
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  tools?: any[];
}

export const SteeringBar: React.FC<Props> = ({ sources, weights, onAddSource }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'bot', text: "Brain ready. Steering parameters active." }
  ]);

  const handleSend = async () => {
    if (!query.trim() || isTyping) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    setIsTyping(true);

    try {
      const { response, tools } = await discoveryChatAction(query, sources, weights);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: response,
        tools: tools
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { id: 'err', role: 'bot', text: "Synapse timeout. Re-establishing link..." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-10 right-10 z-[120] flex flex-col items-center pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-[540px] mb-[-40px] pointer-events-auto relative z-10"
          >
            <div className="bg-white/80 backdrop-blur-3xl border border-white/40 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col h-[500px]">
              <div className="p-8 border-b border-white/20 flex justify-between items-center bg-white/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-[var(--chrome-yellow)]">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-black/80">Intelligence Steering</h3>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors text-black/40">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-8 space-y-6 no-scrollbar">
                {messages.map((m) => (
                  <div key={m.id} className="space-y-4">
                    <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-5 rounded-[1.8rem] text-[13px] font-medium leading-relaxed ${m.role === 'user' ? 'bg-black text-white shadow-lg rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100 shadow-sm'}`}>
                        {m.text.replace(/\{[\s\S]*?\}/g, '').trim()}
                      </div>
                    </div>
                    
                    {/* Tool/Recommendation Rendering */}
                    {m.tools && m.tools.some(t => t.action === 'ADD_SOURCE') && (
                      <div className="grid grid-cols-1 gap-2 pl-4">
                        {m.tools.filter(t => t.action === 'ADD_SOURCE').map((tool, i) => (
                           <div key={i} className="bg-white/40 border border-white/60 p-4 rounded-2xl flex items-center justify-between gap-4 backdrop-blur-md">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-[var(--chrome-yellow)] flex items-center justify-center text-lg shadow-sm">
                                 {tool.type === 'rss' ? '📰' : '🛠️'}
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-[10px] font-black uppercase text-gray-900">{tool.name}</span>
                                 <span className="text-[8px] font-mono text-gray-400 truncate max-w-[150px]">{tool.url}</span>
                               </div>
                             </div>
                             <button 
                               onClick={() => {
                                 onAddSource({ id: tool.name.toLowerCase().replace(/\s/g, '-'), name: tool.name, url: tool.url, type: tool.type || 'rss', isActive: true });
                               }}
                               className="px-4 py-2 bg-black text-[var(--chrome-yellow)] text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md"
                             >
                               Subscribe
                             </button>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl text-[10px] italic text-gray-400 font-bold animate-pulse">
                      Processing neural signals...
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/20 bg-white/10 flex gap-4 pb-16">
                <button className="flex-grow py-3 bg-white/40 border border-white/40 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/60 transition-all text-black/60">
                   <Plus size={14} className="inline mr-2" /> Source
                </button>
                <button className="flex-grow py-3 bg-white/40 border border-white/40 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/60 transition-all text-black/60">
                   <Command size={14} className="inline mr-2" /> Policy
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        layout
        className="pointer-events-auto w-[500px] relative z-20"
      >
        <div className={`relative bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden p-2 flex items-center group transition-all duration-500 ${isOpen ? 'shadow-2xl scale-[1.02] border-white/80' : ''}`}>
          <div className="flex items-center px-6 py-3 flex-grow gap-4">
            <Command size={18} className="text-black/30 group-focus-within:text-black transition-colors" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Steer the collection..."
              className="bg-transparent border-none outline-none flex-grow text-black placeholder-black/30 font-bold text-sm h-8"
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={!query.trim() || isTyping}
            className="bg-black text-[var(--chrome-yellow)] p-4 rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-lg border border-[var(--chrome-yellow)]/20"
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="stroke-[3px]" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
