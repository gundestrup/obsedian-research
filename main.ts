import { Plugin, Notice, Editor, requestUrl } from 'obsidian';
import type { PubMedFetcherSettings, ArticleInfo, RequestUrlResponse } from './src/types';
import { DEFAULT_SETTINGS } from './src/types';
import {
	extractPubMedId,
	extractPMCId,
	extractDOI,
	cleanDOI,
	isAlreadyCited,
	formatCitation,
	extractUniqueIds,
	isPubMedIdCited,
	isPMCIdCited,
	isDOICited,
	replacePubMedUrl,
	replacePMCUrl,
	replaceDOIUrl,
} from './src/utils';
import {
	fetchPubMedApiData,
	fetchDOIApiData,
	findPubMedIdFromPMC,
	findPubMedIdFromDOI,
	type RequestFunction,
} from './src/api';
import { ArticleInputModal, FolderSelectionModal } from './src/modals';
import { PubMedFetcherSettingTab } from './src/settings';

export default class PubMedFetcherPlugin extends Plugin {
	settings!: PubMedFetcherSettings;

	private get apiKey(): string {
		return this.settings.apiKey || '';
	}

	private get requestFn(): RequestFunction {
		return async (params: { url: string }): Promise<RequestUrlResponse> => {
		const response = await requestUrl({ url: params.url });
		return { status: response.status, json: response.json as unknown };
		};
	}

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'fetch-article-note',
			name: 'Create new note with article info',
			callback: () => {
				new ArticleInputModal(this.app, (input) => {
					void this.fetchArticle(input);
				}).open();
			}
		});

		this.addCommand({
			id: 'fetch-article-selected',
			name: 'Update selected link only',
			editorCallback: (editor: Editor) => {
				const selection = editor.getSelection().trim();
				if (selection) {
					void this.fetchArticleAndInsert(selection, editor);
				} else {
					new Notice('Please select a PubMed ID or DOI first');
				}
			}
		});

		this.addCommand({
			id: 'fetch-article-all',
			name: 'Update all links in current note',
			editorCallback: (editor: Editor) => {
				void this.fetchAllArticlesInNote(editor);
			}
		});

		if (this.settings.enableGlobalCommand) {
			this.addCommand({
				id: 'fetch-article-global',
				name: 'Update all links in all notes',
				callback: () => {
					new FolderSelectionModal(this.app, (selectedFolder) => {
						void this.fetchAllArticlesInVault(selectedFolder);
					}).open();
				}
			});
		}

		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor) => {
				const selection = editor.getSelection().trim();
				if (selection && (extractPubMedId(selection) || extractDOI(selection) || extractPMCId(selection))) {
					menu.addItem((item) => {
						item
							.setTitle('Fetch article info')
							.setIcon('download')
							.onClick(() => {
								void this.fetchArticleAndInsert(selection, editor);
							});
					});
				}
			})
		);

		this.addSettingTab(new PubMedFetcherSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as PubMedFetcherSettings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private handleError(error: unknown, context: string): void {
		console.error('Error in', context, error);
		const message = error instanceof Error ? error.message : 'Unknown error occurred';
		new Notice(`Error fetching article: ${message}`);
	}

	private async delay(ms: number): Promise<void> {
		return new Promise(resolve => window.setTimeout(resolve, ms));
	}

	async fetchArticle(input: string) {
		const trimmedInput = input.trim();

		const pubmedId = extractPubMedId(trimmedInput);
		if (pubmedId) {
			await this.fetchByPubMedId(pubmedId);
			return;
		}

		const pmcId = extractPMCId(trimmedInput);
		if (pmcId) {
			new Notice(`PMC ID found: ${pmcId}. Searching for corresponding PubMed ID...`);
			const pubmedId = await findPubMedIdFromPMC(pmcId, this.apiKey, this.requestFn);
			if (pubmedId) {
				await this.fetchByPubMedIdWithPMC(pubmedId, pmcId);
			} else {
				new Notice('Could not find PubMed ID for the given PMC ID.');
			}
			return;
		}

		const doi = extractDOI(trimmedInput);
		if (doi) {
			const pubmedId = await findPubMedIdFromDOI(doi, this.apiKey, this.requestFn);
			if (pubmedId) {
				await this.fetchByPubMedIdWithDOI(pubmedId, doi);
			} else {
				await this.fetchByDOI(doi);
			}
			return;
		}

		new Notice('Invalid input. Please enter a valid PubMed ID, DOI, or URL');
	}

	async fetchArticleAndInsert(input: string, editor: Editor) {
		const trimmedInput = input.trim();

		const pubmedId = extractPubMedId(trimmedInput);
		if (pubmedId) {
			await this.fetchByPubMedIdAndInsert(pubmedId, editor);
			return;
		}

		const pmcId = extractPMCId(trimmedInput);
		if (pmcId) {
			const pubmedId = await findPubMedIdFromPMC(pmcId, this.apiKey, this.requestFn);
			if (pubmedId) {
				const articleInfo = await fetchPubMedApiData(pubmedId, this.apiKey, this.requestFn);
				articleInfo.pmcId = pmcId;
				this.insertArticleInfo(articleInfo, editor);
			} else {
				new Notice('Could not find PubMed ID for the given PMC ID.');
			}
			return;
		}

		const doi = extractDOI(trimmedInput);
		if (doi) {
			const pubmedId = await findPubMedIdFromDOI(doi, this.apiKey, this.requestFn);
			if (pubmedId) {
				await this.fetchByPubMedIdAndInsertWithDOI(pubmedId, doi, editor);
			} else {
				await this.fetchByDOIAndInsert(doi, editor);
			}
			return;
		}

		new Notice('Invalid input. Please enter a valid PubMed ID, PMC ID, DOI, or URL');
	}

	async fetchByPubMedId(pubmedId: string) {
		try {
			new Notice('Fetching article from PubMed');
			const articleInfo = await fetchPubMedApiData(pubmedId, this.apiKey, this.requestFn);
			void this.displayArticleInfo(articleInfo);
		} catch (error) {
			this.handleError(error, 'fetchByPubMedId');
		}
	}

	async fetchByPubMedIdAndInsert(pubmedId: string, editor: Editor) {
		try {
			new Notice('Fetching article from PubMed');
			const articleInfo = await fetchPubMedApiData(pubmedId, this.apiKey, this.requestFn);
			this.insertArticleInfo(articleInfo, editor);
		} catch (error) {
			this.handleError(error, 'fetchByPubMedIdAndInsert');
		}
	}

	async fetchByDOI(doi: string) {
		try {
			new Notice('Fetching article from DOI');
			const articleInfo = await fetchDOIApiData(doi, this.settings.articleType || 'Article', this.requestFn);
			void this.displayArticleInfo(articleInfo);
		} catch (error) {
			this.handleError(error, 'fetchByDOI');
		}
	}

	async fetchByDOIAndInsert(doi: string, editor: Editor) {
		try {
			new Notice('Fetching article from DOI');
			const articleInfo = await fetchDOIApiData(doi, this.settings.articleType || 'Article', this.requestFn);
			this.insertArticleInfo(articleInfo, editor);
		} catch (error) {
			this.handleError(error, 'fetchByDOIAndInsert');
		}
	}

	async displayArticleInfo(info: ArticleInfo) {
		const link = info.pmcId
			? `https://pmc.ncbi.nlm.nih.gov/articles/${info.pmcId}/`
			: info.pubmedId
				? `https://pubmed.ncbi.nlm.nih.gov/${info.pubmedId}/`
				: `https://doi.org/${cleanDOI(info.doi || '')}`;

		const content = `# ${info.title}

**Journal:** ${info.journal}  
**Year:** ${info.year}  
**Link:** ${link}  
**ID:** ${info.pubmedId || info.doi}

---

*Fetched by PubMed Article Fetcher plugin*`;

		let sanitizedTitle = info.title.replace(/[^\w\s-]/g, '').trim().substring(0, 50);
		if (!sanitizedTitle) {
			sanitizedTitle = `article-${Date.now()}`;
		}
		let fileName = `${sanitizedTitle}.md`;

		let counter = 1;
		while (await this.app.vault.adapter.exists(fileName)) {
			const baseName = fileName.replace(/\.md$/, '');
			fileName = `${baseName}-${counter}.md`;
			counter++;
		}

		await this.app.vault.create(fileName, content);

		new Notice(`Article information saved to ${fileName}`);
	}

	insertArticleInfo(info: ArticleInfo, editor: Editor) {
		const citation = formatCitation(info);
		editor.replaceSelection(citation);
		new Notice('Article information inserted');
	}

	async fetchByPubMedIdWithPMC(pubmedId: string, pmcId: string) {
		try {
			new Notice('Fetching article from PubMed');
			const articleInfo = await fetchPubMedApiData(pubmedId, this.apiKey, this.requestFn);
			articleInfo.pmcId = pmcId;
			void this.displayArticleInfo(articleInfo);
		} catch (error) {
			this.handleError(error, 'fetchByPubMedIdWithPMC');
		}
	}

	async fetchByPubMedIdWithDOI(pubmedId: string, doi: string) {
		try {
			new Notice('Fetching article from PubMed');
			const articleInfo = await fetchPubMedApiData(pubmedId, this.apiKey, this.requestFn);
			articleInfo.doi = doi;
			void this.displayArticleInfo(articleInfo);
		} catch (error) {
			this.handleError(error, 'fetchByPubMedIdWithDOI');
		}
	}

	async fetchByPubMedIdAndInsertWithDOI(pubmedId: string, doi: string, editor: Editor) {
		try {
			new Notice('Fetching article from PubMed');
			const articleInfo = await fetchPubMedApiData(pubmedId, this.apiKey, this.requestFn);
			articleInfo.doi = doi;
			this.insertArticleInfo(articleInfo, editor);
		} catch (error) {
			this.handleError(error, 'fetchByPubMedIdAndInsertWithDOI');
		}
	}

	private logArticleProcessingError(kind: string, id: string, error: unknown, location?: string): void {
		if (location) {
			console.error('Error processing article in file', kind, id, location, error);
			return;
		}
		console.error('Error processing article', kind, id, error);
	}

	private async processPubMedLink(content: string, pubmedId: string, location?: string): Promise<{ content: string; processed: boolean }> {
		try {
			if (isPubMedIdCited(content, pubmedId)) return { content, processed: false };

			const info = await fetchPubMedApiData(pubmedId, this.apiKey, this.requestFn);
			if (info && !isAlreadyCited(content, info.pubmedId, info.doi, info.pmcId, info.title, info.year)) {
				return { content: replacePubMedUrl(content, pubmedId, formatCitation(info)), processed: true };
			}
			await this.delay(350);
		} catch (error) {
			this.logArticleProcessingError('PubMed ID', pubmedId, error, location);
		}
		return { content, processed: false };
	}

	private async processPMCLink(content: string, pmcId: string, location?: string): Promise<{ content: string; processed: boolean }> {
		try {
			if (isPMCIdCited(content, pmcId)) return { content, processed: false };

			const pubmedId = await findPubMedIdFromPMC(pmcId, this.apiKey, this.requestFn);
			await this.delay(350);
			if (pubmedId) {
				const info = await fetchPubMedApiData(pubmedId, this.apiKey, this.requestFn);
				await this.delay(350);
				if (info) {
					const articleInfo = { ...info, pmcId };
					if (!isAlreadyCited(content, articleInfo.pubmedId, articleInfo.doi, articleInfo.pmcId, articleInfo.title, articleInfo.year)) {
						return { content: replacePMCUrl(content, pmcId, formatCitation(articleInfo)), processed: true };
					}
				}
			}
		} catch (error) {
			this.logArticleProcessingError('PMC ID', pmcId, error, location);
		}
		return { content, processed: false };
	}

	private async processDOILink(content: string, doi: string, location?: string): Promise<{ content: string; processed: boolean }> {
		try {
			if (isDOICited(content, doi)) return { content, processed: false };

			const info = await fetchDOIApiData(doi, this.settings.articleType || 'Article', this.requestFn);
			if (!isAlreadyCited(content, info.pubmedId, info.doi, info.pmcId, info.title, info.year)) {
				return { content: replaceDOIUrl(content, doi, formatCitation(info)), processed: true };
			}
			await this.delay(350);
		} catch (error) {
			this.logArticleProcessingError('DOI', doi, error, location);
		}
		return { content, processed: false };
	}

	private async processArticleLinks(content: string, ids: ReturnType<typeof extractUniqueIds>, location?: string): Promise<{ content: string; processedCount: number }> {
		let processedCount = 0;
		let updatedContent = content;
		for (const pubmedId of ids.pubmedIds) {
			const result = await this.processPubMedLink(updatedContent, pubmedId, location);
			updatedContent = result.content;
			if (result.processed) processedCount++;
		}
		for (const pmcId of ids.pmcIds) {
			const result = await this.processPMCLink(updatedContent, pmcId, location);
			updatedContent = result.content;
			if (result.processed) processedCount++;
		}
		for (const doi of ids.dois) {
			const result = await this.processDOILink(updatedContent, doi, location);
			updatedContent = result.content;
			if (result.processed) processedCount++;
		}
		return { content: updatedContent, processedCount };
	}

	async fetchAllArticlesInNote(editor: Editor) {
		const content = editor.getValue();
		const ids = extractUniqueIds(content);
		const totalLinks = ids.pubmedIds.length + ids.pmcIds.length + ids.dois.length;

		if (totalLinks === 0) {
			new Notice('No PubMed IDs, PMC IDs, or DOIs found in this note');
			return;
		}

		new Notice(`Found ${totalLinks} links to process in current note`);
		const result = await this.processArticleLinks(content, ids);
		if (result.processedCount > 0) editor.setValue(result.content);
		new Notice(`Successfully processed ${result.processedCount} of ${totalLinks} links in current note`);
	}

	async fetchAllArticlesInVault(selectedFolder?: string) {
		let files = this.app.vault.getMarkdownFiles();
		if (selectedFolder && selectedFolder !== '/') files = files.filter(file => file.path.startsWith(selectedFolder));

		if (files.length === 0) {
			new Notice(`No markdown files found${selectedFolder ? ` in folder: ${selectedFolder}` : ' in vault'}`);
			return;
		}

		const folderInfo = selectedFolder && selectedFolder !== '/' ? ` in folder: ${selectedFolder}` : ' in vault';
		new Notice(`Scanning ${files.length} notes${folderInfo} for PubMed/PMC/DOI links...`);
		let totalLinksFound = 0;
		let totalProcessed = 0;
		let filesProcessed = 0;

		for (const file of files) {
			try {
				const content = await this.app.vault.read(file);
				const ids = extractUniqueIds(content);
				const linksInFile = ids.pubmedIds.length + ids.pmcIds.length + ids.dois.length;
				if (linksInFile === 0) continue;

				totalLinksFound += linksInFile;
				filesProcessed++;
				const result = await this.processArticleLinks(content, ids, file.path);
				totalProcessed += result.processedCount;
				if (result.content !== content) await this.app.vault.modify(file, result.content);
			} catch (error) {
				console.error('Error processing file', file.path, error);
			}
		}

		new Notice(`Global update complete: Processed ${totalProcessed} of ${totalLinksFound} links across ${filesProcessed} notes`);
	}
}
