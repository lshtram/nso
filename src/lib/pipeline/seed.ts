import { SourceEntity } from '@/types';

export const AI_SEED_SOURCES: SourceEntity[] = [
  {
    id: 'openai-blog',
    name: 'OpenAI Blog',
    type: 'rss',
    url: 'https://openai.com/news/rss.xml',
    isActive: true,
    healthStatus: 'active',
    steering: { discoveryDensity: 'high' }
  },
  {
    id: 'google-ai-blog',
    name: 'Google AI Blog',
    type: 'rss',
    url: 'https://blog.google/innovation-and-ai/technology/ai/rss/',
    isActive: true,
    healthStatus: 'active'
  },
  {
    id: 'deepmind-blog',
    name: 'DeepMind Blog',
    type: 'rss',
    url: 'https://deepmind.google/blog/rss.xml',
    isActive: true,
    healthStatus: 'active'
  },
  {
    id: 'microsoft-ai',
    name: 'Microsoft AI Blog',
    type: 'rss',
    url: 'https://blogs.microsoft.com/ai/feed',
    isActive: true,
    healthStatus: 'active'
  },
  {
    id: 'towards-data-science',
    name: 'Towards Data Science',
    type: 'rss',
    url: 'https://towardsdatascience.com/feed',
    isActive: true,
    healthStatus: 'active'
  },
  {
    id: 'mit-ai',
    name: 'MIT AI News',
    type: 'rss',
    url: 'https://news.mit.edu/rss/topic/artificial-intelligence',
    isActive: true,
    healthStatus: 'active'
  },
  {
    id: 'bair-blog',
    name: 'Berkeley AI Research',
    type: 'rss',
    url: 'https://bair.berkeley.edu/blog/feed.xml',
    isActive: true,
    healthStatus: 'active'
  },
  {
    id: 'autogen-gh',
    name: 'Microsoft AutoGen',
    type: 'github',
    url: 'https://github.com/microsoft/autogen',
    isActive: true,
    healthStatus: 'active'
  },
  {
    id: 'langchain-gh',
    name: 'LangChain',
    type: 'github',
    url: 'https://github.com/langchain-ai/langchain',
    isActive: true,
    healthStatus: 'active'
  }
];
