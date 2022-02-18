import { TFile } from 'obsidian';

import { PageIndex, SearchIndex, TagIndex, AliasIndex } from './indexModels';
import { AppHelper } from '../app-helper';

export type Index = {
  [index: string]: SearchIndex;
};

export class Indexer {
  constructor(private appHelper: AppHelper) {}

  public getIndices(): Index {
    const exclusionFile = this.appHelper.activeFile;
    const allFiles = this.appHelper.getAllFiles().filter((file) => file !== exclusionFile);

    return this.indexAllTags(allFiles)
      .concat(allFiles.map((file) => this.indexFile(file)).flat())
      .reduce((acc: Index, index) => {
        return { ...acc, [index.originalText.toLowerCase()]: index };
      }, {});
  }

  private indexFile(file: TFile): SearchIndex[] {
    const pageIndex = new PageIndex(file);

    const aliasIndices = this.appHelper
      .getAliases(file)
      .map((alias) => new AliasIndex(file, alias));

    return [pageIndex, ...aliasIndices];
  }

  private indexAllTags(files: TFile[]): TagIndex[] {
    return files.reduce((acc, file) => {
      const tags = this.appHelper.getTags(file).map((tag) => new TagIndex(tag));
      return [...acc, ...tags];
    }, []);
  }
}
