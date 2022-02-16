import { TFile } from 'obsidian';

import { stemmer } from '../utils/stemmer';

export interface SearchIndex {
  replaceText: string;
  originalText: string;
  stem: string;
}

export class TagIndex implements SearchIndex {
  public readonly originalText: string;
  public readonly replaceText: string;
  public readonly stem: string;

  constructor(tag: string) {
    this.originalText = tag.replace(/#/, '');
    this.replaceText = tag;
    this.stem = stemmer(this.originalText);
  }
}

export class AliasIndex implements SearchIndex {
  public readonly originalText: string;
  public readonly replaceText: string;
  public readonly stem: string;

  constructor(file: TFile, word: string) {
    this.originalText = word;
    this.replaceText = `[[${file.basename}|${word}]]`;
    this.stem = stemmer(this.originalText);
  }
}

export class PageIndex implements SearchIndex {
  public readonly originalText: string;
  public readonly replaceText: string;
  public readonly stem: string;

  constructor(file: TFile) {
    this.originalText = file.basename;
    this.replaceText = `[[${file.basename}]]`;
    this.stem = stemmer(this.originalText);
  }
}
