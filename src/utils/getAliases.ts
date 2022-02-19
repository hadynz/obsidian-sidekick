import type { CachedMetadata } from 'obsidian';

export const getAliases = (metadata: CachedMetadata): string[] => {
  const frontmatterAliases = metadata?.frontmatter?.['aliases'];

  if (typeof frontmatterAliases === 'string') {
    return frontmatterAliases.split(',').map((alias: string) => alias.trim());
  } else if (Array.isArray(frontmatterAliases)) {
    return frontmatterAliases
      .map((alias) => alias?.toString().trim())
      .filter((alias: string) => alias);
  }

  return [];
};
