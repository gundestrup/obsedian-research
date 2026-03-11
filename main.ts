import { App, Plugin, PluginSettingTab, Setting, Modal, Notice, Editor, MarkdownView } from 'obsidian';

interface PubMedFetcherSettings {
	apiKey?: string;
	articleType?: string;
}

const DEFAULT_SETTINGS: PubMedFetcherSettings = {
	apiKey: '',
	articleType: 'Article'
}

export default class PubMedFetcherPlugin extends Plugin {
	settings: PubMedFetcherSettings;

	async onload() {
		await this.loadSettings();

		// Add command to fetch article
		this.addCommand({
			id: 'fetch-article',
			name: 'Fetch Article from PubMed/DOI',
			callback: () => {
				new ArticleInputModal(this.app, this.settings, (input) => {
					this.fetchArticle(input);
				}).open();
			}
		});

		// Add editor command to fetch from selected text
		this.addCommand({
			id: 'fetch-article-from-selection',
			name: 'Fetch Article from Selected PubMed/DOI',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection().trim();
				if (selection) {
					this.fetchArticleAndInsert(selection, editor);
				} else {
					new Notice('Please select a PubMed ID or DOI first');
				}
			}
		});

		// Add editor menu option
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				const selection = editor.getSelection().trim();
				if (selection && (this.extractPubMedId(selection) || this.extractDOI(selection))) {
					menu.addItem((item) => {
						item
							.setTitle('Fetch Article Info')
							.setIcon('download')
							.onClick(() => {
								this.fetchArticleAndInsert(selection, editor);
							});
					});
				}
			})
		);

		// Add settings tab
		this.addSettingTab(new PubMedFetcherSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private isValidDOI(doi: string): boolean {
		return /^10\.\d+\/.+$/.test(doi);
	}

	private cleanDOI(doi: string): string {
		// Remove 'doi: ' prefix if present (case-insensitive)
		return doi.replace(/^doi:\s*/i, '').trim();
	}

	private extractPubMedId(input: string): string | null {
		// Extract from URL like https://pubmed.ncbi.nlm.nih.gov/38570095/
		const urlMatch = input.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/);
		if (urlMatch) return urlMatch[1];
		
		// Direct numeric ID
		if (/^\d+$/.test(input)) return input;
		
		return null;
	}

	private extractDOI(input: string): string | null {
		// Extract from URL like https://doi.org/10.1016/j.clinme.2024.100038
		const doiUrlMatch = input.match(/doi\.org\/(10\.\d+\/.+?)(?:[#?]|$)/);
		if (doiUrlMatch) return doiUrlMatch[1];
		
		// Direct DOI
		if (this.isValidDOI(input)) return input;
		
		return null;
	}

	private async findPubMedIdFromDOI(doi: string): Promise<string | null> {
		try {
			// Use NCBI E-utilities to search by DOI
			const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
			const params = new URLSearchParams({
				db: 'pubmed',
				term: `"${doi}"[DOI]`,
				retmode: 'json',
				retmax: '1'
			});

			if (this.settings.apiKey) {
				params.append('api_key', this.settings.apiKey);
			}

			const response = await fetch(`${baseUrl}?${params}`);
			
			if (!response.ok) {
				return null;
			}

			const data = await response.json();
			const idList = data.esearchresult?.idlist;
			
			return idList && idList.length > 0 ? idList[0] : null;
		} catch (error) {
			console.error('Error searching PubMed by DOI:', error);
			return null;
		}
	}

	async fetchArticle(input: string) {
		const trimmedInput = input.trim();
		
		// Try to extract PubMed ID from URL or direct input
		const pubmedId = this.extractPubMedId(trimmedInput);
		if (pubmedId) {
			await this.fetchByPubMedId(pubmedId);
			return;
		}
		
		// Try to extract DOI from URL or direct input
		const doi = this.extractDOI(trimmedInput);
		if (doi) {
			// First try to find PubMed ID from DOI
			const pubmedId = await this.findPubMedIdFromDOI(doi);
			if (pubmedId) {
				await this.fetchByPubMedIdWithDOI(pubmedId, doi);
			} else {
				// Fallback to DOI-only if no PubMed ID found
				await this.fetchByDOI(doi);
			}
			return;
		}
		
		new Notice('Invalid input. Please enter a valid PubMed ID, DOI, or URL.');
	}

	async fetchArticleAndInsert(input: string, editor: Editor) {
		const trimmedInput = input.trim();
		
		// Try to extract PubMed ID from URL or direct input
		const pubmedId = this.extractPubMedId(trimmedInput);
		if (pubmedId) {
			await this.fetchByPubMedIdAndInsert(pubmedId, editor);
			return;
		}
		
		// Try to extract DOI from URL or direct input
		const doi = this.extractDOI(trimmedInput);
		if (doi) {
			// First try to find PubMed ID from DOI
			const pubmedId = await this.findPubMedIdFromDOI(doi);
			if (pubmedId) {
				await this.fetchByPubMedIdAndInsertWithDOI(pubmedId, doi, editor);
			} else {
				// Fallback to DOI-only if no PubMed ID found
				await this.fetchByDOIAndInsert(doi, editor);
			}
			return;
		}
		
		new Notice('Invalid input. Please enter a valid PubMed ID, DOI, or URL.');
	}

	async fetchByPubMedId(pubmedId: string) {
		try {
			new Notice('Fetching article from PubMed...');
			
			// Use NCBI E-utilities API
			const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
			const params = new URLSearchParams({
				db: 'pubmed',
				id: pubmedId,
				retmode: 'json',
				version: '2.0'
			});

			if (this.settings.apiKey) {
				params.append('api_key', this.settings.apiKey);
			}

			const response = await fetch(`${baseUrl}?${params}`);
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			const result = data.result?.[pubmedId];

			if (!result) {
				throw new Error('Article not found');
			}

			// Extract DOI from PubMed data if available
			// Check multiple possible locations for DOI in the API response
			let doi = '';
			if (result.doi) {
				doi = result.doi;
			} else if (result.elocationid) {
				doi = result.elocationid;
			} else if (result.articleids) {
				// DOI might be in the articleids array
				const doiObj = result.articleids.find((id: any) => id.idtype === 'doi');
				if (doiObj) {
					doi = this.cleanDOI(doiObj.value);
				}
			}
			
			const articleInfo = {
				title: result.title || 'No title available',
				journal: result.source || result.fulljournalname || 'No journal available',
				year: result.pubdate ? result.pubdate.split(' ')[0] : 'No year available',
				pubmedId: pubmedId,
				doi: doi,
				articleType: result.pubtype?.[0] || this.settings.articleType || 'Article'
			};

			this.displayArticleInfo(articleInfo);
			
		} catch (error) {
			console.error('Error fetching PubMed article:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			new Notice(`Error fetching article: ${errorMessage}`);
		}
	}

	async fetchByPubMedIdAndInsert(pubmedId: string, editor: Editor) {
		try {
			new Notice('Fetching article from PubMed...');
			
			const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
			const params = new URLSearchParams({
				db: 'pubmed',
				id: pubmedId,
				retmode: 'json',
				version: '2.0'
			});

			if (this.settings.apiKey) {
				params.append('api_key', this.settings.apiKey);
			}

			const response = await fetch(`${baseUrl}?${params}`);
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			const result = data.result?.[pubmedId];

			if (!result) {
				throw new Error('Article not found');
			}

			// Extract DOI from PubMed data if available
			// Check multiple possible locations for DOI in the API response
			let doi = '';
			if (result.doi) {
				doi = result.doi;
			} else if (result.elocationid) {
				doi = result.elocationid;
			} else if (result.articleids) {
				// DOI might be in the articleids array
				const doiObj = result.articleids.find((id: any) => id.idtype === 'doi');
				if (doiObj) {
					doi = this.cleanDOI(doiObj.value);
				}
			}
			
			const articleInfo = {
				title: result.title || 'No title available',
				journal: result.source || result.fulljournalname || 'No journal available',
				year: result.pubdate ? result.pubdate.split(' ')[0] : 'No year available',
				pubmedId: pubmedId,
				doi: doi,
				articleType: result.pubtype?.[0] || this.settings.articleType || 'Article'
			};

			this.insertArticleInfo(articleInfo, editor);
			
		} catch (error) {
			console.error('Error fetching PubMed article:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			new Notice(`Error fetching article: ${errorMessage}`);
		}
	}

	async fetchByDOI(doi: string) {
		try {
			new Notice('Fetching article from DOI...');
			
			// Use Crossref API
			const baseUrl = 'https://api.crossref.org/works/' + encodeURIComponent(doi);
			
			const response = await fetch(baseUrl);
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			const message = data.message;

			if (!message) {
				throw new Error('Article not found');
			}

			const articleInfo = {
				title: message.title?.[0] || 'No title available',
				journal: message['short-container-title']?.[0] || message['container-title']?.[0] || 'No journal available',
				year: message.created?.['date-parts']?.[0]?.[0]?.toString() || 'No year available',
				doi: doi,
				articleType: message.type || this.settings.articleType || 'Article'
			};

			this.displayArticleInfo(articleInfo);
			
		} catch (error) {
			console.error('Error fetching DOI article:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			new Notice(`Error fetching article: ${errorMessage}`);
		}
	}

	async fetchByDOIAndInsert(doi: string, editor: Editor) {
		try {
			new Notice('Fetching article from DOI...');
			
			const baseUrl = 'https://api.crossref.org/works/' + encodeURIComponent(doi);
			
			const response = await fetch(baseUrl);
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			const message = data.message;

			if (!message) {
				throw new Error('Article not found');
			}

			const articleInfo = {
				title: message.title?.[0] || 'No title available',
				journal: message['short-container-title']?.[0] || message['container-title']?.[0] || 'No journal available',
				year: message.created?.['date-parts']?.[0]?.[0]?.toString() || 'No year available',
				doi: doi,
				articleType: message.type || this.settings.articleType || 'Article'
			};

			this.insertArticleInfo(articleInfo, editor);
			
		} catch (error) {
			console.error('Error fetching DOI article:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			new Notice(`Error fetching article: ${errorMessage}`);
		}
	}

	async displayArticleInfo(info: { title: string; journal: string; year: string; pubmedId?: string; doi?: string; articleType?: string }) {
		const link = info.pubmedId 
			? `https://pubmed.ncbi.nlm.nih.gov/${info.pubmedId}/`
			: `https://doi.org/${this.cleanDOI(info.doi || '')}`;
		
		const content = `# ${info.title}

**Journal:** ${info.journal}  
**Year:** ${info.year}  
**Link:** ${link}  
**ID:** ${info.pubmedId || info.doi}

---

*Fetched by PubMed Article Fetcher plugin*`;

		// Create a new note with the article information
		let sanitizedTitle = info.title.replace(/[^\w\s-]/g, '').trim().substring(0, 50);
		if (!sanitizedTitle) {
			sanitizedTitle = `article-${Date.now()}`;
		}
		let fileName = `${sanitizedTitle}.md`;
		
		// Check if file exists and add number suffix if needed
		let counter = 1;
		while (await this.app.vault.adapter.exists(fileName)) {
			const baseName = fileName.replace(/\.md$/, '');
			fileName = `${baseName}-${counter}.md`;
			counter++;
		}
		
		const file = await this.app.vault.create(fileName, content);
		
		new Notice(`Article information saved to ${fileName}`);
	}

	insertArticleInfo(info: { title: string; journal: string; year: string; pubmedId?: string; doi?: string; articleType?: string }, editor: Editor) {
		// Format: Type: Title - Year, Journal
		const type = info.articleType || 'Article';
		
		if (info.pubmedId && info.doi) {
			// Dual link format: PubMed + citation links to PubMed, DOI icon links to DOI
			const pubmedLink = `https://pubmed.ncbi.nlm.nih.gov/${info.pubmedId}/`;
			const doiLink = `https://doi.org/${this.cleanDOI(info.doi)}`;
			const citation = `📚 ${type}: [${info.title}](${pubmedLink}) - ${info.year}, ${info.journal} [🔗](${doiLink})`;
			editor.replaceSelection(citation);
		} else if (info.pubmedId) {
			// PubMed only
			const pubmedLink = `https://pubmed.ncbi.nlm.nih.gov/${info.pubmedId}/`;
			const citation = `📚 ${type}: [${info.title}](${pubmedLink}) - ${info.year}, ${info.journal}`;
			editor.replaceSelection(citation);
		} else if (info.doi) {
			// DOI only (fallback)
			const doiLink = `https://doi.org/${this.cleanDOI(info.doi)}`;
			const citation = `🔗 ${type}: [${info.title}](${doiLink}) - ${info.year}, ${info.journal}`;
			editor.replaceSelection(citation);
		}
		
		new Notice('Article information inserted');
	}

	async fetchByPubMedIdWithDOI(pubmedId: string, doi: string) {
		try {
			new Notice('Fetching article from PubMed...');
			
			const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
			const params = new URLSearchParams({
				db: 'pubmed',
				id: pubmedId,
				retmode: 'json',
				version: '2.0'
			});

			if (this.settings.apiKey) {
				params.append('api_key', this.settings.apiKey);
			}

			const response = await fetch(`${baseUrl}?${params}`);
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			const result = data.result?.[pubmedId];

			if (!result) {
				throw new Error('Article not found');
			}

			const articleInfo = {
				title: result.title || 'No title available',
				journal: result.source || result.fulljournalname || 'No journal available',
				year: result.pubdate ? result.pubdate.split(' ')[0] : 'No year available',
				pubmedId: pubmedId,
				doi: doi,
				articleType: result.pubtype?.[0] || this.settings.articleType || 'Article'
			};

			this.displayArticleInfo(articleInfo);
			
		} catch (error) {
			console.error('Error fetching PubMed article:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			new Notice(`Error fetching article: ${errorMessage}`);
		}
	}

	async fetchByPubMedIdAndInsertWithDOI(pubmedId: string, doi: string, editor: Editor) {
		try {
			new Notice('Fetching article from PubMed...');
			
			const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
			const params = new URLSearchParams({
				db: 'pubmed',
				id: pubmedId,
				retmode: 'json',
				version: '2.0'
			});

			if (this.settings.apiKey) {
				params.append('api_key', this.settings.apiKey);
			}

			const response = await fetch(`${baseUrl}?${params}`);
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			const result = data.result?.[pubmedId];

			if (!result) {
				throw new Error('Article not found');
			}

			const articleInfo = {
				title: result.title || 'No title available',
				journal: result.source || result.fulljournalname || 'No journal available',
				year: result.pubdate ? result.pubdate.split(' ')[0] : 'No year available',
				pubmedId: pubmedId,
				doi: doi,
				articleType: result.pubtype?.[0] || this.settings.articleType || 'Article'
			};

			this.insertArticleInfo(articleInfo, editor);
			
		} catch (error) {
			console.error('Error fetching PubMed article:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			new Notice(`Error fetching article: ${errorMessage}`);
		}
	}
}

class ArticleInputModal extends Modal {
	onSubmit: (input: string) => void;

	constructor(app: App, settings: PubMedFetcherSettings, onSubmit: (input: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Enter PubMed ID or DOI' });

		const input = contentEl.createEl('input', {
			type: 'text',
			placeholder: 'PubMed ID (e.g., 38570095) or DOI (e.g., 10.1016/j.clinme.2024.100038)'
		});
		input.style.width = '100%';
		input.style.marginBottom = '20px';

		const submitBtn = contentEl.createEl('button', { text: 'Fetch Article' });
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

class PubMedFetcherSettingTab extends PluginSettingTab {
	plugin: PubMedFetcherPlugin;

	constructor(app: App, plugin: PubMedFetcherPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl('h2', { text: 'PubMed Article Fetcher Settings' });

		new Setting(containerEl)
			.setName('NCBI API Key (Optional)')
			.setDesc('Enter your NCBI API key for higher rate limits. Get one from https://www.ncbi.nlm.nih.gov/account/dev/')
			.addText(text => text
				.setPlaceholder('Your NCBI API key')
				.setValue(this.plugin.settings.apiKey || '')
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				}));
	}
}
