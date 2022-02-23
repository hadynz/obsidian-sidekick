import natural from 'natural';

export const tokenize = (text: string): string[] => {
  return natural.PorterStemmer.tokenizeAndStem(text);
};
