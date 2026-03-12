import { App, Plugin, PluginSettingTab, Setting, Modal, Notice, Editor, requestUrl } from 'obsidian';

interface ArticleId {
	idtype: string;
	value: string;
}

interface PubMedResult {
	title?: string;
	source?: string;
	fulljournalname?: string;
	pubdate?: string;
	doi?: string;
	elocationid?: string;
	articleids?: ArticleId[];
	pubtype?: string[];
}

interface PubMedSearchResponse {
	esearchresult?: {
		idlist?: string[];
		count?: string;
	};
}

interface PubMedApiResponse {
	result?: {
		[key: string]: PubMedResult;
	};
}

interface CrossRefMessage {
	title?: string[];
	'short-container-title'?: string[];
	'container-title'?: string[];
	created?: {
		'date-parts'?: number[][];
	};
	type?: string;
}

interface CrossRefResponse {
	message?: CrossRefMessage;
}

interface PubMedFetcherSettings {
	apiKey?: string;
	articleType?: string;
	enableGlobalCommand?: boolean;
}

interface ArticleInfo {
	title: string;
	journal: string;
	year: string;
	pubmedId?: string;
	doi?: string;
	pmcId?: string;
	articleType?: string;
}

const DEFAULT_SETTINGS: PubMedFetcherSettings = {
	apiKey: '',
	articleType: 'Article',
	enableGlobalCommand: false
}

export default class PubMedFetcherPlugin extends Plugin {
	settings!: PubMedFetcherSettings;

