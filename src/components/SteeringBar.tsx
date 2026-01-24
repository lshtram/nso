"use client";

import React, { useState } from "react";
import { Command, X, Send, Sparkles, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const SteeringBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: "Brain ready. Steering parameters active." }
  ]);

  const handleSend = () => {
    if (!query.trim()) return;
    setMessages([...messages, { role: 'user', text: query }]);
    setQuery("");
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', text: "Adjustment confirmed. I've bumped relevance for high-integrity signals in that sector." }]);
    }, 600);
  };

  return (
    <div className="fixed bottom-10 right-10 z-[120] flex flex-col items-center pointer-events-none">
      {/* Expanded Chat Interface - Positioned above and around the input box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-[540px] mb-[-40px] pointer-events-auto relative z-10" // Extra width to envelope
          >
            <div className="bg-white/60 backdrop-blur-3xl border border-white/40 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col h-[500px]">
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

              <div className="flex-grow overflow-y-auto p-8 space-y-6">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-5 rounded-[1.8rem] text-[14px] font-bold leading-relaxed ${m.role === 'user' ? 'bg-black text-white shadow-lg rounded-br-none' : 'bg-white/80 text-gray-800 rounded-bl-none border border-white/40 shadow-sm'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-white/20 bg-white/10 flex gap-4 pb-16"> {/* Extra bottom padding to clear the input shadow */}
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

      {/* Floating Glass Box - Input Bar */}
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
            className="bg-black text-[var(--chrome-yellow)] p-4 rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <Send size={18} className="stroke-[3px]" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
