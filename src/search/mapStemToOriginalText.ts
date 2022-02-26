import { Emit } from '@tanishiking/aho-corasick';

import { SearchResult } from '../search/index';
import { Token } from '../tokenizers';

/**
 * Takes a given search result (which has the start/end position and a "stemmed" keyword)
 * that was matched, and maps them to a new start/end position for the original keyword
 * which was stem was created from
 * @param searchResult
 * @param tokens
 * @returns
 */
export const mapStemToOriginalText = (searchResult: Emit, tokens: Token[]): SearchResult => {
  const matchingTokens = tokens.filter(
    (token) => token.stemStart >= searchResult.start && token.stemEnd <= searchResult.end + 1
  );

  return {
    start: matchingTokens[0].originalStart,
    end: matchingTokens[matchingTokens.length - 1].originalEnd,
    indexKeyword: matchingTokens
      .map((token) => token.stem)
      .join('')
      .toLowerCase(),
    originalKeyword: matchingTokens.map((token) => token.originalText).join(''),
  };
};
