import type { CachedMetadata, FrontMatterCache } from 'obsidian';

import { getAliases } from './getAliases';

describe('getAliases', () => {
  it('Returns an empty array if no frontmatter is defined', () => {
    const metadata: CachedMetadata = {};
    const aliases = getAliases(metadata);
    expect(aliases).toEqual([]);
  });

  it('Returns an empty array if no aliases are defined', () => {
    const metadata: CachedMetadata = {
      frontmatter: {} as FrontMatterCache,
    };

    const aliases = getAliases(metadata);
    expect(aliases).toEqual([]);
  });

  it('Parses aliases defined as a string split by comma', () => {
    const metadata: CachedMetadata = {
      frontmatter: {
        aliases: 'foo, bar ',
      } as unknown as FrontMatterCache,
    };

    const aliases = getAliases(metadata);
    expect(aliases).toEqual(['foo', 'bar']);
  });

  it('Parses aliases defined as an array of values', () => {
    const metadata: CachedMetadata = {
      frontmatter: {
        aliases: ['foo', 'bar'],
      } as unknown as FrontMatterCache,
    };

    const aliases = getAliases(metadata);
    expect(aliases).toEqual(['foo', 'bar']);
  });

  it('Array of aliases is trimmed and processed as strings', () => {
    const metadata: CachedMetadata = {
      frontmatter: {
        aliases: ['foo', 'bar', null, undefined, '', '  ', 200],
      } as unknown as FrontMatterCache,
    };

    const aliases = getAliases(metadata);
    expect(aliases).toEqual(['foo', 'bar', '200']);
  });
});
