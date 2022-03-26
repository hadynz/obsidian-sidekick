import {App, PluginSettingTab, Setting} from "obsidian"
import SuperchargedLinks from "main"
import TagsAutosuggestPlugin from "~/index";

export default class SicekickSettingsTab extends PluginSettingTab {
  plugin: TagsAutosuggestPlugin;

  constructor(app: App, plugin: SuperchargedLinks) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const {containerEl} = this;

    containerEl.empty();


    new Setting(containerEl)
      .setName('Enable stemming')
      .setDesc('If true, this will also match different forms of the words to match. ' +
        'Turn this off if you are getting many false positives.')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.enableStemming)
        toggle.onChange(value => {
          this.plugin.settings.enableStemming = value
          this.plugin.saveSettings()
        });
      });
  }
}
