import _ from 'lodash';
import { Trie } from '@tanishiking/aho-corasick';

import type { Indexer } from '../indexing/indexer';
import { redactText } from './redactText';
import { mapStemToOriginalText } from './mapStemToOriginalText';
import { WordPunctStemTokenizer } from '../tokenizers';

const tokenizer = new WordPunctStemTokenizer();

export type SearchResult = {
  start: number;
  end: number;
  indexKeyword: string;
  originalKeyword: string;
};

const isEqual = (a: SearchResult, b: SearchResult) => {
  return a.start === b.start && a.indexKeyword === b.indexKeyword;
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
    const redactedText = redactText(text); // Redact text that we don't want to be searched

    // Stem the text
    const tokens = tokenizer.tokenize(redactedText);
    const stemmedText = tokens.map((t) => t.stem).join('');

    // Search stemmed text
    const emits = this.trie.parseText(stemmedText);

    // Map stemmed results to original text
    return _.chain(emits)
      .map((emit) => mapStemToOriginalText(emit, tokens))
      .uniqWith(isEqual)
      .filter((result) => this.keywordExistsInIndex(result.indexKeyword))
      .sort((a, b) => a.start - b.start) // Must sort by start position to prepare for highlighting
      .value();
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
}
