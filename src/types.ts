import type { Plugin } from 'obsidian';

export interface RequestUrlResponse {
	status: number;
	json: unknown;
}

export interface ArticleId {
	idtype: string;
	value: string;
}

export interface PubMedResult {
	title?: string;
	source?: string;
	fulljournalname?: string;
	pubdate?: string;
	doi?: string;
	elocationid?: string;
	articleids?: ArticleId[];
	pubtype?: string[];
}

export interface PubMedSearchResponse {
	esearchresult?: {
		idlist?: string[];
		count?: string;
	};
}

export interface PubMedApiResponse {
	result?: {
		[key: string]: PubMedResult;
	};
}

export interface CrossRefMessage {
	title?: string[];
	'short-container-title'?: string[];
	'container-title'?: string[];
	created?: {
		'date-parts'?: number[][];
	};
	type?: string;
}

export interface CrossRefResponse {
	message?: CrossRefMessage;
}

export interface PubMedFetcherSettings {
	apiKey?: string;
	articleType?: string;
	enableGlobalCommand?: boolean;
}

export interface ArticleInfo {
	title: string;
	journal: string;
	year: string;
	pubmedId?: string;
	doi?: string;
	pmcId?: string;
	articleType?: string;
}

export interface PluginSettingsHolder extends Plugin {
	settings: PubMedFetcherSettings;
	saveSettings(): Promise<void>;
}

export const DEFAULT_SETTINGS: PubMedFetcherSettings = {
	apiKey: '',
	articleType: 'Article',
	enableGlobalCommand: false,
};
