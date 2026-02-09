import type { CollectorOptions } from './types';

export class FeedFetcher {
  private timeout: number;

  constructor(options?: CollectorOptions) {
    this.timeout = options?.timeout ?? 3000;
  }

  async fetch(url: string, options?: CollectorOptions): Promise<string> {
    const timeout = options?.timeout ?? this.timeout;
    const controller = new AbortController();
    const { signal } = controller;

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();
      return text;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async fetchAll(urls: string[], options?: CollectorOptions): Promise<PromiseSettledResult<string>[]> {
    const promises = urls.map(url => this.fetch(url, options));
    return Promise.allSettled(promises);
  }
}
