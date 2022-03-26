import { Plugin } from 'obsidian';
import type { Extension } from '@codemirror/state';

import Search from './search';
import { PluginHelper } from './plugin-helper';
import { Indexer } from './indexing/indexer';
import { suggestionsExtension } from './cmExtension/suggestionsExtension';
import {DEFAULT_SETTINGS, SidekickSettings} from "~/settings/sidekickSettings";
import SicekickSettingsTab from "~/settings/sidekickSettingsTab";

export default class TagsAutosuggestPlugin extends Plugin {
  private editorExtension: Extension[] = [];
  settings: SidekickSettings;

  public async onload(): Promise<void> {
    console.log('Autosuggest plugin: loading plugin', new Date().toLocaleString());
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addSettingTab(new SicekickSettingsTab(this.app, this));

    const pluginHelper = new PluginHelper(this);
    const indexer = new Indexer(pluginHelper);

    this.registerEditorExtension(this.editorExtension);

    // Update index for any file that was modified in the vault
    pluginHelper.onFileRename((file) => indexer.replaceFileIndices(file));
    pluginHelper.onFileMetadataChanged((file) => indexer.replaceFileIndices(file));

    // Re/load highlighting extension after any changes to index
    indexer.on('indexRebuilt', () => {
      const search = new Search(indexer, this.settings);
      this.updateEditorExtension(suggestionsExtension(search, this.app));
    });

    indexer.on('indexUpdated', () => {
      const search = new Search(indexer, this.settings);
      this.updateEditorExtension(suggestionsExtension(search, this.app));
    });

    // Build search index on startup (very expensive process)
    pluginHelper.onLayoutReady(() => indexer.buildIndex());
  }

  /**
   * Ref: https://github.com/obsidianmd/obsidian-releases/blob/master/plugin-review.md#how-to-changereconfigure-your-cm6-extensions
   */
  private updateEditorExtension(extension: Extension) {
    this.editorExtension.length = 0;
    this.editorExtension.push(extension);
    this.app.workspace.updateOptions();
  }

  public async onunload(): Promise<void> {
    console.log('Autosuggest plugin: unloading plugin', new Date().toLocaleString());
  }

  public async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
