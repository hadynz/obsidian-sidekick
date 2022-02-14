import _ from 'lodash';
import { App, parseFrontMatterTags, TFile } from 'obsidian';

import { getAliases } from './utils/getAliases';

export class AppHelper {
  constructor(private app: App) {}

  public get activeFile(): TFile | undefined {
    return this.app.workspace.getActiveFile();
  }

  public getAliases(file: TFile): string[] {
    return getAliases(this.app.metadataCache.getFileCache(file));
  }

  public getTags(file: TFile): string[] {
    const tags = this.getFrontMatterTags(file).concat(
      this.app.metadataCache.getFileCache(file)?.tags?.map((x) => x.tag) ?? []
    );
    return _.uniq(tags);
  }

  public getAllFiles(): TFile[] {
    return this.app.vault.getMarkdownFiles();
  }

  private getFrontMatterTags(file: TFile): string[] {
    return parseFrontMatterTags(this.app.metadataCache.getFileCache(file)?.frontmatter) ?? [];
  }
}
