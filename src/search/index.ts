import { findAll } from 'highlight-words-core';
import { Indexer } from '../indexing/indexer';

type SearchResult = {
  start: number;
  end: number;
  matchingWord: string;
};

export default class Search {
  constructor(private indexer: Indexer) {}

  public getSuggestionReplacement(text: string): string {
    return this.indexer.index.find((index) => index.index === text.toLowerCase()).displayText;
  }

  public find(text: string): SearchResult[] {
    const searchWords = this.indexer.index.map((index) => {
      try {
        return index.index;
      } catch (err) {
        console.error('Cannot return text value of index', index, err);
      }
    });

    // Redact text that we don't want to be searched
    const redactedText = this.redactText(text);

    return findAll({ searchWords, textToHighlight: redactedText })
      .filter((chunk) => chunk.highlight)
      .map((chunk) => ({
        ...chunk,
        matchingWord: redactedText.substring(chunk.start, chunk.end),
      }));
  }

  private redactText(text: string): string {
    return text
      .replace(/```[\s\S]+?```/g, (m) => ' '.repeat(m.length)) // remove code blocks
      .replace(/^\n+---[\s\S]+?---/g, (m) => ' '.repeat(m.length)) // remove yaml front matter
      .replace(/#+([a-zA-Z0-9_]+)/g, (m) => ' '.repeat(m.length)) // remove hashtags
      .replace(/\[(.*?)\]+/g, (m) => ' '.repeat(m.length)); // remove links
  }
}
