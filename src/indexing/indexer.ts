import _ from 'lodash';
import lokijs from 'lokijs';
import { TypedEmitter } from 'tiny-typed-emitter';
import type { TFile } from 'obsidian';

import { stemPhrase } from '../stemmers';
import { WordPermutationsTokenizer } from '../tokenizers';
import type { PluginHelper } from '../plugin-helper';

type Document = {
  fileCreationTime: number;
  type: 'tag' | 'alias' | 'page' | 'page-token';
  keyword: string;
  originalText: string;
  replaceText: string;
};

interface IndexerEvents {
  indexRebuilt: () => void;
  indexUpdated: () => void;
}

export class Indexer extends TypedEmitter<IndexerEvents> {
  private documents: Collection<Document>;
  private permutationTokenizer: WordPermutationsTokenizer;
  private shouldStem: boolean;

  constructor(private pluginHelper: PluginHelper) {
    super();

    const db = new lokijs('sidekick');

    this.documents = db.addCollection<Document>('documents', {
      indices: ['fileCreationTime', 'keyword'],
    });

    this.permutationTokenizer = new WordPermutationsTokenizer();
    this.shouldStem = pluginHelper.getSettings().enableStemming;
  }

  public getKeywords(): string[] {
    const keywords = this.documents
      .find({
        fileCreationTime: { $ne: this.pluginHelper.activeFile.stat.ctime }, // Always exclude indices related to active file
      })
      .map((doc) => doc.keyword);

    return _.uniq(keywords);
  }

  public getDocumentsByKeyword(keyword: string): Document[] {
    return this.documents.find({
      keyword,
      fileCreationTime: { $ne: this.pluginHelper.activeFile.stat.ctime }, // Always exclude indices related to active file
    });
  }

  public buildIndex(): void {
    this.pluginHelper.getAllFiles().forEach((file) => this.indexFile(file));
    this.emit('indexRebuilt');
  }

  public replaceFileIndices(file: TFile): void {
    // Remove all indices related to modified file
    this.documents.findAndRemove({ fileCreationTime: file.stat.ctime });

    // Re-index modified file
    this.indexFile(file);

    this.emit('indexUpdated');
  }

  private indexFile(file: TFile): void {
    this.documents.insert({
      fileCreationTime: file.stat.ctime,
      type: 'page',
      // TODO Emile: not sure if should toLowerCase() here.
      keyword: this.shouldStem ? stemPhrase(file.basename) : file.basename.toLowerCase(),
      originalText: file.basename,
      replaceText: `[[${file.basename}]]`,
    });

    if (this.shouldStem) {
      this.permutationTokenizer.tokenize(file.basename).forEach((token) => {
        this.documents.insert({
          fileCreationTime: file.stat.ctime,
          type: 'page-token',
          keyword: token,
          originalText: file.basename,
          replaceText: `[[${file.basename}]]`,
        });
      });
    }

    this.pluginHelper.getAliases(file).forEach((alias) => {
      this.documents.insert({
        fileCreationTime: file.stat.ctime,
        type: 'alias',
        keyword: alias.toLowerCase(),
        originalText: file.basename,
        replaceText: `[[${file.basename}|${alias}]]`,
      });
    });

    // TODO: This can probably be done more efficiently by iterating getAllTags.
    this.pluginHelper.getTags(file).forEach((tag) => {
      this.documents.insert({
        fileCreationTime: file.stat.ctime,
        type: 'tag',
        keyword: tag.replace(/#/, '').toLowerCase(),
        originalText: tag,
        replaceText: tag,
      });
    });
  }
}
