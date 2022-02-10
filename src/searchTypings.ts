import { TFile } from 'obsidian';

export interface SearchIndex {
  text: string;
  replaceText: string;
  isDefinedInFile: (file: TFile) => boolean;
}

export class TagIndex implements SearchIndex {
  constructor(private tag: string) {}

  public get text(): string {
    return this.tag.toLowerCase();
  }

  public get replaceText(): string {
    return `#${this.tag}`;
  }

  public isDefinedInFile(_file: TFile): boolean {
    return false;
  }
}

export class AliasIndex implements SearchIndex {
  constructor(private word: string, private file: TFile) {}

  public get text(): string {
    return this.word.toLowerCase();
  }

  public get replaceText(): string {
    return `[[${this.file.basename}|${this.word}]]`;
  }

  public isDefinedInFile(file: TFile): boolean {
    return file === this.file;
  }
}

export class PageIndex implements SearchIndex {
  constructor(private file: TFile) {}

  public get text(): string {
    return this.file.basename.toLowerCase();
  }

  public get replaceText(): string {
    return `[[${this.file.basename}]]`;
  }

  public isDefinedInFile(file: TFile): boolean {
    return file === this.file;
  }
}
