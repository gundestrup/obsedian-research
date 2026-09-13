import type { ArticleInfo } from './types';

function containsIgnoreCase(content: string, search: string): boolean {
	return content.toLowerCase().includes(search.toLowerCase());
}

function replaceAnyIgnoreCase(content: string, searches: string[], replacement: string): string {
	const lowerContent = content.toLowerCase();
	const lowerSearches = searches.map((search) => search.toLowerCase());
	let result = '';
	let start = 0;

	while (start < content.length) {
		let matchIndex = -1;
		let matchLength = 0;

		for (let i = 0; i < lowerSearches.length; i++) {
			const index = lowerContent.indexOf(lowerSearches[i], start);
			if (index !== -1 && (matchIndex === -1 || index < matchIndex || (index === matchIndex && lowerSearches[i].length > matchLength))) {
				matchIndex = index;
				matchLength = lowerSearches[i].length;
			}
		}

		if (matchIndex === -1) break;
		result += content.slice(start, matchIndex) + replacement;
		start = matchIndex + matchLength;
	}

	return result + content.slice(start);
}

function hasMarkdownLink(content: string, linkText: string, url: string): boolean {
	const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
	return (
		containsIgnoreCase(content, `[${linkText}](${normalizedUrl})`) ||
		containsIgnoreCase(content, `[${linkText}](${normalizedUrl}/)`)
	);
}

function hasMarkedMarkdownLink(content: string, marker: string, url: string): boolean {
	const lowerContent = content.toLowerCase();
	const lowerMarker = marker.toLowerCase();
	const normalizedUrl = url.toLowerCase().replace(/\/$/, '');
	const linkEnds = [`](${normalizedUrl})`, `](${normalizedUrl}/)`];
	if (!marker) return linkEnds.some((linkEnd) => lowerContent.includes(linkEnd));

	let markerIndex = lowerContent.indexOf(lowerMarker);

	while (markerIndex !== -1) {
		const lineEnd = lowerContent.indexOf(String.fromCharCode(10), markerIndex);
		const linkIndex = linkEnds.reduce((firstIndex, linkEnd) => {
			const index = lowerContent.indexOf(linkEnd, markerIndex);
			return firstIndex === -1 || (index !== -1 && index < firstIndex) ? index : firstIndex;
		}, -1);
		if (linkIndex !== -1 && (lineEnd === -1 || linkIndex < lineEnd)) return true;
		if (!marker) return false;
		markerIndex = lowerContent.indexOf(lowerMarker, markerIndex + lowerMarker.length);
	}

	return false;
}

function hasCitationWithTitleAndYear(content: string, title: string, year: string): boolean {
	const lowerTitle = title.toLowerCase();
	const yearMarker = `- ${year.toLowerCase()}`;

	return content.toLowerCase().split(String.fromCharCode(10)).some((line) => {
		const markerIndex = line.indexOf('📚');
		if (markerIndex === -1) return false;
		const titleIndex = line.indexOf(lowerTitle, markerIndex);
		return titleIndex !== -1 && line.indexOf(yearMarker, titleIndex) !== -1;
	});
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
	const lowerInput = input.toLowerCase();
	const marker = 'doi.org/';
	const markerIndex = lowerInput.indexOf(marker);

	if (markerIndex !== -1) {
		const doiStart = markerIndex + marker.length;
		const terminators = ['#', '?', ' ', String.fromCharCode(9), String.fromCharCode(10), ']', ')'];
		const endIndex = terminators.reduce((end, terminator) => {
			const index = input.indexOf(terminator, doiStart);
			return index !== -1 && index < end ? index : end;
		}, input.length);
		let doi = input.slice(doiStart, endIndex);
		if (doi.endsWith(')') || doi.endsWith('.')) {
			doi = doi.slice(0, -1);
		}
		if (isValidDOI(doi)) return doi;
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
		const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${pubmedId}/`;
		if (hasMarkdownLink(content, pubmedId, pubmedUrl)) return true;
		if (hasMarkedMarkdownLink(content, '📚', pubmedUrl)) return true;
	}

	if (doi) {
		const doiUrl = `https://doi.org/${cleanDOI(doi)}`;
		if (hasMarkedMarkdownLink(content, '', doiUrl)) return true;
		if (hasMarkedMarkdownLink(content, '🔗', doiUrl)) return true;
	}

	if (pmcId) {
		const pmcUrl = `https://pmc.ncbi.nlm.nih.gov/articles/${pmcId}/`;
		if (hasMarkdownLink(content, '📄', pmcUrl)) return true;
	}

	if (title && year && hasCitationWithTitleAndYear(content, title, year)) return true;

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
	return hasMarkedMarkdownLink(content, '', `https://pubmed.ncbi.nlm.nih.gov/${pubmedId}/`);
}

export function isPMCIdCited(content: string, pmcId: string): boolean {
	return hasMarkdownLink(content, '📄', `https://pmc.ncbi.nlm.nih.gov/articles/${pmcId}/`);
}

export function isDOICited(content: string, doi: string): boolean {
	return hasMarkedMarkdownLink(content, '', `https://doi.org/${doi}`);
}

export function replacePubMedUrl(content: string, pubmedId: string, citation: string): string {
	const baseUrl = `pubmed.ncbi.nlm.nih.gov/${pubmedId}`;
	return replaceAnyIgnoreCase(
		content,
		[`https://${baseUrl}/`, `https://${baseUrl}`, `http://${baseUrl}/`, `http://${baseUrl}`],
		citation
	);
}

export function replacePMCUrl(content: string, pmcId: string, citation: string): string {
	const baseUrl = 'pmc.ncbi.nlm.nih.gov';
	const paths = [`/articles/${pmcId}`, `/${pmcId}`];
	const urls: string[] = [];
	for (const path of paths) {
		urls.push(
			`https://${baseUrl}${path}/`,
			`https://${baseUrl}${path}`,
			`http://${baseUrl}${path}/`,
			`http://${baseUrl}${path}`
		);
	}
	return replaceAnyIgnoreCase(content, urls, citation);
}

export function replaceDOIUrl(content: string, doi: string, citation: string): string {
	const doiPath = `/${doi}`;
	return replaceAnyIgnoreCase(content, [`https://dx.doi.org${doiPath}`, `https://doi.org${doiPath}`], citation);
}
