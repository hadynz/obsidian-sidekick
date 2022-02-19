import lokijs from 'lokijs';
import { TypedEmitter } from 'tiny-typed-emitter';
import type { TFile } from 'obsidian';

import type { PluginHelper } from '../plugin-helper';

type Document = {
  fileCreationTime: number;
  type: 'tag' | 'alias' | 'page';
  keyword: string;
  replaceText: string;
};

interface IndexerEvents {
  indexRebuilt: () => void;
  indexUpdated: () => void;
}

export class Indexer extends TypedEmitter<IndexerEvents> {
  private documents: Collection<Document>;

  constructor(private pluginHelper: PluginHelper) {
    super();

    const db = new lokijs('sidekick');

    this.documents = db.addCollection<Document>('documents', {
      indices: ['fileCreationTime', 'keyword'],
    });
  }

  public getKeywords(): string[] {
    // Exclude any keywords associated with active file as we don't want recursive highlighting
    const exclusionFile = this.pluginHelper.activeFile;

    return this.documents
      .where((doc) => doc.fileCreationTime !== exclusionFile.stat.ctime)
      .map((doc) => doc.keyword);
  }

  public getDocumentsByKeyword(keyword: string): Document[] {
    return this.documents.find({ keyword: keyword });
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
      keyword: file.basename.toLowerCase(),
      replaceText: `[[${file.basename}]]`,
    });

    this.pluginHelper.getAliases(file).forEach((alias) => {
      this.documents.insert({
        fileCreationTime: file.stat.ctime,
        type: 'alias',
        keyword: alias.toLowerCase(),
        replaceText: `[[${file.basename}|${alias}]]`,
      });
    });

    this.pluginHelper.getTags(file).forEach((tag) => {
      this.documents.insert({
        fileCreationTime: file.stat.ctime,
        type: 'tag',
        keyword: tag.replace(/#/, '').toLowerCase(),
        replaceText: tag,
      });
    });
  }
}
