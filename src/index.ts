import { Plugin } from 'obsidian';
import { Extension } from '@codemirror/state';
import { suggestionsExtension } from './cmExtension/suggestionsExtension';

import Search from './search';
import { Indexer } from './indexing/indexer';
import { AppHelper } from './app-helper';

export default class TagsAutosuggestPlugin extends Plugin {
  private editorExtension: Extension[] = [];

  public async onload(): Promise<void> {
    console.log('Autosuggest plugin: loading plugin', new Date().toLocaleString());

    const appHelper = new AppHelper(this.app);
    const indexer = new Indexer(appHelper);
    const search = new Search(indexer);

    this.registerEditorExtension(this.editorExtension);

    this.app.workspace.onLayoutReady(() => {
      // Index every time a file is modified
      this.registerEvent(this.app.vault.on('modify', () => indexer.indexAll()));

      // Index on startup
      indexer.indexAll();
    });

    indexer.on('updated-index', () => {
      this.updateEditorExtension(suggestionsExtension(search));
    });
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
