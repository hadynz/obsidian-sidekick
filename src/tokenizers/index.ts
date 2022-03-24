import _ from 'lodash';
import { PorterStemmer, NGrams } from 'natural';
import { Trie } from '@tanishiking/aho-corasick';
import * as natural from 'natural';

import { stemLastWord } from '../stemmers';

export type Token = {
  index: number;
  originalText: string;
  originalStart: number;
  originalEnd: number;
  stem: string;
  stemStart: number;
  stemEnd: number;
};

export class WordPermutationsTokenizer {
  private trie: Trie;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stopWords: string[] = (natural as any).stopwords;

    this.trie = new Trie(stopWords, {
      allowOverlaps: false,
      onlyWholeWords: true,
      caseInsensitive: true,
    });
  }

  public tokenize(text: string): string[] {
    const tokens = PorterStemmer.tokenizeAndStem(text); // Strip punctuation and stop words, stem remaining words

    if (tokens.length >= 5) {
      return [...tokens, ...NGrams.bigrams(tokens).map((tokens) => tokens.join(' '))];
    }

    return this.combinations(tokens, 2, 2);
  }

  private combinations(arr: string[], min: number, max: number) {
    return [...Array(max).keys()]
      .reduce((result) => {
        return arr.concat(
          result.flatMap((val) =>
            arr.filter((char) => char !== val).map((char) => `${val} ${char}`)
          )
        );
      }, [])
      .filter((val) => val.length >= min);
  }
}

export class WordPunctStemTokenizer {
  private pattern = /([\s]+|[A-zÀ-ÿ-]+|[0-9._]+|.|!|\?|'|"|:|;|,|-)/i;

  public tokenize(text: string): Token[] {
    const tokens = text.split(this.pattern);
    return _.chain(tokens).without('').transform(this.stringToTokenAccumulator()).value();
  }

  private stringToTokenAccumulator() {
    let originalCharIndex = 0;
    let stemCharIndex = 0;

    return (acc: Token[], token: string, index: number) => {
      const stemmedToken = stemLastWord(token);

      acc.push({
        index,
        originalText: token,
        originalStart: originalCharIndex,
        originalEnd: originalCharIndex + token.length,
        stem: stemmedToken,
        stemStart: stemCharIndex,
        stemEnd: stemCharIndex + stemmedToken.length,
      });

      originalCharIndex += token.length;
      stemCharIndex += stemmedToken.length;

      return acc;
    };
  }
}
