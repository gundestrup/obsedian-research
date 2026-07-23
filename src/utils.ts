import type { ArticleInfo } from './types';

export function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function isValidDOI(doi: string): boolean {
	return /^10\.\d+\/.+$/.test(doi);
}

export function cleanDOI(doi: string): string {
	return doi.replace(/^doi:\s*/i, '').trim();
}

export function extractPubMedId(input: string): string | null {
	const urlMatch = input.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/i);
	if (urlMatch) return urlMatch[1];

	if (/^\d+$/.test(input)) return input;

	return null;
}

export function extractPMCId(input: string): string | null {
	const urlMatch = input.match(/https?:\/\/pmc\.ncbi\.nlm\.nih\.gov\/articles\/(PMC\d+)/i);
	if (urlMatch) return urlMatch[1];

	const simpleUrlMatch = input.match(/https?:\/\/pmc\.ncbi\.nlm\.nih\.gov\/(PMC\d+)/i);
	if (simpleUrlMatch) return simpleUrlMatch[1];

	const directMatch = input.match(/^PMC\d+$/);
	if (directMatch) return input;

	return null;
}

export function extractDOI(input: string): string | null {
	const doiUrlMatch = input.match(/doi\.org\/(10\.\d+\/.+?)(?:[#?]|[\s\])]|$)/i);
	if (doiUrlMatch) {
		let doi = doiUrlMatch[1];
		if (doi.endsWith(')') || doi.endsWith('.')) {
			doi = doi.slice(0, -1);
		}
		return doi;
	}

	if (isValidDOI(input)) return input;

	return null;
}

export function isAlreadyCited(
	content: string,
	pubmedId?: string,
	doi?: string,
	pmcId?: string,
	title?: string,
	year?: string
): boolean {
	if (pubmedId) {
		const escapedPubmedId = escapeRegex(pubmedId);
		const pubmedLinkPattern = new RegExp(
			`\\[${escapedPubmedId}\\]\\(https://pubmed\\.ncbi\\.nlm\\.nih\\.gov/${escapedPubmedId}/?\\)`,
			'i'
		);
		if (pubmedLinkPattern.test(content)) return true;

		const pubmedIdPattern = new RegExp(
			`📚.*\\[.*\\]\\(https://pubmed\\.ncbi\\.nlm\\.nih\\.gov/${escapedPubmedId}/?\\)`,
			'i'
		);
		if (pubmedIdPattern.test(content)) return true;
	}

	if (doi) {
		const cleanDoi = cleanDOI(doi);
		const escapedDoi = escapeRegex(cleanDoi);
		const doiLinkPattern = new RegExp(`\\[.*\\]\\(https://doi\\.org/${escapedDoi}\\)`, 'i');
		if (doiLinkPattern.test(content)) return true;

		const doiPattern = new RegExp(`🔗.*\\[.*\\]\\(https://doi\\.org/${escapedDoi}\\)`, 'i');
		if (doiPattern.test(content)) return true;
	}

	if (pmcId) {
		const escapedPmcId = escapeRegex(pmcId);
		const pmcLinkPattern = new RegExp(
			`\\[📄\\]\\(https://pmc\\.ncbi\\.nlm\\.nih\\.gov/articles/${escapedPmcId}/?\\)`,
			'i'
		);
		if (pmcLinkPattern.test(content)) return true;
	}

	if (title && year) {
		const escapedTitle = escapeRegex(title);
		const titleYearPattern = new RegExp(`📚.*${escapedTitle}.*- ${year}.*`, 'i');
		if (titleYearPattern.test(content)) return true;
	}

	return false;
}

export function formatCitation(info: ArticleInfo): string {
	const type = info.articleType || 'Article';

	if (info.pubmedId && info.pmcId) {
		const pubmedLink = `https://pubmed.ncbi.nlm.nih.gov/${info.pubmedId}/`;
		const pmcLink = `https://pmc.ncbi.nlm.nih.gov/articles/${info.pmcId}/`;
		return `📚 ${type}: [${info.title}](${pubmedLink}) - ${info.year}, ${info.journal} [📄](${pmcLink})`;
	} else if (info.pubmedId && info.doi) {
		const pubmedLink = `https://pubmed.ncbi.nlm.nih.gov/${info.pubmedId}/`;
		const doiLink = `https://doi.org/${cleanDOI(info.doi)}`;
		return `📚 ${type}: [${info.title}](${pubmedLink}) - ${info.year}, ${info.journal} [🔗](${doiLink})`;
	} else if (info.pubmedId) {
		const pubmedLink = `https://pubmed.ncbi.nlm.nih.gov/${info.pubmedId}/`;
		return `📚 ${type}: [${info.title}](${pubmedLink}) - ${info.year}, ${info.journal}`;
	} else if (info.doi) {
		const doiLink = `https://doi.org/${cleanDOI(info.doi)}`;
		return `🔗 ${type}: [${info.title}](${doiLink}) - ${info.year}, ${info.journal}`;
	}
	return '';
}

export interface ExtractedURLs {
	pubmedUrls: string[];
	pmcUrls: string[];
	doiUrls: string[];
}

export function extractURLs(content: string): ExtractedURLs {
	const pubmedMatches = content.match(/https?:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/?/gi) || [];
	const pmcMatches =
		content.match(/https?:\/\/pmc\.ncbi\.nlm\.nih\.gov\/(?:articles\/)?PMC\d+\/?/gi) || [];
	const doiMatches =
		content.match(
			/https?:\/\/(?:dx\.)?doi\.org\/10\.\d{4,9}\/[-._;()/:A-Z0-9]+(?=[\s\])]|$)/gi
		) || [];

	return {
		pubmedUrls: pubmedMatches,
		pmcUrls: pmcMatches,
		doiUrls: doiMatches,
	};
}

export function extractUniqueIds(content: string): {
	pubmedIds: string[];
	pmcIds: string[];
	dois: string[];
} {
	const { pubmedUrls, pmcUrls, doiUrls } = extractURLs(content);

	const pubmedIds = [
		...new Set(pubmedUrls.map((match) => extractPubMedId(match)).filter((id): id is string => id !== null)),
	];
	const pmcIds = [
		...new Set(pmcUrls.map((match) => extractPMCId(match)).filter((id): id is string => id !== null)),
	];
	const dois = [
		...new Set(doiUrls.map((match) => extractDOI(match)).filter((id): id is string => id !== null)),
	];

	return { pubmedIds, pmcIds, dois };
}

export function isPubMedIdCited(content: string, pubmedId: string): boolean {
	const escaped = escapeRegex(pubmedId);
	const pattern = new RegExp(
		`\\[.*\\]\\(https://pubmed\\.ncbi\\.nlm\\.nih\\.gov/${escaped}/?\\)`,
		'i'
	);
	return pattern.test(content);
}

export function isPMCIdCited(content: string, pmcId: string): boolean {
	const escaped = escapeRegex(pmcId);
	const pattern = new RegExp(
		`\\[📄\\]\\(https://pmc\\.ncbi\\.nlm\\.nih\\.gov/articles/${escaped}/?\\)`,
		'i'
	);
	return pattern.test(content);
}

export function isDOICited(content: string, doi: string): boolean {
	const escaped = escapeRegex(doi);
	const pattern = new RegExp(`\\[.*\\]\\(https://doi\\.org/${escaped}\\)`, 'i');
	return pattern.test(content);
}

export function replacePubMedUrl(content: string, pubmedId: string, citation: string): string {
	const pattern = new RegExp(`https?://pubmed\\.ncbi\\.nlm\\.nih\\.gov/${pubmedId}/?`, 'gi');
	return content.replace(pattern, citation);
}

export function replacePMCUrl(content: string, pmcId: string, citation: string): string {
	const escaped = escapeRegex(pmcId);
	const pattern = new RegExp(`https?://pmc\\.ncbi\\.nlm\\.nih\\.gov/(?:articles/)?${escaped}/?`, 'gi');
	return content.replace(pattern, citation);
}

export function replaceDOIUrl(content: string, doi: string, citation: string): string {
	const escaped = escapeRegex(doi);
	const pattern = new RegExp(`https?://(?:dx\\.)?doi\\.org/${escaped}`, 'gi');
	return content.replace(pattern, citation);
}
