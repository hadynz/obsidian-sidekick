import { Trie, Emit } from '@tanishiking/aho-corasick';

import type { Indexer } from '../indexing/indexer';

type SearchResult = {
  start: number;
  end: number;
  replaceText: string;
};

export default class Search {
  constructor(private indexer: Indexer) {}

  public find(text: string): SearchResult[] {
    const keywords = this.indexer.getKeywords();

    const trie = new Trie(keywords, {
      allowOverlaps: false,
      onlyWholeWords: true,
      caseInsensitive: true,
    });

    const redactedText = this.redactText(text); // Redact text that we don't want to be searched

    const results = trie.parseText(redactedText);

    return this.mapToSearchResults(results);
  }

  private mapToSearchResults(results: Emit[]): SearchResult[] {
    return results
      .filter((result) => this.keywordExistsInIndex(result.keyword))
      .map((result) => ({
        start: result.start,
        end: result.end + 1,
        replaceText: this.indexer.getDocumentsByKeyword(result.keyword)[0].replaceText,
      }))
      .sort((a, b) => a.start - b.start); // Must sort by start position to prepare for highlighting
  }

  private keywordExistsInIndex(index: string): boolean {
    const exists = this.indexer.getDocumentsByKeyword(index).length > 0;

    if (!exists) {
      console.warn(
        `Search hit "${index}" was not found in Obsidian index. This could be a bug. Report on https://github.com/hadynz/obsidian-sidekick/issues`,
        this.indexer
      );
    }

    return exists;
  }

  private redactText(text: string): string {
    return text
      .replace(/```[\s\S]+?```/g, (m) => ' '.repeat(m.length)) // remove code blocks
      .replace(/^\n*?---[\s\S]+?---/g, (m) => ' '.repeat(m.length)) // remove yaml front matter
      .replace(/#+([a-zA-Z0-9_]+)/g, (m) => ' '.repeat(m.length)) // remove hashtags
      .replace(/\[(.*?)\]+/g, (m) => ' '.repeat(m.length)); // remove links
  }
}