	async onload() {
		await this.loadSettings();

		// Add command to create new note with article information
		this.addCommand({
			id: 'fetch-article-note',
			name: 'Create new note with article info',
			callback: () => {
				new ArticleInputModal(this.app, this.settings, (input) => {
					void this.fetchArticle(input);
				}).open();
			}
		});

		// Add command to fetch from selected text
		this.addCommand({
			id: 'fetch-article-selected',
			name: 'Update selected link only',
			editorCallback: (editor: Editor) => {
				const selection = editor.getSelection().trim();
				if (selection) {
					void this.fetchArticleAndInsert(selection, editor);
				} else {
					// eslint-disable-next-line obsidianmd/ui/sentence-case -- PubMed and DOI are proper nouns
					new Notice('Please select a PubMed ID or DOI first');
				}
			}
		});

		// Add command to process all PubMed/DOI links in current note
		this.addCommand({
			id: 'fetch-article-all',
			name: 'Update all links in current note',
			editorCallback: (editor: Editor) => {
				void this.fetchAllArticlesInNote(editor);
			}
		});

		// Add command to process all PubMed/DOI links in all notes in vault (only if enabled in settings)
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

		// Add editor menu option
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				const selection = editor.getSelection().trim();
				if (selection && (this.extractPubMedId(selection) || this.extractDOI(selection) || this.extractPMCId(selection))) {
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

		// Add settings tab
		this.addSettingTab(new PubMedFetcherSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as PubMedFetcherSettings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private handleError(error: unknown, context: string): void {
		console.error(`Error in ${context}:`, error);
		const message = error instanceof Error ? error.message : 'Unknown error occurred';
		new Notice(`Error fetching article: ${message}`);
	}

	private async delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	private isAlreadyCited(content: string, pubmedId?: string, doi?: string, pmcId?: string, title?: string, year?: string): boolean {
		// Check if content already contains a citation for this article
		if (pubmedId) {
			// Look for PubMed link in citation format
			const escapedPubmedId = pubmedId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const pubmedLinkPattern = new RegExp(`\\[${escapedPubmedId}\\]\\(https://pubmed\\.ncbi\\.nlm\\.nih\\.gov/${escapedPubmedId}/?\\)`, 'i');
			if (pubmedLinkPattern.test(content)) return true;
			
			// Look for PubMed ID in citation format
			const pubmedIdPattern = new RegExp(`📚.*\\[.*\\]\\(https://pubmed\\.ncbi\\.nlm\\.nih\\.gov/${escapedPubmedId}/?\\)`, 'i');
			if (pubmedIdPattern.test(content)) return true;
		}
		
		if (doi) {
			// Look for DOI link in citation format
			const cleanDoi = this.cleanDOI(doi);
			const escapedDoi = cleanDoi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const doiLinkPattern = new RegExp(`\\[.*\\]\\(https://doi\\.org/${escapedDoi}\\)`, 'i');
			if (doiLinkPattern.test(content)) return true;
			
			// Look for DOI in citation format
			const doiPattern = new RegExp(`🔗.*\\[.*\\]\\(https://doi\\.org/${escapedDoi}\\)`, 'i');
			if (doiPattern.test(content)) return true;
		}
		
		if (pmcId) {
			// Look for PMC link in citation format
			const escapedPmcId = pmcId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const pmcLinkPattern = new RegExp(`\\[📄\\]\\(https://pmc\\.ncbi\\.nlm\\.nih\\.gov/articles/${escapedPmcId}/?\\)`, 'i');
			if (pmcLinkPattern.test(content)) return true;
		}
		
		// Enhanced detection: Check if title and year already appear in citation format
		if (title && year) {
			// Escape special characters in title for regex
			const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			// Look for citation with this title and year (with or without links)
			const titleYearPattern = new RegExp(`📚.*${escapedTitle}.*- ${year}.*`, 'i');
			if (titleYearPattern.test(content)) return true;
		}
		
		return false;
	}

	private hasCitationFormat(content: string): boolean {
		// Check if content already contains any citation format (both complete and incomplete)
		const citationPatterns = [
			// Complete citations with links
			/📚.*\[.*\]\(https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/?\)/i,
			/🔗.*\[.*\]\(https:\/\/doi\.org\/10\.\d+\/.+\)/i,
			/\[📄\]\(https:\/\/pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC\d+\/?\)/i,
			// Incomplete citations without links (just the format)
			/📚.*Journal Article:.*- \d{4},.*🔗?$/i,
			/📚.*Article:.*- \d{4},.*📄?$/i,
			/📚.*Review:.*- \d{4},.*$/i
		];
		
		return citationPatterns.some(pattern => pattern.test(content));
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

	private extractPMCId(input: string): string | null {
		// Extract from URL like https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/
		const urlMatch = input.match(/https?:\/\/pmc\.ncbi\.nlm\.nih\.gov\/articles\/(PMC\d+)/);
		if (urlMatch) return urlMatch[1];
		
		// Extract from simpler URL like https://pmc.ncbi.nlm.nih.gov/PMC6792392/
		const simpleUrlMatch = input.match(/https?:\/\/pmc\.ncbi\.nlm\.nih\.gov\/(PMC\d+)/);
		if (simpleUrlMatch) return simpleUrlMatch[1];
		
		// Direct PMC ID like PMC6792392
		const directMatch = input.match(/^PMC\d+$/);
		if (directMatch) return input;
		
		return null;
	}

	private extractDOI(input: string): string | null {
		// Extract from URL like https://doi.org/10.1016/j.clinme.2024.100038
		// Handle both standalone URLs and URLs in markdown links
		const doiUrlMatch = input.match(/doi\.org\/(10\.\d+\/.+?)(?:[#?]|[\s\])]|$)/);
		if (doiUrlMatch) {
			let doi = doiUrlMatch[1];
			// Remove trailing closing parenthesis if it exists (from markdown links)
			if (doi.endsWith(')')) {
				doi = doi.slice(0, -1);
			}
			return doi;
		}
		
		// Direct DOI
		if (this.isValidDOI(input)) return input;
		
		return null;
	}

	private async findPubMedIdFromPMC(pmcId: string): Promise<string | null> {
		const apiKey = this.settings.apiKey;
		// Use a more specific search to find the correct PubMed ID for this PMC ID
		const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term="${pmcId}"[pmcid]&retmode=json${apiKey ? `&api_key=${apiKey}` : ''}`;

		try {
			const response = await requestUrl({ url });
			const json = response.json as PubMedSearchResponse;
			if (json.esearchresult && json.esearchresult.idlist && json.esearchresult.idlist.length > 0) {
				return json.esearchresult.idlist[0];
			}
		} catch (error) {
			console.error('Error searching PubMed for PMC ID:', error);
		}
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

			const response = await requestUrl({ url: `${baseUrl}?${params}` });
			
			if (response.status !== 200) {
				return null;
			}

			const data = response.json as PubMedSearchResponse;
			const idList = data.esearchresult?.idlist;
			
			return idList && idList.length > 0 ? idList[0] : null;
		} catch (error) {
			console.error('Error searching PubMed by DOI:', error);
			return null;
		}
	}

	private parsePubMedResult(result: PubMedResult, pubmedId: string): ArticleInfo {
		let doi = '';
		let pmcId = '';
		
		// Extract DOI from multiple possible locations
		if (result.doi) {
			doi = result.doi;
		} else if (result.elocationid) {
			doi = result.elocationid;
		}
		
		// Check articleids array for both DOI and PMC ID
		if (result.articleids) {
			const doiObj = result.articleids.find((id) => id.idtype === 'doi');
			if (doiObj && !doi) {
				doi = this.cleanDOI(doiObj.value);
			}
			
			// Extract PMC ID from articleids
			const pmcObj = result.articleids.find((id) => id.idtype === 'pmc');
			if (pmcObj) {
				pmcId = pmcObj.value;
				// Ensure PMC prefix is present
				if (!pmcId.startsWith('PMC')) {
					pmcId = 'PMC' + pmcId;
				}
			}
		}
		
		return {
			title: result.title || 'No title available',
			journal: result.source || result.fulljournalname || 'No journal available',
			year: result.pubdate ? result.pubdate.split(' ')[0] : 'No year available',
			pubmedId: pubmedId,
			doi: doi,
			pmcId: pmcId,
			articleType: result.pubtype?.[0] || this.settings.articleType || 'Article'
		};
	}

	private async fetchPubMedApiData(pubmedId: string): Promise<ArticleInfo> {
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

		const response = await requestUrl({ url: `${baseUrl}?${params}` });
		
		if (response.status !== 200) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = response.json as PubMedApiResponse;
		const result = data.result?.[pubmedId];

		if (!result) {
			throw new Error('Article not found');
		}

		return this.parsePubMedResult(result, pubmedId);
	}

	async fetchArticle(input: string) {
		const trimmedInput = input.trim();
		
		// Try to extract PubMed ID from URL or direct input
		const pubmedId = this.extractPubMedId(trimmedInput);
		if (pubmedId) {
			await this.fetchByPubMedId(pubmedId);
			return;
		}
		
		// Try to extract PMC ID from URL or direct input
		const pmcId = this.extractPMCId(trimmedInput);
		if (pmcId) {
			new Notice(`PMC ID found: ${pmcId}. Searching for corresponding PubMed ID...`);
			const pubmedId = await this.findPubMedIdFromPMC(pmcId);
			if (pubmedId) {
				await this.fetchByPubMedIdWithPMC(pubmedId, pmcId);
			} else {
				// eslint-disable-next-line obsidianmd/ui/sentence-case -- PubMed and PMC are proper nouns
				new Notice('Could not find PubMed ID for the given PMC ID.');
			}
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
		
		// eslint-disable-next-line obsidianmd/ui/sentence-case -- PubMed and DOI are proper nouns
		new Notice('Invalid input. Please enter a valid PubMed ID, DOI, or URL');
	}

	async fetchArticleAndInsert(input: string, editor: Editor) {
		const trimmedInput = input.trim();
		
		// Try to extract PubMed ID from URL or direct input
		const pubmedId = this.extractPubMedId(trimmedInput);
		if (pubmedId) {
			await this.fetchByPubMedIdAndInsert(pubmedId, editor);
			return;
		}
		
		// Try to extract PMC ID from URL or direct input
		const pmcId = this.extractPMCId(trimmedInput);
		if (pmcId) {
			const pubmedId = await this.findPubMedIdFromPMC(pmcId);
			if (pubmedId) {
				const articleInfo = await this.fetchPubMedApiData(pubmedId);
				articleInfo.pmcId = pmcId;
				this.insertArticleInfo(articleInfo, editor);
			} else {
				// eslint-disable-next-line obsidianmd/ui/sentence-case -- PubMed and PMC are proper nouns
				new Notice('Could not find PubMed ID for the given PMC ID.');
			}
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
		
		// eslint-disable-next-line obsidianmd/ui/sentence-case -- PubMed, PMC, and DOI are proper nouns
		new Notice('Invalid input. Please enter a valid PubMed ID, PMC ID, DOI, or URL');
	}

	async fetchByPubMedId(pubmedId: string) {
		try {
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- PubMed is a proper noun
			new Notice('Fetching article from PubMed');
			const articleInfo = await this.fetchPubMedApiData(pubmedId);
			void this.displayArticleInfo(articleInfo);
		} catch (error) {
			this.handleError(error, 'fetchByPubMedId');
		}
	}

	async fetchByPubMedIdAndInsert(pubmedId: string, editor: Editor) {
		try {
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- PubMed is a proper noun
			new Notice('Fetching article from PubMed');
			const articleInfo = await this.fetchPubMedApiData(pubmedId);
			this.insertArticleInfo(articleInfo, editor);
		} catch (error) {
			this.handleError(error, 'fetchByPubMedIdAndInsert');
		}
	}

	private async fetchDOIApiData(doi: string) {
		const baseUrl = 'https://api.crossref.org/works/' + encodeURIComponent(doi);
		
		const response = await requestUrl({ url: baseUrl });
		
		if (response.status !== 200) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = response.json as CrossRefResponse;
		const message = data.message;

		if (!message) {
			throw new Error('Article not found');
		}

		return {
			title: message.title?.[0] || 'No title available',
			journal: message['short-container-title']?.[0] || message['container-title']?.[0] || 'No journal available',
			year: message.created?.['date-parts']?.[0]?.[0]?.toString() || 'No year available',
			doi: doi,
			pubmedId: undefined, // DOI-only articles don't have PubMed ID
			pmcId: undefined,    // DOI-only articles don't have PMC ID
			articleType: message.type || this.settings.articleType || 'Article'
		};
	}

	async fetchByDOI(doi: string) {
		try {
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- DOI is a proper noun
			new Notice('Fetching article from DOI');
			const articleInfo = await this.fetchDOIApiData(doi);
			void this.displayArticleInfo(articleInfo);
		} catch (error) {
			this.handleError(error, 'fetchByDOI');
		}
	}

	async fetchByDOIAndInsert(doi: string, editor: Editor) {
		try {
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- DOI is a proper noun
			new Notice('Fetching article from DOI');
			const articleInfo = await this.fetchDOIApiData(doi);
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
		
		await this.app.vault.create(fileName, content);
		
		new Notice(`Article information saved to ${fileName}`);
	}

	insertArticleInfo(info: ArticleInfo, editor: Editor) {
		const citation = this.formatCitation(info);
		editor.replaceSelection(citation);
		new Notice('Article information inserted');
	}

	async fetchByPubMedIdWithPMC(pubmedId: string, pmcId: string) {
		try {
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- PubMed is a proper noun
			new Notice('Fetching article from PubMed');
			const articleInfo = await this.fetchPubMedApiData(pubmedId);
			// Override PMC ID with the one provided (in case it wasn't in the API response)
			articleInfo.pmcId = pmcId;
			void this.displayArticleInfo(articleInfo);
		} catch (error) {
			this.handleError(error, 'fetchByPubMedIdWithPMC');
		}
	}

	async fetchByPubMedIdWithDOI(pubmedId: string, doi: string) {
		try {
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- PubMed is a proper noun
			new Notice('Fetching article from PubMed');
			const articleInfo = await this.fetchPubMedApiData(pubmedId);
			// Override DOI with the one provided (in case it's different)
			articleInfo.doi = doi;
			void this.displayArticleInfo(articleInfo);
		} catch (error) {
			this.handleError(error, 'fetchByPubMedIdWithDOI');
		}
	}

	async fetchByPubMedIdAndInsertWithDOI(pubmedId: string, doi: string, editor: Editor) {
		try {
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- PubMed is a proper noun
			new Notice('Fetching article from PubMed');
			const articleInfo = await this.fetchPubMedApiData(pubmedId);
			// Override DOI with the one provided (in case it's different)
			articleInfo.doi = doi;
			this.insertArticleInfo(articleInfo, editor);
		} catch (error) {
			this.handleError(error, 'fetchByPubMedIdAndInsertWithDOI');
		}
	}

	async fetchAllArticlesInNote(editor: Editor) {
		let content = editor.getValue();
		
		// Find all PubMed URLs, PMC URLs, and DOI URLs in the note (only actual URLs, not random numbers)
		const pubmedMatches = content.match(/https?:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/?/gi) || [];
		const pmcMatches = content.match(/https?:\/\/pmc\.ncbi\.nlm\.nih\.gov\/(?:articles\/)?PMC\d+\/?/gi) || [];
		const doiMatches = content.match(/https?:\/\/(?:dx\.)?doi\.org\/10\.\d{4,9}\/[-._;()/:A-Z0-9]+(?=[\s\])]|$)/gi) || [];
		
		// Extract unique IDs
		const pubmedIds = [...new Set(pubmedMatches.map(match => this.extractPubMedId(match)).filter((id): id is string => id !== null))];
		const pmcIds = [...new Set(pmcMatches.map(match => this.extractPMCId(match)).filter((id): id is string => id !== null))];
		const dois = [...new Set(doiMatches.map(match => this.extractDOI(match)).filter((id): id is string => id !== null))];
		
		const totalLinks = pubmedIds.length + pmcIds.length + dois.length;
		
		if (totalLinks === 0) {
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- PubMed, PMC, and DOI are proper nouns
			new Notice('No PubMed IDs, PMC IDs, or DOIs found in this note');
			return;
		}
		
		new Notice(`Found ${totalLinks} links to process in current note`);
		
		let processedCount = 0;
		
		// Process PubMed IDs
		for (const pubmedId of pubmedIds) {
			try {
				// Quick check: if PubMed ID already appears in a citation link, skip it
				const escapedPubmedId = pubmedId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				const quickCheckPattern = new RegExp(`\\[.*\\][\\(]https://pubmed\\.ncbi\\.nlm\\.nih\\.gov/${escapedPubmedId}/?[\\)]`, 'i');
				if (quickCheckPattern.test(content)) {
					console.debug(`PubMed ID ${pubmedId} already cited, skipping`);
					continue;
				}
				
				// Not already cited, fetch article data
				const info = await this.fetchPubMedApiData(pubmedId);
				if (info && !this.isAlreadyCited(content, info.pubmedId, info.doi, info.pmcId, info.title, info.year)) {
					const citation = this.formatCitation(info);
					const urlPattern = new RegExp(`https?://pubmed\\.ncbi\\.nlm\\.nih\\.gov/${pubmedId}/?`, 'gi');
					content = content.replace(urlPattern, citation);
					processedCount++;
				} else if (info && this.isAlreadyCited(content, info.pubmedId, info.doi, info.pmcId, info.title, info.year)) {
					console.debug(`PubMed ID ${pubmedId} already cited (after fetch), skipping`);
				}
				// Add delay to prevent rate limiting
				await this.delay(350);
			} catch (error) {
				console.error(`Error processing PubMed ID ${pubmedId}:`, error);
			}
		}
		
		// Process PMC IDs
		for (const pmcId of pmcIds) {
			try {
				console.debug(`Processing PMC ID: ${pmcId}`);
				
				// Quick check: if PMC ID already appears in a citation link, skip it
				const escapedPmcId = pmcId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				const quickCheckPattern = new RegExp(`\\[📄\\][\\(]https://pmc\\.ncbi\\.nlm\\.nih\\.gov/articles/${escapedPmcId}/?[\\)]`, 'i');
				if (quickCheckPattern.test(content)) {
					console.debug(`  ⏭️  PMC ID ${pmcId} already cited, skipping`);
					continue;
				}
				
				// Not already cited, proceed with conversion
				const pubmedId = await this.findPubMedIdFromPMC(pmcId);
				console.debug(`  Found PubMed ID: ${pubmedId}`);
				// Add delay after PMC lookup to prevent rate limiting
				await this.delay(350);
				
				if (pubmedId) {
					const info = await this.fetchPubMedApiData(pubmedId);
					// Add delay after article data fetch
					await this.delay(350);
					
					if (info) {
						console.debug(`  Article: ${info.title}`);
						const articleInfo = {
							...info,
							pmcId: pmcId // Add PMC ID for proper citation formatting
						};
						// Check if this article is already cited in the content
						const alreadyCited = this.isAlreadyCited(content, articleInfo.pubmedId, articleInfo.doi, articleInfo.pmcId, articleInfo.title, articleInfo.year);
						console.debug(`  Already cited: ${alreadyCited}`);
						if (!alreadyCited) {
							const citation = this.formatCitation(articleInfo);
							const urlPattern = new RegExp(`https?://pmc\\.ncbi\\.nlm\\.nih\\.gov/(?:articles/)?${escapedPmcId}/?`, 'gi');
							content = content.replace(urlPattern, citation);
							processedCount++;
							console.debug(`  ✅ Processed PMC ${pmcId}`);
						} else {
							console.debug(`  ⏭️  PMC ID ${pmcId} already cited (after fetch), skipping`);
						}
					} else {
						console.debug(`  ❌ No article info found for PubMed ID ${pubmedId}`);
					}
				} else {
					console.debug(`  ❌ No PubMed ID found for PMC ${pmcId}`);
				}
			} catch (error) {
				console.error(`❌ Error processing PMC ID ${pmcId}:`, error);
			}
		}
		
		// Process DOIs
		for (const doi of dois) {
			try {
				// Quick check: if DOI already appears in a citation link, skip it
				const escapedDoi = doi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				const quickCheckPattern = new RegExp(`\\[.*\\][\\(]https://doi\\.org/${escapedDoi}[\\)]`, 'i');
				if (quickCheckPattern.test(content)) {
					console.debug(`DOI ${doi} already cited, skipping`);
					continue;
				}
				
				// Not already cited, fetch article data
				const info = await this.fetchDOIApiData(doi);
				// Check if this DOI is already cited in the content
				if (!this.isAlreadyCited(content, info.pubmedId, info.doi, info.pmcId, info.title, info.year)) {
					const citation = this.formatCitation(info);
					const urlPattern = new RegExp(`https?://(?:dx\\.)?doi\\.org/${escapedDoi}`, 'gi');
					content = content.replace(urlPattern, citation);
					processedCount++;
				} else {
					console.debug(`DOI ${doi} already cited (after fetch), skipping`);
				}
				// Add delay to prevent rate limiting
				await this.delay(350);
			} catch (error) {
				console.error(`Error processing DOI ${doi}:`, error);
			}
		}
		
		// Replace the entire content if changes were made
		if (processedCount > 0) {
			editor.setValue(content);
		}
		
		new Notice(`Successfully processed ${processedCount} of ${totalLinks} links in current note`);
	}

	async fetchAllArticlesInVault(selectedFolder?: string) {
		let files = this.app.vault.getMarkdownFiles();
		
		// Filter files by selected folder if specified
		if (selectedFolder && selectedFolder !== '/') {
			files = files.filter(file => file.path.startsWith(selectedFolder));
		}
		
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
				
				// Find all PubMed URLs, PMC URLs, and DOI URLs in the note
				const pubmedMatches = content.match(/https?:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/?/gi) || [];
				const pmcMatches = content.match(/https?:\/\/pmc\.ncbi\.nlm\.nih\.gov\/(?:articles\/)?PMC\d+\/?/gi) || [];
				const doiMatches = content.match(/https?:\/\/(?:dx\.)?doi\.org\/10\.\d{4,9}\/[-._;()/:A-Z0-9]+(?=[\s\])]|$)/gi) || [];
				
				// Extract unique IDs
				const pubmedIds = [...new Set(pubmedMatches.map(match => this.extractPubMedId(match)).filter((id): id is string => id !== null))];
				const pmcIds = [...new Set(pmcMatches.map(match => this.extractPMCId(match)).filter((id): id is string => id !== null))];
				const dois = [...new Set(doiMatches.map(match => this.extractDOI(match)).filter((id): id is string => id !== null))];
				
				const linksInFile = pubmedIds.length + pmcIds.length + dois.length;
				
				if (linksInFile === 0) {
					continue; // Skip files with no links
				}
				
				totalLinksFound += linksInFile;
				filesProcessed++;
				
				// We need to modify the file content directly since we don't have an editor
				let modifiedContent = content;
				
				// Process PubMed IDs
				for (const pubmedId of pubmedIds) {
					try {
						// Quick check: if PubMed ID already appears in a citation link, skip it
						const escapedPubmedId = pubmedId.replace(/[.*+?^${}()|[\]\\]/g, '$&');
						const quickCheckPattern = new RegExp(`[.*](https://pubmed\\.ncbi\\.nlm\\.nih\\.gov/${escapedPubmedId}/?)`, 'i');
						if (quickCheckPattern.test(modifiedContent)) {
							console.debug(`PubMed ID ${pubmedId} already cited in ${file.path}, skipping`);
							continue;
						}
						
						const info = await this.fetchPubMedApiData(pubmedId);
						if (info && !this.isAlreadyCited(modifiedContent, info.pubmedId, info.doi, info.pmcId, info.title, info.year)) {
							const citation = this.formatCitation(info);
							const urlPattern = new RegExp(`https?://pubmed\\.ncbi\\.nlm\\.nih\\.gov/${pubmedId}/?`, 'gi');
							modifiedContent = modifiedContent.replace(urlPattern, citation);
							totalProcessed++;
						} else if (info && this.isAlreadyCited(modifiedContent, info.pubmedId, info.doi, info.pmcId, info.title, info.year)) {
							console.debug(`PubMed ID ${pubmedId} already cited in ${file.path} (after fetch), skipping`);
						}
						// Add delay to prevent rate limiting
						await this.delay(350);
					} catch (error) {
						console.error(`Error processing PubMed ID ${pubmedId} in ${file.path}:`, error);
					}
				}
				
				// Process PMC IDs
				for (const pmcId of pmcIds) {
					try {
						// Quick check: if PMC ID already appears in a citation link, skip it
						const escapedPmcId = pmcId.replace(/[.*+?^${}()|[\]\\]/g, '$&');
						const quickCheckPattern = new RegExp(`[📄](https://pmc\\.ncbi\\.nlm\\.nih\\.gov/articles/${escapedPmcId}/?)`, 'i');
						if (quickCheckPattern.test(modifiedContent)) {
							console.debug(`PMC ID ${pmcId} already cited in ${file.path}, skipping`);
							continue;
						}
						
						const pubmedId = await this.findPubMedIdFromPMC(pmcId);
						// Add delay after PMC lookup
						await this.delay(350);
						
						if (pubmedId) {
							const info = await this.fetchPubMedApiData(pubmedId);
							// Add delay after article data fetch
							await this.delay(350);
							
							if (info) {
								const articleInfo = {
									...info,
									pmcId: pmcId // Add PMC ID for proper citation formatting
								};
								// Check if this article is already cited in the content
								if (!this.isAlreadyCited(modifiedContent, articleInfo.pubmedId, articleInfo.doi, articleInfo.pmcId, articleInfo.title, articleInfo.year)) {
									const citation = this.formatCitation(articleInfo);
									const escapedPmcId = pmcId.replace(/[.*+?^${}()|[\]\\]/g, '$&');
									const urlPattern = new RegExp(`https?://pmc\\.ncbi\\.nlm\\.nih\\.gov/(?:articles/)?${escapedPmcId}/?`, 'gi');
									modifiedContent = modifiedContent.replace(urlPattern, citation);
									totalProcessed++;
								} else {
									console.debug(`PMC ID ${pmcId} already cited in ${file.path}, skipping`);
								}
							}
						}
					} catch (error) {
						console.error(`Error processing PMC ID ${pmcId} in ${file.path}:`, error);
					}
				}
				
				// Process DOIs
				for (const doi of dois) {
					try {
						// Quick check: if DOI already appears in a citation link, skip it
						const escapedDoi = doi.replace(/[.*+?^${}()|[\]\\]/g, '$&');
						const quickCheckPattern = new RegExp(`[.*](https://doi\\.org/${escapedDoi})`, 'i');
						if (quickCheckPattern.test(modifiedContent)) {
							console.debug(`DOI ${doi} already cited in ${file.path}, skipping`);
							continue;
						}
						
						const info = await this.fetchDOIApiData(doi);
						// Check if this DOI is already cited in the content
						if (!this.isAlreadyCited(modifiedContent, info.pubmedId, info.doi, info.pmcId, info.title, info.year)) {
							const citation = this.formatCitation(info);
							const escapedDoi = doi.replace(/[.*+?^${}()|[\\]]/g, '\\$&');
							const urlPattern = new RegExp(`https?://(?:dx\\.)?doi\\.org/${escapedDoi}`, 'gi');
							modifiedContent = modifiedContent.replace(urlPattern, citation);
							totalProcessed++;
						} else {
							console.debug(`DOI ${doi} already cited in ${file.path}, skipping`);
						}
						// Add delay to prevent rate limiting
						await this.delay(350);
					} catch (error) {
						console.error(`Error processing DOI ${doi} in ${file.path}:`, error);
					}
				}
				
				// Write back the modified content
				if (modifiedContent !== content) {
					await this.app.vault.modify(file, modifiedContent);
				}
				
			} catch (error) {
				console.error(`Error processing file ${file.path}:`, error);
			}
		}
		
		new Notice(`Global update complete: Processed ${totalProcessed} of ${totalLinksFound} links across ${filesProcessed} notes`);
	}

	formatCitation(info: ArticleInfo): string {
		const type = info.articleType || 'Article';
		
		if (info.pubmedId && info.pmcId) {
			// PMC preferred: PubMed + citation links to PubMed, PMC icon links to full text
			const pubmedLink = `https://pubmed.ncbi.nlm.nih.gov/${info.pubmedId}/`;
			const pmcLink = `https://pmc.ncbi.nlm.nih.gov/articles/${info.pmcId}/`;
			return `📚 ${type}: [${info.title}](${pubmedLink}) - ${info.year}, ${info.journal} [📄](${pmcLink})`;
		} else if (info.pubmedId && info.doi) {
			const pubmedLink = `https://pubmed.ncbi.nlm.nih.gov/${info.pubmedId}/`;
			const doiLink = `https://doi.org/${this.cleanDOI(info.doi)}`;
			return `📚 ${type}: [${info.title}](${pubmedLink}) - ${info.year}, ${info.journal} [🔗](${doiLink})`;
		} else if (info.pubmedId) {
			const pubmedLink = `https://pubmed.ncbi.nlm.nih.gov/${info.pubmedId}/`;
			return `📚 ${type}: [${info.title}](${pubmedLink}) - ${info.year}, ${info.journal}`;
		} else if (info.doi) {
			const doiLink = `https://doi.org/${this.cleanDOI(info.doi)}`;
			return `🔗 ${type}: [${info.title}](${doiLink}) - ${info.year}, ${info.journal}`;
		}
		return '';
	}
}

class FolderSelectionModal extends Modal {
	onSubmit: (folder: string) => void;

	constructor(app: App, onSubmit: (folder: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Select folder for global update' });
		
	contentEl.createEl('p', { 
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- PubMed and DOI are proper nouns
			text: '⚠️ This will update ALL PubMed/DOI links in the selected folder and its subfolders.',
			cls: 'mod-warning'
		});

		// Get all folders in vault
		const allFiles = this.app.vault.getAllLoadedFiles();
		const folders = allFiles
			.filter(f => 'children' in f)
			.map(f => f.path)
			.sort();

		// Add "All notes" option
		const allNotesBtn = contentEl.createEl('button', { 
				// eslint-disable-next-line obsidianmd/ui/sentence-case -- Sentence case is correct here
				text: '📁 All notes in vault',
			cls: 'mod-cta'
		});
		allNotesBtn.setCssProps({ width: '100%', marginBottom: '10px' });
		allNotesBtn.onclick = () => {
			this.onSubmit('/');
			this.close();
		};

		contentEl.createEl('p', { text: 'Or select a specific folder' });

		// Create folder list
		const folderList = contentEl.createEl('div', { cls: 'folder-list' });
		folderList.setCssProps({
			maxHeight: '300px',
			overflowY: 'auto',
			border: '1px solid var(--background-modifier-border)',
			borderRadius: '4px',
			padding: '8px'
		});

		if (folders.length === 0) {
			folderList.createEl('p', { text: 'No folders found in the vault' });
		} else {
			folders.forEach(folder => {
				const folderBtn = folderList.createEl('button', { 
					text: `📁 ${folder || '(root)'}`,
				});
				folderBtn.setCssProps({ width: '100%', marginBottom: '4px', textAlign: 'left' });
				folderBtn.onclick = () => {
					this.onSubmit(folder);
					this.close();
				};
			});
		}

		// Cancel button
		const cancelBtn = contentEl.createEl('button', { text: 'Cancel' });
		cancelBtn.setCssProps({ marginTop: '10px' });
		cancelBtn.onclick = () => {
			this.close();
		};
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
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
		// eslint-disable-next-line obsidianmd/ui/sentence-case -- PubMed and DOI are proper nouns
		contentEl.createEl('h2', { text: 'Enter PubMed ID or DOI' });

		const input = contentEl.createEl('input', {
			type: 'text',
			placeholder: 'PubMed ID (e.g., 38570095) or DOI (e.g., 10.1016/j.clinme.2024.100038)'
		});
		input.setCssProps({ width: '100%', marginBottom: '20px' });

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

class PubMedFetcherSettingTab extends PluginSettingTab {
	plugin: PubMedFetcherPlugin;

	constructor(app: App, plugin: PubMedFetcherPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		;

		new Setting(containerEl)
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- NCBI is a proper noun
			.setName('NCBI API key (optional)')
			.setDesc('Enter your NCBI API key for higher rate limits. Get one at https://www.ncbi.nlm.nih.gov/account/')
			.addText(text => text
				// eslint-disable-next-line obsidianmd/ui/sentence-case -- NCBI is a proper noun
				.setPlaceholder('Your NCBI API key')
				.setValue(this.plugin.settings.apiKey || '')
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Enable global update command')
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- ALL is emphasized for warning
			.setDesc('⚠️ DANGEROUS: Enable the "Link Global" command that can update ALL notes in your vault. This command will modify multiple files. Only enable if you understand the risks and have backups.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableGlobalCommand || false)
				.onChange(async (value) => {
					this.plugin.settings.enableGlobalCommand = value;
					await this.plugin.saveSettings();
					new Notice(`Global command ${value ? 'enabled' : 'disabled'}. Please reload Obsidian for changes to take effect.`);
				}));
	}
}
