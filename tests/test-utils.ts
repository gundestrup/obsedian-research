/**
 * Shared test utilities for PubMed Article Fetcher plugin
 * These functions mirror the actual implementation in main.ts
 */

/**
 * Extract PubMed ID from URL or direct input
 */
export function extractPubMedId(input: string): string | null {
	// Extract from URL like https://pubmed.ncbi.nlm.nih.gov/38570095/
	const urlMatch = input.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/);
	if (urlMatch) return urlMatch[1];
	
	// Direct numeric ID
	if (/^\d+$/.test(input)) return input;
	
	return null;
}

/**
 * Extract PMC ID from URL or direct input
 */
export function extractPMCId(input: string): string | null {
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

/**
 * Extract DOI from URL or direct input
 */
export function extractDOI(input: string): string | null {
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
	if (/^10\.\d+\/.+$/.test(input)) return input;
	
	return null;
}

/**
 * Clean DOI by removing prefix
 */
export function cleanDOI(doi: string): string {
	// Remove 'doi: ' prefix if present (case-insensitive)
	return doi.replace(/^doi:\s*/i, '').trim();
}

/**
 * Check if article is already cited in content
 */
export function isAlreadyCited(
	content: string,
	pubmedId?: string,
	doi?: string,
	pmcId?: string
): boolean {
	// Check if content already contains a citation for this article
	if (pubmedId) {
		const escapedPubmedId = pubmedId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const pubmedLinkPattern = new RegExp(`\\[${escapedPubmedId}\\]\\(https://pubmed\\.ncbi\\.nlm\\.nih\\.gov/${escapedPubmedId}/?\\)`, 'i');
		if (pubmedLinkPattern.test(content)) return true;
		
		const pubmedIdPattern = new RegExp(`📚.*\\[.*\\]\\(https://pubmed\\.ncbi\\.nlm\\.nih\\.gov/${escapedPubmedId}/?\\)`, 'i');
		if (pubmedIdPattern.test(content)) return true;
	}
	
	if (doi) {
		const cleanDoi = cleanDOI(doi);
		const escapedDoi = cleanDoi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const doiLinkPattern = new RegExp(`\\[.*\\]\\(https://doi\\.org/${escapedDoi}\\)`, 'i');
		if (doiLinkPattern.test(content)) return true;
		
		const doiPattern = new RegExp(`🔗.*\\[.*\\]\\(https://doi\\.org/${escapedDoi}\\)`, 'i');
		if (doiPattern.test(content)) return true;
	}
	
	if (pmcId) {
		const escapedPmcId = pmcId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const pmcLinkPattern = new RegExp(`\\[📄\\]\\(https://pmc\\.ncbi\\.nlm\\.nih\\.gov/articles/${escapedPmcId}/?\\)`, 'i');
		if (pmcLinkPattern.test(content)) return true;
	}
	
	return false;
}

/**
 * Format citation based on available information
 */
export function formatCitation(info: {
	title: string;
	journal: string;
	year: string;
	pubmedId?: string;
	doi?: string;
	pmcId?: string;
	articleType?: string;
}): string {
	const type = info.articleType || 'Article';
	
	if (info.pubmedId && info.pmcId) {
		// PMC preferred: PubMed + citation links to PubMed, PMC icon links to full text
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

/**
 * Extract all URLs from content
 */
export function extractURLs(content: string): {
	pubmedUrls: string[];
	pmcUrls: string[];
	doiUrls: string[];
} {
	const pubmedMatches = content.match(/https?:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/?/gi) || [];
	const pmcMatches = content.match(/https?:\/\/pmc\.ncbi\.nlm\.nih\.gov\/(?:articles\/)?PMC\d+\/?/gi) || [];
	const doiMatches = content.match(/https?:\/\/(?:dx\.)?doi\.org\/10\.\d{4,9}\/[-._;()/:A-Z0-9]+(?=[\s\])]|$)/gi) || [];
	
	return {
		pubmedUrls: pubmedMatches,
		pmcUrls: pmcMatches,
		doiUrls: doiMatches
	};
}

/**
 * Mock article data for testing
 */
export const mockArticleData = {
	pubmed38570095: {
		pubmedId: '38570095',
		title: 'An introduction to neuropalliative care: A growing need.',
		year: '2024',
		journal: 'Clin Med (Lond)',
		doi: '10.7861/clinmed.2024-0038',
		articleType: 'Journal Article'
	},
	pmc6792392: {
		pubmedId: '30321896',
		pmcId: 'PMC6792392',
		title: 'Neuropalliative Care: A Practical Guide for the Neurologist.',
		year: '2018',
		journal: 'Semin Neurol',
		articleType: 'Journal Article'
	},
	doi10_1016: {
		doi: '10.1016/j.clinme.2024.100038',
		title: 'Test Article Title',
		year: '2024',
		journal: 'Test Journal',
		articleType: 'Article'
	}
};
