
"use client";
import React from "react";
import { ChevronLeft } from "lucide-react";
import { SourceEntity } from "@/types";
import { ChatSession } from "./chat/ChatSession";

interface Props {
  onBack: () => void;
  sources: SourceEntity[];
  onAddSource: (source: Partial<SourceEntity>) => void;
}

export const BrainDiscoveryRoom: React.FC<Props> = ({ onBack, sources, onAddSource }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans">
      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
         <div className="flex items-center gap-6">
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-500"
            >
               <ChevronLeft size={20} />
            </button>
            <div>
               <h1 className="text-sm font-black uppercase tracking-widest text-gray-900">Brain Discovery</h1>
               <p className="text-[10px] font-medium text-gray-400">Neural Interrogation Interface</p>
            </div>
         </div>
      </header>

      {/* Chat Session */}
      <ChatSession 
        variant="full"
        sources={sources}
        onAddSource={onAddSource}
        initialMessage="Hello. I am the system's Intelligence Brain. I've analyzed your reading patterns and current library. How can I help you sharpen your global sweep today?"
        placeholder="Interrogate the brain..."
        className="flex-grow bg-white"
      />
    </div>
  );
};
