import lunr from 'lunr';

export const stemmer = (str: string): string => {
  const token = lunr.stemmer(new lunr.Token(str, {}));
  return token.toString().toLowerCase();
};
