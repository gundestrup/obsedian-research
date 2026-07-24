import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import type { PluginSettingsHolder } from './types';

export class PubMedFetcherSettingTab extends PluginSettingTab {
	plugin: PluginSettingsHolder;

	constructor(app: App, plugin: PluginSettingsHolder) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions() {
		return [
			{
				name: 'NCBI API key (optional)',
				desc: 'Enter your NCBI API key for higher rate limits. Get one at https://www.ncbi.nlm.nih.gov/account/',
				control: {
					type: 'text' as const,
					key: 'apiKey' as const,
					placeholder: 'Your NCBI API key',
				},
			},
			{
				name: 'Enable global update command',
				desc: '⚠️ DANGEROUS: Enable the "Link global" command that can update ALL notes in your vault. This command will modify multiple files. Only enable if you understand the risks and have backups.',
				render: (setting: Setting) => {
					setting.addToggle((toggle) =>
						toggle
							.setValue(this.plugin.settings.enableGlobalCommand || false)
							.onChange(async (value) => {
								this.plugin.settings.enableGlobalCommand = value;
								await this.plugin.saveSettings();
								new Notice(
									`Global command ${value ? 'enabled' : 'disabled'}. Please reload Obsidian for changes to take effect.`
								);
							})
					);
				},
			},
		];
	}
}
