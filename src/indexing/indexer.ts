import _ from 'lodash';
import lokijs from 'lokijs';
import { TypedEmitter } from 'tiny-typed-emitter';
import type { TFile } from 'obsidian';

import { stemPhrase } from '../stemmers';
import { WordPermutationsTokenizer } from '../tokenizers';
import type { PluginHelper } from '../plugin-helper';
import {SidekickSettings} from "~/settings/sidekickSettings";

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
  private db: lokijs;
  private documents: Collection<Document>;
  private permutationTokenizer: WordPermutationsTokenizer;
  private settings: SidekickSettings;
  private keywordsFilter: Set<string>;


  constructor(private pluginHelper: PluginHelper) {
    super();

    this.db = new lokijs('sidekick');

    this.createCollection();

    this.permutationTokenizer = new WordPermutationsTokenizer();
    this.settings = pluginHelper.getSettings();

  }

  private createCollection() {
    this.documents = this.db.addCollection<Document>('documents', {
      indices: ['fileCreationTime', 'keyword'],
    });
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

  public buildIndex(rebuild=false): void {
    this.keywordsFilter = new Set(this.settings.keywordsFilter
      .replace(/\s/g,'')
      .split(",")
      .map(s => s.trim()));
    if (rebuild) {
      this.db.removeCollection("documents");
      this.createCollection();
      this.documents.removeWhere(() => true);
    }
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
    // TODO Emile: not sure if should toLowerCase() here.
    const baseNameKeyword = this.settings.enableStemming ? stemPhrase(file.basename) : file.basename.toLowerCase();
    // Emile: Keywords filter is applied at every insertion, which is a bit of a code smell.
    //  however, it cannot quickly be done in a post-processing step because that'd need a full iteration
    //  on every call of replaceFileIndices()
    if (!this.keywordsFilter.has(baseNameKeyword)) {
      this.documents.insert({
        fileCreationTime: file.stat.ctime,
        type: 'page',
        keyword: baseNameKeyword,
        originalText: file.basename,
        replaceText: `[[${file.basename}]]`,
      });
    }

    if (this.settings.enableStemming) {
      this.permutationTokenizer.tokenize(file.basename).forEach((keyword) => {
        if (!this.keywordsFilter.has(keyword)) {
          this.documents.insert({
            fileCreationTime: file.stat.ctime,
            type: 'page-token',
            keyword,
            originalText: file.basename,
            replaceText: `[[${file.basename}]]`,
          });
        }
      });
    }

    this.pluginHelper.getAliases(file).forEach((alias) => {
      const keyword = alias.toLowerCase();
      if (!this.keywordsFilter.has(keyword)) {
        this.documents.insert({
          fileCreationTime: file.stat.ctime,
          type: 'alias',
          keyword,
          originalText: file.basename,
          replaceText: `[[${file.basename}|${alias}]]`,
        });
      }
    });

    if (this.settings.matchTags) {
      // TODO: This can probably be done more efficiently by iterating getAllTags.
      this.pluginHelper.getTags(file).forEach((tag) => {
        const keyword = tag.replace(/#/, '').toLowerCase();
        if (!this.keywordsFilter.has(keyword)) {
          this.documents.insert({
            fileCreationTime: file.stat.ctime,
            type: 'tag',
            keyword,
            originalText: tag,
            replaceText: tag,
          });
        }
      });
    }
  }
}
