import { TFile } from 'obsidian';

export interface SearchIndex {
  replaceText: string;
  originalText: string;
}

export class TagIndex implements SearchIndex {
  public readonly originalText: string;
  public readonly replaceText: string;

  constructor(tag: string) {
    this.originalText = tag.replace(/#/, '');
    this.replaceText = tag;
  }
}

export class AliasIndex implements SearchIndex {
  public readonly originalText: string;
  public readonly replaceText: string;

  constructor(file: TFile, word: string) {
    this.originalText = word;
    this.replaceText = `[[${file.basename}|${word}]]`;
  }
}

export class PageIndex implements SearchIndex {
  public readonly originalText: string;
  public readonly replaceText: string;

  constructor(file: TFile) {
    this.originalText = file.basename;
    this.replaceText = `[[${file.basename}]]`;
  }
}
