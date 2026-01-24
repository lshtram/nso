"use client";

import React, { useState } from "react";
import { DailySummaryHero } from "@/components/DailySummaryHero";
import { TopicStream } from "@/components/TopicStream";
import { SteeringBar } from "@/components/SteeringBar";
import { DeepDiveView } from "@/components/DeepDiveView";
import { SourceRoom } from "@/components/SourceRoom";
import { InterestEqualizer } from "@/components/InterestEqualizer";
import { MOCK_CLUSTERS } from "@/lib/mocks";
import { StoryCluster } from "@/types";
import { Settings, LayoutGrid } from "lucide-react";

type ViewState = "dashboard" | "deep-dive" | "management";

export default function Home() {
  const [view, setView] = useState<ViewState>("dashboard");
  const [selectedCluster, setSelectedCluster] = useState<StoryCluster | null>(null);

  const techClusters = MOCK_CLUSTERS.filter(c => c.category === "TECH");
  const philosophyClusters = MOCK_CLUSTERS.filter(c => c.category === "PHILOSOPHY");

  const dailySummary = {
    headline: "Global AI Accord Reached: Nations Unite on Safe Development",
    content: "Major world powers have signed a landmark agreement to establish universal ethical guidelines and safety protocols for artificial intelligence development. This historic pact aims to mitigate existential risks and ensure AI benefits all of humanity. Meanwhile, philosophical discussions are centering on the ethical implications of digital dualism in modern society."
  };

  const handleDeepDive = (cluster: StoryCluster) => {
    setSelectedCluster(cluster);
    setView("deep-dive");
  };

  if (view === "deep-dive" && selectedCluster) {
    return <DeepDiveView cluster={selectedCluster} onBack={() => setView("dashboard")} />;
  }

  if (view === "management") {
    return (
      <div className="relative">
        <button 
           onClick={() => setView("dashboard")}
           className="fixed top-8 left-8 z-[100] p-3 bg-white shadow-xl rounded-full hover:scale-110 transition-transform"
        >
          <LayoutGrid size={24} className="text-indigo-600" />
        </button>
        <SourceRoom />
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-32">
      {/* Header Controls */}
      <div className="fixed top-8 right-8 z-50 flex gap-4">
        <button 
          onClick={() => setView("management")}
          className="p-3 bg-white/10 backdrop-blur shadow-xl rounded-full text-white hover:bg-white hover:text-black transition-all"
          title="Management Source Room"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Dark Section (Hero) */}
      <DailySummaryHero summary={dailySummary} />

      {/* Light Section (Streams) */}
      <section className="section-light py-20 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto space-y-24">
          <TopicStream title="Tech" clusters={techClusters} onCardClick={handleDeepDive} />
          <TopicStream title="Philosophy" clusters={philosophyClusters} onCardClick={handleDeepDive} />
        </div>
      </section>

      {/* Brain Command Bar */}
      <SteeringBar />
    </main>
  );
}