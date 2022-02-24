import LIB_TOKENIZE from '@liquicode/lib-tokenize';
import { Emit } from '@tanishiking/aho-corasick';
import { PorterStemmer, NGrams, WordPunctTokenizer } from 'natural';

const tokenizer = LIB_TOKENIZE.NewTokenizer();
tokenizer.whitespace = ` \t\r\n.“”`;
tokenizer.symbols = `,;=`;
tokenizer.literal_delimiters = `"`;
tokenizer.literal_escape_chars = `\\`;

const tokenizer2 = new WordPunctTokenizer();

/**
 * Tokenizes a string into words along with:
 * (a) Removing stop words
 * (b) Removing punctuation
 * (c) Stemming words
 */
export const tokenizeWithStem = (text: string): string[] => {
  return PorterStemmer.tokenizeAndStem(text);
};

export const bigramStemmedTokens = (text: string): string[] => {
  const tokens = tokenizeWithStem(text);

  if (tokens.length > 2) {
    const bigrams = NGrams.bigrams(tokens);
    return bigrams.map((bigram) => bigram.join(' '));
  }

  return tokens;
};

type Token = {
  at: number;
  token: string;
  type: 'wsp' | 'sym' | 'lit' | 'idf' | 'num' | 'kwd';
};

type StemmedToken = {
  stem: string;
  stemStart: number;
  stemEnd: number;
  original: string;
  originalStart: number;
  originalEnd: number;
};

export const tokenizeText = (text: string): Token[] => {
  console.log(tokenizer2.tokenize(text))
  console.log(tokenizer.tokenize(text))

  return tokenizer.tokenize(text);
};

export const stemTokens = (tokens: Token[]): StemmedToken[] => {
  let index = 0;

  return tokens.reduce((acc, t) => {
    const stem = PorterStemmer.stem(t.token);

    acc.push({
      stem,
      stemStart: index,
      stemEnd: index + stem.length,
      original: t.token,
      originalStart: t.at,
      originalEnd: t.at + t.token.length,
    });

    index += stem.length;

    return acc;
  }, []);
};

export const mapStemmedEmitsToOriginal = (stems: StemmedToken[], emits: Emit[]): Emit[] => {
  console.log('stemmed tokens', stems);

  return emits.map((e) => {
    console.log('looking for in tokens', e);
    const matchingStem = stems.find((s) => s.stemStart === e.start);
    return new Emit(matchingStem.originalStart, matchingStem.originalEnd, e.keyword);
  });
};
