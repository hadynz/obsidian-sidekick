import lunr from 'lunr';

import { Indexer, Index } from '../indexing/indexer';

type SearchResult = {
  start: number;
  end: number;
  replaceText: string;
};

// Any arbitrary key to use for the search index
const DocumentKey = 'text';

export default class Search {
  constructor(private indexer: Indexer) {}


  public find(text: string): SearchResult[] {
    // Redact text that we don't want to be searched
    const redactedText = this.redactText(text);

    const idx = lunr(function () {
      this.metadataWhitelist = ['position'];
      this.ref(DocumentKey);
      this.field(DocumentKey);
      this.add({ [DocumentKey]: redactedText });
    });

    const indices = this.indexer.getIndices();

    const results = idx.query(function () {
      Object.keys(indices).map((index) => {
        this.term(index, {});
      });
    });

    return this.toSearchResults(results, indices);
  }

  private toSearchResults(results: lunr.Index.Result[], indices: Index): SearchResult[] {
    if (results.length === 0) {
      return [];
    }

    // We will always ever only have one result as we only index one document
    const indexHits = results[0].matchData.metadata;

    return Object.keys(indexHits)
      .reduce((acc: SearchResult[], indexHit: string) => {
        const positions = indexHits[indexHit][DocumentKey].position;

        const searchResults = positions.map(
          (position): SearchResult => ({
            start: position[0],
            end: position[0] + position[1],
            replaceText: indices[indexHit].replaceText,
          })
        );

        acc.push(...searchResults);
        return acc;
      }, [])
      .sort((a, b) => a.start - b.start); // Must sort by start position to prepare for highlighting
  }

  private redactText(text: string): string {
    return text
      .replace(/```[\s\S]+?```/g, (m) => ' '.repeat(m.length)) // remove code blocks
      .replace(/^\n*?---[\s\S]+?---/g, (m) => ' '.repeat(m.length)) // remove yaml front matter
      .replace(/#+([a-zA-Z0-9_]+)/g, (m) => ' '.repeat(m.length)) // remove hashtags
      .replace(/\[(.*?)\]+/g, (m) => ' '.repeat(m.length)); // remove links
  }
}
