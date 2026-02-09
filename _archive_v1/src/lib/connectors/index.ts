import { SourceType } from '@/types';
import { BaseConnector } from './base';
import { RssConnector } from './rss';
import { GitHubConnector } from './github';

const connectors: Partial<Record<SourceType, BaseConnector>> = {
  rss: new RssConnector(),
  github: new GitHubConnector()
};

export function getConnector(type: SourceType): BaseConnector {
  const connector = connectors[type];
  if (!connector) {
    throw new Error(`No connector implemented for type: ${type}`);
  }
  return connector;
}
