import _ from 'lodash';
import { parseFrontMatterTags, TFile} from 'obsidian';

import { getAliases } from './utils/getAliases';
import {SidekickSettings} from "~/settings/sidekickSettings";
import TagsAutosuggestPlugin from "~/index";

export class PluginHelper {
  constructor(private plugin: TagsAutosuggestPlugin) {}

  public get activeFile(): TFile | undefined {
    return this.plugin.app.workspace.getActiveFile();
  }

  public getAliases(file: TFile): string[] {
    return getAliases(this.plugin.app.metadataCache.getFileCache(file));
  }

  public getTags(file: TFile): string[] {
    const tags = this.getFrontMatterTags(file).concat(
      this.plugin.app.metadataCache.getFileCache(file)?.tags?.map((x) => x.tag) ?? []
    );
    return _.uniq(tags);
  }

  public getAllFiles(): TFile[] {
    return this.plugin.app.vault.getMarkdownFiles();
  }

  public onLayoutReady(callback: () => void): void {
    this.plugin.app.workspace.onLayoutReady(() => callback());
  }

  public onFileRename(callback: (file: TFile) => void): void {
    this.plugin.app.workspace.onLayoutReady(() => {
      this.plugin.registerEvent(
        this.plugin.app.vault.on('rename', (fileOrFolder) => {
          if (fileOrFolder instanceof TFile) {
            callback(fileOrFolder);
          }
        })
      );
    });
  }

  public onFileMetadataChanged(callback: (file: TFile) => void): void {
    this.plugin.app.workspace.onLayoutReady(() => {
      this.plugin.registerEvent(this.plugin.app.metadataCache.on('changed', callback));
    });
  }

  private getFrontMatterTags(file: TFile): string[] {
    return (
      parseFrontMatterTags(this.plugin.app.metadataCache.getFileCache(file)?.frontmatter) ?? []
    );
  }

  public getSettings(): SidekickSettings {
    return this.plugin.settings;
  }
}
