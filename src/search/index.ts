import { Trie, Emit } from '@tanishiking/aho-corasick';

import { Indexer, Index } from '../indexing/indexer';

type SearchResult = {
  start: number;
  end: number;
  replaceText: string;
};

export default class Search {
  constructor(private indexer: Indexer) {}

  public find(text: string): SearchResult[] {
    const indices = this.indexer.getIndices();

    const trie = new Trie(Object.keys(indices), {
      allowOverlaps: false,
      onlyWholeWords: true,
      caseInsensitive: true,
    });

    // Redact text that we don't want to be searched
    const redactedText = this.redactText(text);

    const results = trie.parseText(redactedText);

    return this.toSearchResults(results, indices);
  }

  private toSearchResults(results: Emit[], indices: Index): SearchResult[] {
    return results
      .filter((result) => this.existsInIndex(result.keyword, indices))
      .map((result) => ({
        start: result.start,
        end: result.end + 1,
        replaceText: indices[result.keyword].replaceText,
      }))
      .sort((a, b) => a.start - b.start); // Must sort by start position to prepare for highlighting
  }

  private existsInIndex(index: string, indices: Index): boolean {
    const exists = indices[index] != null;

    if (!exists) {
      console.warn(
        `Search hit "${index}" was not found in Obsidian index. This could be a bug. Report on https://github.com/hadynz/obsidian-sidekick/issues`,
        indices
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
