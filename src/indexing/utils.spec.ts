import { Emit } from '@tanishiking/aho-corasick';

import {
  bigramStemmedTokens,
  tokenizeWithStem,
  tokenizeText,
  stemTokens,
  mapStemmedEmitsToOriginal,
} from './utils';

describe.only('utils', () => {
  describe('tokenizeWithStem', () => {
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
        const tokens = tokenizeWithStem(sentence);
        expect(tokens).toEqual(expected);
      });
    });
  });

  describe('bigramStemmedTokens', () => {
    const dataSet = [
      {
        sentence: 'John',
        expected: ['john'],
      },
      {
        sentence: 'John    Doe',
        expected: ['john', 'doe'],
      },
      {
        sentence: 'GitHub Forking tutorial',
        expected: ['github fork', 'fork tutori'],
      },
      {
        sentence: 'The Five Dysfunctions of a Team',
        expected: ['five dysfunct', 'dysfunct team'],
      },
      {
        sentence: 'The Girl with the Dragon Tattoo',
        expected: ['five dysfunct', 'dysfunct team'],
      },
      {
        sentence: 'The 7 Habits of Highly Effective People',
        expected: ['five dysfunct', 'dysfunct team'],
      },
      {
        sentence: 'Code that changes together stays together',
        expected: ['five dysfunct', 'dysfunct team'],
      },
      {
        sentence: "You rise to your level of your leadership's incompetence",
        expected: ['five dysfunct', 'dysfunct team'],
      },
      {
        sentence: 'Shortening the feedback cycle',
        expected: ['five dysfunct', 'dysfunct team'],
      },
    ];

    dataSet.forEach(({ sentence, expected }) => {
      it(`Generates stemmed bigram tokens ("${sentence}", [${expected}]`, () => {
        const bigramTokens = bigramStemmedTokens(sentence);
        expect(bigramTokens).toEqual(expected);
      });
    });
  });

  describe('tokenizeText', () => {
    it('Tokenize a sentence into an array of tokens', () => {
      const paragraph = 'The "quick fox" jumps; ~over “the” _lazy dog.';

      const tokens = tokenizeText(paragraph);

      expect(tokens.map((t) => t.token).join('')).toEqual(paragraph);
      expect(tokens.length).toEqual(16);
    });

    it('Tokenize a sentence with a line break', () => {
      const paragraph = `This is a test note.

spanning

multiple lines`;

      const tokens = tokenizeText(paragraph);

      expect(tokens.map((t) => t.token).join('')).toEqual(paragraph);
      expect(tokens.length).toEqual(15);
    });

    it('Tokenize a sentence with an apostrophe', () => {
      const paragraph = `1. “Shared client record”`;

      const tokens = tokenizeText(paragraph);

      expect(tokens.map((t) => t.token).join('')).toEqual(paragraph);
      expect(tokens.length).toEqual(8);
    });

    it('Stems a sentence', () => {
      const paragraph =
        'The quick brown fox jumps over the changing, patiently; waiting doggy.';
      const expected = 'the quick brown fox jump over the chang, patient; wait doggi.';

      const tokens = tokenizeText(paragraph);
      const stems = stemTokens(tokens);

      expect(stems.map((t) => t.stem).join('')).toEqual(expected);
    });

    it('Map emitted stems to root tokens', () => {
      const paragraph = 'The connecting and the consulting spirit'; // Maps to 'the connect and the consult spirit'
      const searchEmits: Emit[] = [new Emit(4, 11, 'connect'), new Emit(20, 27, 'consult')];

      const expectedMappedEmits: Emit[] = [
        new Emit(4, 14, 'connecting'),
        new Emit(23, 33, 'consulting'),
      ];

      const stems = stemTokens(tokenizeText(paragraph));
      const mappedEmits = mapStemmedEmitsToOriginal(stems, searchEmits);

      expect(mappedEmits).toEqual(expectedMappedEmits);
    });
  });
});
