import { App, Modal, Setting } from 'obsidian';

export class FolderSelectionModal extends Modal {
	onSubmit: (folder: string) => void;

	constructor(app: App, onSubmit: (folder: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		new Setting(contentEl)
			.setName('Select folder for global update')
			.setHeading();

		// eslint-disable-next-line obsidianmd/ui/sentence-case -- PubMed and DOI are proper nouns, ALL is emphasized
		new Setting(contentEl).setDesc('⚠️ This will update ALL PubMed/DOI links in the selected folder and its subfolders.');

		const allFiles = this.app.vault.getAllLoadedFiles();
		const folders = allFiles
			.filter((f) => 'children' in f)
			.map((f) => f.path)
			.sort();

		const allNotesBtn = contentEl.createEl('button', {
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- button text with emoji prefix
			text: '📁 All notes in vault',
			cls: 'pubmed-fetcher-button-full',
		});
		allNotesBtn.onclick = () => {
			this.onSubmit('/');
			this.close();
		};

		contentEl.createEl('p', { text: 'Or select a specific folder' });

		const folderList = contentEl.createEl('div', { cls: 'pubmed-fetcher-folder-list' });

		if (folders.length === 0) {
			folderList.createEl('p', { text: 'No folders found in the vault' });
		} else {
			folders.forEach((folder) => {
				const folderBtn = folderList.createEl('button', {
					text: `📁 ${folder || '(root)'}`,
					cls: 'pubmed-fetcher-folder-button',
				});
				folderBtn.onclick = () => {
					this.onSubmit(folder);
					this.close();
				};
			});
		}

		const cancelBtn = contentEl.createEl('button', {
			text: 'Cancel',
			cls: 'pubmed-fetcher-button-cancel',
		});
		cancelBtn.onclick = () => {
			this.close();
		};
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class ArticleInputModal extends Modal {
	onSubmit: (input: string) => void;

	constructor(app: App, onSubmit: (input: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		new Setting(contentEl)
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- PubMed and DOI are proper nouns
			.setName('Enter PubMed ID or DOI')
			.setHeading();

		const input = contentEl.createEl('input', {
			type: 'text',
			placeholder: 'PubMed ID (e.g., 38570095) or DOI (e.g., 10.1016/j.clinme.2024.100038)',
			cls: 'pubmed-fetcher-input',
		});

		const submitBtn = contentEl.createEl('button', { text: 'Fetch article' });
		submitBtn.onclick = () => {
			this.onSubmit(input.value);
			this.close();
		};

		input.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') {
				this.onSubmit(input.value);
				this.close();
			}
		});

		input.focus();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
