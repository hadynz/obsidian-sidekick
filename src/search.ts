import { App, getAllTags, TFile, CachedMetadata } from 'obsidian';
import { findAll } from 'highlight-words-core';

type WordIndex = {
  type: 'tag' | 'link';
  text: string;
  replaceText: string;
  isAlias?: boolean;
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
  private searchIndex: WordIndex[] = [];
  private obsidianCache: ObsidianCache[] = [];
  private callbacks: (() => void)[] = [];

  constructor(private app: App) {
    this.app.workspace.onLayoutReady(() => this.indexAll());
    this.app.vault.on('modify', () => this.indexAll());
  }

  public on(_event: 'updated-index', callback: () => void): void {
    this.callbacks.push(callback);
  }

  public getSuggestionReplacement(text: string): string {
    return this.searchIndex.find((word) => word.text === text).replaceText;
  }

  public find(unlinkedText: string): SearchResult[] {
    const activeFilename = this.getFileName(this.app.workspace.getActiveFile());

    const searchWords = this.searchIndex
      .filter((word) => activeFilename !== word.text)
      .map((word) => word.text);

    // Strip out hashtags and links as we don't need to bother searching them
    const textToHighlight = unlinkedText
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

    this.searchIndex = [];
    this.indexLinks();
    this.indexTags();

    // Notify all listeners that the index has been updated
    this.callbacks.forEach((cb) => cb());
  }

  private indexLinks(): void {
    this.obsidianCache.forEach((fileCache) => {
      this.searchIndex.push({
        type: 'link',
        text: this.getFileName(fileCache.file),
        replaceText: `[[${fileCache.file.basename}]]`,
        isAlias: false,
      });

      fileCache.metadata.frontmatter?.aliases?.forEach((alias: string) => {
        this.searchIndex.push({
          type: 'link',
          text: alias.toLowerCase(),
          replaceText: `[[${fileCache.file.basename}|${alias}]]`,
          isAlias: true,
        });
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
      this.searchIndex.push({
        type: 'tag',
        text: tag.toLowerCase(),
        replaceText: `#${tag}`,
      });
    }
  }

  private getFileName(file: TFile): string {
    return file.basename.toLowerCase();
  }
}
