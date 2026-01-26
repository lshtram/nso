import "client-only";
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronLeft, Send, Sparkles, Plus, Check, Loader2, User, Bot, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { discoveryChatAction } from "@/lib/actions/discovery";
import { SourceEntity } from "@/types";

interface Props {
  onBack: () => void;
  sources: SourceEntity[];
  onAddSource: (source: Partial<SourceEntity>) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  tools?: any[];
}

export const BrainDiscoveryRoom: React.FC<Props> = ({ onBack, sources, onAddSource }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      text: "Hello. I am the system's Intelligence Brain. I've analyzed your reading patterns and current library. How can I help you sharpen your global sweep today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const { response, tools } = await discoveryChatAction(input, sources);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response,
        tools: tools
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', text: "I've encountered a synapse failure. Please retry your query." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans">
      {/* ... (header) ... */}

      {/* Chat Area - Expanded Width & Font */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto px-4 md:px-8 pt-6 pb-24 space-y-6 bg-white no-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8">
          {messages.map((msg) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id} 
              className={`flex gap-6 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-[var(--chrome-yellow)] flex-shrink-0">
                  <Bot size={18} />
                </div>
              )}
              
              <div className="flex flex-col gap-3 max-w-[90%] md:max-w-[80%]">
                <div className={`px-8 py-6 rounded-3xl text-base leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-black text-white font-medium' 
                    : 'bg-gray-50 text-gray-800 border border-gray-100 font-medium'
                }`}>
                  {msg.role === 'assistant' ? (
                     <div className="prose prose-sm md:prose-base max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-white prose-a:text-blue-600">
                       <ReactMarkdown 
                         remarkPlugins={[remarkGfm]}
                         components={{
                           pre: ({node, ...props}) => <div className="overflow-auto rounded-lg my-2"><pre {...props} /></div>,
                           code: ({node, ...props}) => <code className="bg-gray-200/50 px-1 rounded" {...props} />
                         }}
                       >
                         {msg.text}
                       </ReactMarkdown>
                     </div>
                  ) : (
                    msg.text
                  )}
                </div>

                {/* Discovery Suggestions */}
                {msg.tools && msg.tools.some(t => t.action === 'ADD_SOURCE') && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {msg.tools.filter(t => t.action === 'ADD_SOURCE').map((tool, i) => {
                      const exists = sources.some(s => s.url === tool.url);
                      return (
                        <div key={i} className={`bg-white border-2 p-5 rounded-2xl flex items-center justify-between gap-4 ${exists ? 'border-gray-100 opacity-60' : 'border-dashed border-[var(--chrome-yellow)]/30'}`}>
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${exists ? 'bg-gray-100 text-gray-400' : 'bg-[var(--chrome-yellow)]/10'}`}>
                               {tool.type === 'rss' ? '📰' : '🛠️'}
                             </div>
                             <div className="flex flex-col gap-1">
                               <span className="text-xs font-black uppercase text-gray-900">{tool.name}</span>
                               <span className="text-[9px] font-mono text-gray-400 truncate max-w-[180px]">{tool.url}</span>
                             </div>
                          </div>
                          {!exists ? (
                            <button 
                              onClick={() => {
                                onAddSource({ id: tool.name.toLowerCase().replace(/\s/g, '-'), name: tool.name, url: tool.url, type: tool.type, isActive: true });
                              }}
                              className="px-5 py-2.5 bg-[var(--chrome-yellow)] text-black text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 hover:scale-105 transition-all shadow-sm"
                            >
                              <Plus size={12} /> Add
                            </button>
                          ) : (
                            <span className="px-4 py-2 bg-gray-100 text-gray-400 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2">
                              <Check size={12} /> Active
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                  <User size={18} />
                </div>
              )}
            </motion.div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-[var(--chrome-yellow)]">
                <Loader2 size={18} className="animate-spin" />
              </div>
              <div className="bg-gray-50 px-6 py-5 rounded-3xl text-sm italic text-gray-400 font-medium">
                Establishing neural link...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <footer className="p-8 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Interrogate the brain..."
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-6 pr-16 text-xs outline-none focus:border-[var(--chrome-yellow)]/50 transition-all font-medium text-gray-900"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              input.trim() && !isTyping ? 'bg-black text-[var(--chrome-yellow)]' : 'bg-gray-100 text-gray-300'
            }`}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-center mt-4 text-[8px] font-black uppercase tracking-[0.3em] text-gray-300">
          The Brain adapts to every signal. Your preferences are being recorded to docs/user_profile.md
        </p>
      </footer>
    </div>
  );
};
