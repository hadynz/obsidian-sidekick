import { PorterStemmer } from 'natural';

import { WordPunctStemTokenizer } from '../tokenizers';

/**
 * Stem a given phrase. If the phrase is made up of multiple words,
 * the last word in the phrase is the only one that will be stemmed
 * @param text input text
 * @returns stemmed text
 */
export const stemLastWord = (text: string): string => {
  return PorterStemmer.stem(text);
};

export const stemPhrase = (text: string): string => {
  const tokenizer = new WordPunctStemTokenizer();
  return tokenizer
    .tokenize(text)
    .map((t) => t.stem)
    .join('');
};
