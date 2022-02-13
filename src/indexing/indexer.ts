import _ from 'lodash';
import { App, TFile } from 'obsidian';

import { PageIndex, SearchIndex, TagIndex, AliasIndex } from './indexModels';
import { AppHelper } from '../app-helper';

export class Indexer {
  private searchIndex: SearchIndex[] = [];
  private callbacks: (() => void)[] = [];

  constructor(private app: App, private appHelper: AppHelper) {
    this.app.workspace.onLayoutReady(() => this.indexAll());
    this.app.vault.on('modify', () => this.indexAll());
  }

  public get index(): readonly SearchIndex[] {
    const activeFile = this.appHelper.activeFile;
    return this.searchIndex.filter((index) => !index.isDefinedInFile(activeFile));
  }

  public on(_event: 'updated-index', callback: () => void): void {
    this.callbacks.push(callback);
  }

  private indexAll(): void {
    const allFiles = this.app.vault.getMarkdownFiles();

    const fileIndices = allFiles.map((file) => this.indexFile(file)).flat();

    this.searchIndex = [...fileIndices, ...this.indexAllTags(allFiles)];

    // Notify all listeners that the index has been updated
    this.callbacks.forEach((cb) => cb());
  }

  private indexFile(file: TFile): SearchIndex[] {
    const pageIndex = new PageIndex(file);

    const aliasIndices = this.appHelper
      .getAliases(file)
      .map((alias) => new AliasIndex(file, alias));

    return [pageIndex, ...aliasIndices];
  }

  private indexAllTags(files: TFile[]): TagIndex[] {
    const tagIndices: TagIndex[] = files.reduce((acc, file) => {
      const tags = this.appHelper.getTags(file).map((tag) => new TagIndex(tag));
      return [...acc, ...tags];
    }, []);

    return _.uniqBy(tagIndices, (x) => x.index);
  }
}
