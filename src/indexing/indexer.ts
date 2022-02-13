import { App, getAllTags, TFile, CachedMetadata } from 'obsidian';

import { PageIndex, SearchIndex, TagIndex, AliasIndex } from './indexModels';
import { getAliases } from '../utils/getAliases';

type ObsidianCache = {
  file: TFile;
  metadata: CachedMetadata;
};

export class Indexer {
  private searchIndex: SearchIndex[] = [];
  private callbacks: (() => void)[] = [];

  constructor(private app: App) {
    this.app.workspace.onLayoutReady(() => this.indexAll());
    this.app.vault.on('modify', () => this.indexAll());
  }

  public get index(): readonly SearchIndex[] {
    const activeFile = this.app.workspace.getActiveFile();
    return this.searchIndex.filter((index) => !index.isDefinedInFile(activeFile));
  }

  public on(_event: 'updated-index', callback: () => void): void {
    this.callbacks.push(callback);
  }

  private indexAll(): void {
    this.searchIndex = [];

    const cache = this.app.vault.getMarkdownFiles().map((file) => ({
      file,
      metadata: this.app.metadataCache.getFileCache(file),
    }));

    this.indexLinks(cache);
    this.indexTags(cache);

    // Notify all listeners that the index has been updated
    this.callbacks.forEach((cb) => cb());
  }

  private indexLinks(cache: ObsidianCache[]): void {
    cache.forEach((fileCache) => {
      this.searchIndex.push(new PageIndex(fileCache.file));

      getAliases(fileCache.metadata).forEach((alias: string) => {
        this.searchIndex.push(new AliasIndex(alias, fileCache.file));
      });
    });
  }

  private indexTags(cache: ObsidianCache[]): void {
    const tags = cache.reduce((acc: string[], fileCache) => {
      acc.push(...getAllTags(fileCache.metadata).map((t) => t.substring(1)));
      return acc;
    }, []);

    const uniqueTags = Array.from(new Set(tags));

    for (const tag of uniqueTags) {
      this.searchIndex.push(new TagIndex(tag));
    }
  }
}
