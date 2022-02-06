import { Plugin, getAllTags } from 'obsidian';
import { matchHighlighter } from './selection';
import { ViewPlugin } from '@codemirror/view';

import './index.css';

export default class TagsAutosuggestPlugin extends Plugin {
  currentExtension: ViewPlugin<any>;

  public async onload(): Promise<void> {
    console.log('Tags Autosuggest plugin: loading plugin', new Date().toLocaleString());

    const reloadHighlightingExtension = () => {
      const tags = this.getUniqueTags();
      this.loadCoreMirrorExtension(tags);
    };

    this.app.workspace.onLayoutReady(reloadHighlightingExtension);
    this.app.vault.on('modify', reloadHighlightingExtension);
  }

  public async onunload(): Promise<void> {
    console.log('Tags Autosuggest plugin: unloading plugin', new Date().toLocaleString());
  }

  private loadCoreMirrorExtension(searchWords: string[]) {
    // Unload any existing version of our extension
    if (this.currentExtension != null) {
      (this.app.workspace as any).unregisterEditorExtension(this.currentExtension);
    }

    this.currentExtension = matchHighlighter(searchWords);
    this.registerEditorExtension(this.currentExtension);
  }

  private getUniqueTags(): string[] {
    const fileCaches = this.app.vault.getMarkdownFiles().map((fileEntry) => {
      return {
        file: fileEntry,
        metadata: this.app.metadataCache.getFileCache(fileEntry),
      };
    });

    const tags = fileCaches.reduce((acc: string[], fileCache) => {
      acc.push(...getAllTags(fileCache.metadata).map((t) => t.substring(1)));
      return acc;
    }, []);

    return Array.from(new Set(tags));
  }
}
