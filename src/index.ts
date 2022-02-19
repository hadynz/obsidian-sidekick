import { Plugin } from 'obsidian';
import type { Extension } from '@codemirror/state';

import Search from './search';
import { PluginHelper } from './plugin-helper';
import { Indexer } from './indexing/indexer';
import { suggestionsExtension } from './cmExtension/suggestionsExtension';

export default class TagsAutosuggestPlugin extends Plugin {
  private editorExtension: Extension[] = [];

  public async onload(): Promise<void> {
    console.log('Autosuggest plugin: loading plugin', new Date().toLocaleString());

    const pluginHelper = new PluginHelper(this);
    const indexer = new Indexer(pluginHelper);
    const search = new Search(indexer);

    this.registerEditorExtension(this.editorExtension);

    // Update index for any file that was modified in the vault
    pluginHelper.onFileRename((file) => indexer.replaceFileIndices(file));
    pluginHelper.onFileMetadataChanged((file) => indexer.replaceFileIndices(file));

    // Re/load highlighting extension after any changes to index
    indexer.on('indexRebuilt', () =>
      this.updateEditorExtension(suggestionsExtension(search, this.app))
    );

    indexer.on('indexUpdated', () =>
      this.updateEditorExtension(suggestionsExtension(search, this.app))
    );

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
}
