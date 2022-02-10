import { App, getAllTags, TFile, CachedMetadata } from 'obsidian';
import { findAll } from 'highlight-words-core';

import { PageIndex, SearchIndex, TagIndex, AliasIndex } from './searchTypings';

type SearchResult = {
  start: number;
  end: number;
};

type ObsidianCache = {
  file: TFile;
  metadata: CachedMetadata;
};

export default class Search {
  private searchIndex: SearchIndex[] = [];
  private callbacks: (() => void)[] = [];

  constructor(private app: App) {
    this.app.workspace.onLayoutReady(() => this.indexAll());
    this.app.vault.on('modify', () => this.indexAll());
  }

  public on(_event: 'updated-index', callback: () => void): void {
    this.callbacks.push(callback);
  }

  public getSuggestionReplacement(text: string): string {
    return this.searchIndex.find((index) => index.text === text).replaceText;
  }

  public find(unlinkedText: string): SearchResult[] {
    const activeFile = this.app.workspace.getActiveFile();

    const searchWords = this.searchIndex
      .filter((index) => !index.isDefinedInFile(activeFile))
      .map((index) => index.text);

    // Strip out hashtags and links as we don't need to bother searching them
    const textToHighlight = unlinkedText
      .replace(/#+([a-zA-Z0-9_]+)/g, (m) => ' '.repeat(m.length)) // remove hashtags
      .replace(/\[(.*?)\]+/g, (m) => ' '.repeat(m.length)); // remove links

    return findAll({ searchWords, textToHighlight })
      .filter((chunk) => chunk.highlight)
      .map((chunk) => ({ ...chunk }));
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

      fileCache.metadata.frontmatter?.aliases?.forEach((alias: string) => {
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
