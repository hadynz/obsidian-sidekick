import { tokenize } from './utils';

describe('tokenize', () => {
  const dataSet = [
    {
      sentence: 'The quick brown fox jumps over the lazy dog.',
      expected: ['quick', 'brown', 'fox', 'jump', 'lazi', 'dog'],
    },
    {
      sentence: 'GitHub Forks',
      expected: ['github', 'fork'],
    },
    {
      sentence: 'John    Doe',
      expected: ['john', 'doe'],
    },
    {
      sentence: 'Approximate Inference',
      expected: ['approxim', 'infer'],
    },
  ];

  dataSet.forEach(({ sentence, expected }) => {
    it(`Tokenizes and removes stop words ("${sentence}", [${expected}]`, () => {
      const tokens = tokenize(sentence);
      expect(tokens).toEqual(expected);
    });
  });
});
