import { TFile } from 'obsidian';

export interface SearchIndex {
  index: string;
  displayText: string;
  isDefinedInFile: (file: TFile) => boolean;
}

export class TagIndex implements SearchIndex {
  public readonly index: string;
  public readonly displayText: string;

  constructor(tag: string) {
    this.index = tag.toLowerCase().replace(/#/, '');
    this.displayText = tag;
  }

  public isDefinedInFile(_file: TFile): boolean {
    return false;
  }
}

export class AliasIndex implements SearchIndex {
  public readonly index: string;
  public readonly displayText: string;

  constructor(private file: TFile, word: string) {
    this.index = word.toLowerCase();
    this.displayText = `[[${file.basename}|${word}]]`;
  }

  public isDefinedInFile(file: TFile): boolean {
    return file === this.file;
  }
}

export class PageIndex implements SearchIndex {
  public readonly index: string;
  public readonly displayText: string;

  constructor(private file: TFile) {
    this.index = file.basename.toLowerCase();
    this.displayText = `[[${file.basename}]]`;
  }

  public isDefinedInFile(file: TFile): boolean {
    return file === this.file;
  }
}
