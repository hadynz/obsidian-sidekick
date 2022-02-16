import { Plugin } from 'obsidian';
import { suggestionsExtension } from './cmExtension/suggestionsExtension';

import Search from './search';
import { AppHelper } from './app-helper';
import { Indexer } from './indexing/indexer';

export default class TagsAutosuggestPlugin extends Plugin {
  public async onload(): Promise<void> {
    console.log('Autosuggest plugin: loading plugin', new Date().toLocaleString());

    const appHelper = new AppHelper(this.app);
    const indexer = new Indexer(appHelper);
    const search = new Search(indexer);

    this.registerEditorExtension(suggestionsExtension(search));
  }

  public async onunload(): Promise<void> {
    console.log('Autosuggest plugin: unloading plugin', new Date().toLocaleString());
  }
}
