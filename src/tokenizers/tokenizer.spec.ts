import { WordPermutationsTokenizer, WordPunctStemTokenizer } from '.';

describe('WordPermutationsTokenizer', () => {
  const dataSet = [
    {
      description: 'Single word',
      sentence: 'John',
      expected: ['john'],
    },
    {
      description: 'Two words with no stop words',
      sentence: 'John    Doe',
      expected: ['john', 'doe', 'john doe', 'doe john'],
    },
    {
      description: 'Two words (with one stop word at the start)',
      sentence: 'The brothers Karamazov',
      expected: ['brother', 'karamazov', 'brother karamazov', 'karamazov brother'],
    },
    {
      description: 'Two words (with stop words throughout the sentence)',
      sentence: 'An Officer and a Spy',
      expected: ['offic', 'spy', 'offic spy', 'spy offic'],
    },
    {
      description: 'Three words with no stop words',
      sentence: 'GitHub Forking tutorial',
      expected: [
        'github',
        'fork',
        'tutori',
        'github fork',
        'github tutori',
        'fork github',
        'fork tutori',
        'tutori github',
        'tutori fork',
      ],
    },

    {
      description: 'Five words or more does not generate permutations',
      sentence: 'Ten Arguments For Deleting Your Social Media Accounts Right Now',
      expected: [
        'ten',
        'argument',
        'delet',
        'social',
        'media',
        'account',
        'right',
        'ten argument',
        'argument delet',
        'delet social',
        'social media',
        'media account',
        'account right',
      ],
    },
  ];

  dataSet.forEach(({ description, sentence, expected }) => {
    it(`Tokenize phase permutations (${description})`, () => {
      const tokenizer = new WordPermutationsTokenizer();
      const tokens = tokenizer.tokenize(sentence);

      expect(tokens).toEqual(expected);
    });
  });
});

describe('WordPunctStemTokenizer', () => {
  it('Tokenize and stem a simple phrase', () => {
    const sentence = 'The lazy dog       jumped over the fence.';

    const tokenizer = new WordPunctStemTokenizer();
    const tokens = tokenizer.tokenize(sentence);

    expect(tokens.length).toEqual(14);

    expect(tokens[2]).toEqual({
      index: 2,
      originalText: 'lazy',
      originalStart: 4,
      originalEnd: 8,
      stem: 'lazi',
      stemStart: 4,
      stemEnd: 8,
    });

    expect(tokens[6].stem).toEqual('jump');
  });
});
