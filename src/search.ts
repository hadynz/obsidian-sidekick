import { App, getAllTags, TFile, CachedMetadata } from 'obsidian';
import { findAll } from 'highlight-words-core';

type SearchIndex = {
  [key: string]: {
    type: 'tag' | 'link';
    replaceText: string;
    isAlias?: boolean;
  };
};

type SearchResult = {
  start: number;
  end: number;
};

type ObsidianCache = {
  file: TFile;
  metadata: CachedMetadata;
};

export default class Search {
  private searchIndex: SearchIndex = {};
  private obsidianCache: ObsidianCache[] = [];
  private callbacks: (() => void)[] = [];

  constructor(private app: App) {
    this.app.workspace.onLayoutReady(() => this.indexAll());
    this.app.vault.on('modify', () => this.indexAll);
  }

  public on(_event: 'updated-index', callback: () => void): void {
    this.callbacks.push(callback);
  }

  public getSuggestionReplacement(text: string): string {
    return this.searchIndex[text.toLowerCase()].replaceText;
  }

  public find(text: string): SearchResult[] {
    const searchWords = Object.keys(this.searchIndex);

    // Strip out hashtags and links as we don't need to bother searching them
    const textToHighlight = text
      .replace(/#+([a-zA-Z0-9_]+)/g, (m) => ' '.repeat(m.length)) // remove hashtags
      .replace(/\[(.*?)\]+/g, (m) => ' '.repeat(m.length)); // remove links

    return findAll({ searchWords, textToHighlight })
      .filter((chunk) => chunk.highlight)
      .map((chunk) => ({ ...chunk }));
  }

  private indexAll(): void {
    this.obsidianCache = this.app.vault.getMarkdownFiles().map((file) => ({
      file,
      metadata: this.app.metadataCache.getFileCache(file),
    }));

    this.indexLinks();
    this.indexTags();

    // Notify all listeners that the index has been updated
    this.callbacks.forEach((cb) => cb());
  }

  private indexLinks(): void {
    this.obsidianCache.forEach((fileCache) => {
      this.searchIndex[fileCache.file.basename.toLowerCase()] = {
        type: 'link',
        isAlias: false,
        replaceText: `[[${fileCache.file.basename}]]`,
      };

      fileCache.metadata.frontmatter?.aliases?.forEach((alias: string) => {
        this.searchIndex[alias.toLowerCase()] = {
          type: 'link',
          isAlias: true,
          replaceText: `[[${fileCache.file.basename}|${alias}]]`,
        };
      });
    });
  }

  private indexTags(): void {
    const tags = this.obsidianCache.reduce((acc: string[], fileCache) => {
      acc.push(...getAllTags(fileCache.metadata).map((t) => t.substring(1)));
      return acc;
    }, []);

    const uniqueTags = Array.from(new Set(tags));

    for (const tag of uniqueTags) {
      this.searchIndex[tag.toLowerCase()] = {
        type: 'tag',
        replaceText: `#${tag}`,
      };
    }
  }
}
