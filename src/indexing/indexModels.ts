import { TFile } from 'obsidian';

export interface SearchIndex {
  text: string;
  replaceText: string;
  isDefinedInFile: (file: TFile) => boolean;
}

export class TagIndex implements SearchIndex {
  public readonly text: string;
  public readonly replaceText: string;

  constructor(private tag: string) {
    this.text = tag.toLowerCase();
    this.replaceText = `#${this.tag}`;
  }

  public isDefinedInFile(_file: TFile): boolean {
    return false;
  }
}

export class AliasIndex implements SearchIndex {
  public readonly text: string;
  public readonly replaceText: string;

  constructor(word: string, private file: TFile) {
    this.text = word.toLowerCase();
    this.replaceText = `[[${file.basename}|${word}]]`;
  }

  public isDefinedInFile(file: TFile): boolean {
    return file === this.file;
  }
}

export class PageIndex implements SearchIndex {
  public readonly text: string;
  public readonly replaceText: string;

  constructor(private file: TFile) {
    this.text = file.basename.toLowerCase();
    this.replaceText = `[[${file.basename}]]`;
  }

  public isDefinedInFile(file: TFile): boolean {
    return file === this.file;
  }
}
