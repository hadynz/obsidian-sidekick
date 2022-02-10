import { Plugin } from 'obsidian';
import { suggestionsExtension } from './suggestionsExtension';
import { ViewPlugin, PluginValue } from '@codemirror/view';

import Search from './search';

import './index.css';

export default class TagsAutosuggestPlugin extends Plugin {
  currentExtension: ViewPlugin<PluginValue>;

  public async onload(): Promise<void> {
    console.log('Autosuggest plugin: loading plugin', new Date().toLocaleString());

    const search = new Search(this.app);

    search.on('updated-index', () => {
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
