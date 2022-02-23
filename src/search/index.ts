import _ from 'lodash';
import { Trie, Emit } from '@tanishiking/aho-corasick';

import type { Indexer } from '../indexing/indexer';

type SearchResult = {
  start: number;
  end: number;
  keyword: string;
};

const isEqual = (a: Emit, b: Emit) => {
  return a.start === b.start && a.keyword === b.keyword;
};

export default class Search {
  private trie: Trie;

  constructor(private indexer: Indexer) {
    const keywords = this.indexer.getKeywords();

    // Generating the Trie is expensive, so we only do it once
    this.trie = new Trie(keywords, {
      allowOverlaps: false,
      onlyWholeWords: true,
      caseInsensitive: true,
    });
  }

  public getReplacementSuggestions(keyword: string): string[] {
    const keywords = this.indexer.getDocumentsByKeyword(keyword).map((doc) => doc.replaceText);
    return _.uniq(keywords);
  }

  public find(text: string): SearchResult[] {
    const redactedText = this.redactText(text); // Redact text that we don't want to be searched

    const results = this.trie.parseText(redactedText);

    return this.mapToSearchResults(results);
  }

  private mapToSearchResults(results: Emit[]): SearchResult[] {
    return _.uniqWith(results, isEqual)
      .filter((result) => this.keywordExistsInIndex(result.keyword))
      .map((result) => ({
        start: result.start,
        end: result.end + 1,
        keyword: result.keyword,
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
