import { Plugin } from 'obsidian';
import { suggestionsExtension } from './cmExtension/suggestionsExtension';
import { ViewPlugin, PluginValue } from '@codemirror/view';

import Search from './search';
import { Indexer } from './indexing/indexer';
import { AppHelper } from './app-helper';

export default class TagsAutosuggestPlugin extends Plugin {
  currentExtension: ViewPlugin<PluginValue>;

  public async onload(): Promise<void> {
    console.log('Autosuggest plugin: loading plugin', new Date().toLocaleString());

    const appHelper = new AppHelper(this.app);
    const indexer = new Indexer(appHelper);
    const search = new Search(indexer);

    this.app.workspace.onLayoutReady(() => {
      // Index every time a file is modified
      this.registerEvent(this.app.vault.on('modify', () => indexer.indexAll()));

      // Index on startup
      indexer.indexAll();
    });

    indexer.on('updated-index', () => {
      // Unload any existing version of our extension
      if (this.currentExtension != null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.app.workspace as any).unregisterEditorExtension(this.currentExtension);
      }

      this.currentExtension = suggestionsExtension(search);
      this.registerEditorExtension(this.currentExtension);
    });
  }

  public async onunload(): Promise<void> {
    console.log('Autosuggest plugin: unloading plugin', new Date().toLocaleString());
  }
}
