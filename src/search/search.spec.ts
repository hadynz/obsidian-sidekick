import { Indexer } from '../indexing/indexer';
import Search from './index';

const getKeywordsMockFn = jest.fn();

jest.mock('../indexing/indexer', () => {
  return {
    Indexer: jest.fn().mockImplementation(() => {
      return {
        getKeywords: getKeywordsMockFn,
        getDocumentsByKeyword: () => [{}],
      };
    }),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Search class', () => {
  it('Highlights single keywords that can be stemmed', () => {
    getKeywordsMockFn.mockReturnValue(['search', 'note']);
    const text = 'This is a note that I will be use for searching';

    const indexer = new Indexer(null);
    const search = new Search(indexer);
    const results = search.find(text);

    expect(results).toEqual([
      {
        start: 10,
        end: 14,
        indexKeyword: 'note',
        originalKeyword: 'note',
      },
      {
        start: 38,
        end: 47,
        indexKeyword: 'search',
        originalKeyword: 'searching',
      },
    ]);
  });

  it('Longer keyword matches are always prioritised for highlight', () => {
    getKeywordsMockFn.mockReturnValue(['github', 'github fork']);
    const text = 'I use GitHub Forks as part of my development flow';

    const indexer = new Indexer(null);
    const search = new Search(indexer);
    const results = search.find(text);

    expect(results).toEqual([
      {
        start: 6,
        end: 18,
        indexKeyword: 'github fork',
        originalKeyword: 'GitHub Forks',
      },
    ]);
  });

  it('Three word keyword is highlighted', () => {
    getKeywordsMockFn.mockReturnValue(['shared', 'client', 'record', 'share client record']);
    const text = 'Designing a shared client record is a great idea but challenging';

    const indexer = new Indexer(null);
    const search = new Search(indexer);
    const results = search.find(text);

    expect(results).toEqual([
      {
        start: 12,
        end: 32,
        indexKeyword: 'share client record',
        originalKeyword: 'shared client record',
      },
    ]);
  });
});
