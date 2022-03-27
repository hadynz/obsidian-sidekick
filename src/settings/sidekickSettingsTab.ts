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
        toggle.onChange(async value => {
          this.plugin.settings.enableStemming = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Match tags')
      .setDesc('If true, this will also match tags.')
      .addToggle(toggle => {
        toggle.setValue(this.plugin.settings.matchTags)
        toggle.onChange(async value => {
          this.plugin.settings.matchTags = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Keywords filter')
      .setDesc('Add keywords here that will never be matched. These should be comma separated.')
      .addTextArea((text) => {text
        .setPlaceholder('Enter keywords as string, comma separated')
        .setValue(this.plugin.settings.keywordsFilter)
        .onChange(async (value) => {
          this.plugin.settings.keywordsFilter = value;
          await this.plugin.saveSettings();
        })
        text.inputEl.rows = 4;
        text.inputEl.cols = 25;
      });
  }
}
