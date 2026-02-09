
"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SourceEntity } from "@/types";
import { discoveryChatAction } from "@/lib/actions/discovery";
import { ChatToolCard } from "./ChatToolCard";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  tools?: any[];
}

interface Props {
  sources: SourceEntity[];
  weights?: Record<string, number>;
  onAddSource: (source: Partial<SourceEntity>) => void;
  variant: 'overlay' | 'full';
  initialMessage?: string;
  placeholder?: string;
  className?: string; // For layout overrides
  onTypingChange?: (isTyping: boolean) => void;
}

export interface ChatSessionHandle {
  sendMessage: (text: string) => Promise<void>;
  addMessage: (msg: Message) => void;
}

export const ChatSession = React.forwardRef<ChatSessionHandle, Props>(({ 
  sources, 
  weights, 
  onAddSource, 
  variant, 
  initialMessage = "Ready.", 
  placeholder = "Type a message...",
  className,
  onTypingChange
}, ref) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', text: initialMessage }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    onTypingChange?.(true);

    try {
      const { response, tools } = await discoveryChatAction(text, sources, weights);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response,
        tools
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', text: "Signal interruption." }]);
    } finally {
      setIsTyping(false);
      onTypingChange?.(false);
    }
  };

  React.useImperativeHandle(ref, () => ({
    sendMessage,
    addMessage: (msg) => setMessages(prev => [...prev, msg])
  }));

  const handleSendInput = () => {
    if (input.trim()) {
       sendMessage(input);
       setInput("");
    }
  };

  const isOverlay = variant === 'overlay';

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Message List */}
      <div 
        ref={scrollRef} 
        className={`flex-grow overflow-y-auto no-scrollbar scroll-smooth space-y-6 ${isOverlay ? 'p-6' : 'px-4 md:px-8 pt-6 pb-24'}`}
      >
        <div className={isOverlay ? '' : 'max-w-7xl mx-auto space-y-8'}>
            {messages.map((msg) => (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id} 
                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    {msg.role === 'assistant' && !isOverlay && (
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-[var(--chrome-yellow)] flex-shrink-0 mt-1">
                            <Bot size={18} />
                        </div>
                    )}

                    <div className={`flex flex-col gap-2 max-w-[90%] ${isOverlay ? 'text-xs' : 'md:max-w-[80%]'}`}>
                        <div className={`
                            relative px-5 py-4 rounded-2xl leading-relaxed
                            ${msg.role === 'user' 
                                ? 'bg-black text-white rounded-br-none shadow-md' 
                                : `bg-white text-gray-800 border-gray-100 rounded-bl-none shadow-sm ${isOverlay ? 'border border-white/60 bg-white/80' : 'bg-gray-50 border'}`
                            }
                        `}>
                            {/* JSON Cleaning: Remove raw blocks if they leaked, though backend should hide them. 
                                We render clean markdown. */}
                            <div className={`prose max-w-none ${isOverlay ? 'prose-xs' : 'prose-sm md:prose-base'} prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-white`}>
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        pre: ({node, ...props}) => <div className="overflow-auto rounded-lg my-2"><pre {...props} /></div>,
                                        code: ({node, ...props}) => <code className="bg-gray-200/50 px-1 rounded font-mono text-[0.9em]" {...props} />
                                    }}
                                >
                                    {msg.text.replace(/\{[\s\S]*?\}/g, '').trim()}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {/* Analysis Tools / Subscribe Cards */}
                        {msg.tools && msg.tools.some((t: any) => t.action === 'ADD_SOURCE') && (
                            <div className={`grid gap-2 mt-2 ${isOverlay ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                                {msg.tools.filter((t: any) => t.action === 'ADD_SOURCE').map((tool: any, i: number) => (
                                    <ChatToolCard 
                                        key={i} 
                                        tool={tool} 
                                        onAddSource={onAddSource}
                                        isExisting={sources.some(s => s.url === tool.url)}
                                        variant={variant}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}

            {isTyping && (
                <div className={`flex gap-3 ${isOverlay ? 'text-xs' : ''}`}>
                    {!isOverlay && (
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-[var(--chrome-yellow)]">
                             <Loader2 size={18} className="animate-spin" />
                        </div>
                    )}
                    <div className={`${isOverlay ? 'bg-white/40 p-3' : 'bg-gray-50 px-6 py-4'} rounded-2xl italic text-gray-400 font-medium animate-pulse flex items-center gap-2`}>
                        {isOverlay && <Loader2 size={12} className="animate-spin" />}
                        Analyzing neural vector space...
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Input Area */}
      <div className={`
        ${isOverlay ? 'p-0' : 'p-8 bg-white border-t border-gray-100'}
        transition-all
      `}>
         {!isOverlay ? (
            // Full Page Input
            <div className="max-w-3xl mx-auto relative">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendInput()}
                    placeholder={placeholder}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-6 pr-16 text-sm outline-none focus:border-[var(--chrome-yellow)]/50 transition-all font-medium text-gray-900"
                />
                <button 
                  onClick={handleSendInput}
                  disabled={!input.trim() || isTyping}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    input.trim() && !isTyping ? 'bg-black text-[var(--chrome-yellow)] hover:scale-105' : 'bg-gray-100 text-gray-300'
                  }`}
                >
                  <Send size={16} />
                </button>
            </div>
         ) : (
             <></>
         )}
      </div>
    </div>
  );
});
