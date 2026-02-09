import { StoryCluster, ContentItem, SourceEntity } from "@/types";

// Helper to create more items for testing expand/collapse
const createMockItem = (id: string, title: string, category: string, imageUrl: string): ContentItem => ({
  id,
  sourceType: "rss",
  sourceName: "TechDaily",
  url: "https://example.com",
  title,
  publishedAt: new Date().toISOString(),
  fetchedAt: new Date().toISOString(),
  summary: `This is a summary for ${title}. It covers the main points and gives context.`,
  imageUrl,
  entities: ["Entity A", "Entity B"],
  topics: [category]
});

export const MOCK_CLUSTERS: StoryCluster[] = [
  // TECH CLUSTERS
  {
    id: "tech-1",
    title: "Quantum Era Acceleration",
    narrative: "Major geopolitical shifts are occurring as nations race for quantum supremacy. This historic pact aims to mitigate existential risks and ensure AI benefits all of humanity.",
    whyItMatters: "Quantum computing represents a paradigm shift that will redefine global security and economic power.",
    items: [],
    topItems: [createMockItem("t1", "Quantum Leap", "TECH", "/quantum_leap_card_1769206186514.png")],
    momentumScore: 92,
    relevanceScore: 95,
    finalRank: 1,
    category: "TECH",
    trendIndicator: "rising"
  },
  {
    id: "tech-2",
    title: "Solid-State Battery Breakthrough",
    narrative: "Researchers have achieved a 40% increase in energy density using a new solid-state electrolyte, promising EV ranges of over 1,000 miles per charge.",
    whyItMatters: "Battery tech is the bottleneck for green transit; this fixes it.",
    items: [],
    topItems: [createMockItem("t2", "Solid State", "TECH", "https://img.freepik.com/free-photo/lithium-battery-energy-storage-system-renewable-energy-concept_53876-133748.jpg")],
    momentumScore: 88,
    relevanceScore: 90,
    finalRank: 2,
    category: "TECH",
    trendIndicator: "rising"
  },
  {
    id: "tech-3",
    title: "The Rise of Distributed AI",
    narrative: "Edge computing is enabling massive AI models to run on consumer hardware without central servers, preserving privacy and reducing costs.",
    whyItMatters: "Local-first AI changes the power dynamic of the internet.",
    items: [],
    topItems: [createMockItem("t3", "Edge AI", "TECH", "https://img.freepik.com/free-photo/technology-communication-concept_23-2148813204.jpg")],
    momentumScore: 75,
    relevanceScore: 85,
    finalRank: 3,
    category: "TECH",
    trendIndicator: "stable"
  },
  {
    id: "tech-4",
    title: "Meta-Materials in 6G",
    narrative: "New programmable materials are allowing for antenna systems that can beam 1Tbps speeds around corners without signal loss.",
    whyItMatters: "Hyper-connectivity is coming sooner than we thought.",
    items: [],
    topItems: [createMockItem("t4", "6G Meta", "TECH", "https://img.freepik.com/free-photo/digital-world-background-with-interconnecting-lines-dots_1048-12499.jpg")],
    momentumScore: 60,
    relevanceScore: 70,
    finalRank: 4,
    category: "TECH",
    trendIndicator: "new"
  },

  // PHILOSOPHY CLUSTERS
  {
    id: "phil-1",
    title: "The Future of Democracy",
    narrative: "Philosophical discussions are centering on the ethical implications of digital dualism in modern society and its impact on human engagement.",
    whyItMatters: "Digital identity is fast becoming more critical than physical presence.",
    items: [],
    topItems: [createMockItem("p1", "Digital Democracy", "PHILOSOPHY", "https://img.freepik.com/free-photo/representation-user-experience-interface-design_23-2150165982.jpg")],
    momentumScore: 45,
    relevanceScore: 80,
    finalRank: 1,
    category: "PHILOSOPHY",
    trendIndicator: "stable"
  },
  {
    id: "phil-2",
    title: "The Narrative Mind",
    narrative: "Recent cognitive science suggests humans process reality through collective myth-making, which explains the surge in digital tribalism.",
    whyItMatters: "Understanding how we form beliefs is the first step to fixing polarization.",
    items: [],
    topItems: [createMockItem("p2", "Narrative Mind", "PHILOSOPHY", "https://img.freepik.com/free-photo/man-with-brain-projection_23-2148784407.jpg")],
    momentumScore: 55,
    relevanceScore: 75,
    finalRank: 2,
    category: "PHILOSOPHY",
    trendIndicator: "stable"
  },
  {
    id: "phil-3",
    title: "Post-Labor Ethics",
    narrative: "As automation nears AGI, philosophers are debating how meaning will be derived in a world where economic output is detached from human effort.",
    whyItMatters: "We are entering the 'Great Idleness' or 'Great Creative' era.",
    items: [],
    topItems: [createMockItem("p3", "Post Labor", "PHILOSOPHY", "https://img.freepik.com/free-photo/robot-hand-pointing-something_23-2148784433.jpg")],
    momentumScore: 90,
    relevanceScore: 95,
    finalRank: 3,
    category: "PHILOSOPHY",
    trendIndicator: "rising"
  }
];

export const MOCK_SOURCES: SourceEntity[] = [
  { id: "src-1", name: "Nate Jones", type: "youtube", url: "https://youtube.com/@natejones", isActive: true, healthStatus: "active", signalScore: 98 },
  { id: "src-2", name: "Beyond Data Science", type: "medium", url: "https://medium.com/beyond-data-science", isActive: true, healthStatus: "active", signalScore: 85 },
  { id: "src-3", name: "TechCrunch", type: "rss", url: "https://techcrunch.com/feed", isActive: true, healthStatus: "active", signalScore: 92 },
  { id: "src-4", name: "Lex Fridman", type: "youtube", url: "https://youtube.com/@lexfridman", isActive: true, healthStatus: "active", signalScore: 95 },
  { id: "src-5", name: "Andrej Karpathy", type: "x", url: "https://x.com/karpathy", isActive: true, healthStatus: "active", signalScore: 99 },
  { id: "src-6", name: "Hacker News", type: "rss", url: "https://news.ycombinator.com/rss", isActive: true, healthStatus: "active", signalScore: 88 },
  { id: "src-7", name: "Verge", type: "rss", url: "https://theverge.com/rss", isActive: false, healthStatus: "muted", signalScore: 70 },
  { id: "src-8", name: "Arxiv ML", type: "arxiv", url: "https://arxiv.org/list/cs.LG", isActive: true, healthStatus: "active", signalScore: 94 },
  { id: "src-9", name: "Reddit /r/MachineLearning", type: "reddit", url: "https://reddit.com/r/MachineLearning", isActive: true, healthStatus: "active", signalScore: 82 },
  { id: "src-10", name: "GitHub Releases", type: "github", url: "https://github.com/trending", isActive: true, healthStatus: "active", signalScore: 91 },
  { id: "src-11", name: "Paul Graham", type: "rss", url: "http://paulgraham.com/rss.html", isActive: true, healthStatus: "active", signalScore: 97 },
  { id: "src-12", name: "Wait But Why", type: "rss", url: "https://waitbutwhy.com/feed", isActive: true, healthStatus: "active", signalScore: 89 },
];
