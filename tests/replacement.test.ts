/**
 * Unit tests for URL replacement helpers
 */

import { describe, it, expect } from 'vitest';
import {
	replacePubMedUrl,
	replacePMCUrl,
	replaceDOIUrl,
} from '../src/utils';

describe('replacePubMedUrl', () => {
	it('should replace bare URL with citation', () => {
		const content = 'See https://pubmed.ncbi.nlm.nih.gov/38570095/ for details';
		const result = replacePubMedUrl(content, '38570095', '📚 [Article](https://pubmed.ncbi.nlm.nih.gov/38570095/)');
		expect(result).toBe('See 📚 [Article](https://pubmed.ncbi.nlm.nih.gov/38570095/) for details');
	});

	it('should replace URL inside Markdown link', () => {
		const content = 'See [link](https://pubmed.ncbi.nlm.nih.gov/38570095/) for details';
		const result = replacePubMedUrl(content, '38570095', '📚 Citation');
		expect(result).toBe('See [link](📚 Citation) for details');
	});

	it('should replace URL without trailing slash', () => {
		const content = 'See https://pubmed.ncbi.nlm.nih.gov/38570095 for details';
		const result = replacePubMedUrl(content, '38570095', 'CITATION');
		expect(result).toBe('See CITATION for details');
	});

	it('should replace HTTP variant', () => {
		const content = 'See http://pubmed.ncbi.nlm.nih.gov/38570095/ for details';
		const result = replacePubMedUrl(content, '38570095', 'CITATION');
		expect(result).toBe('See CITATION for details');
	});

	it('should replace all occurrences of repeated IDs', () => {
		const content = 'https://pubmed.ncbi.nlm.nih.gov/38570095/ and https://pubmed.ncbi.nlm.nih.gov/38570095/';
		const result = replacePubMedUrl(content, '38570095', 'CITATION');
		expect(result).toBe('CITATION and CITATION');
	});

	it('should not replace different PubMed IDs', () => {
		const content = 'https://pubmed.ncbi.nlm.nih.gov/38570095/ and https://pubmed.ncbi.nlm.nih.gov/12345/';
		const result = replacePubMedUrl(content, '38570095', 'CITATION');
		expect(result).toBe('CITATION and https://pubmed.ncbi.nlm.nih.gov/12345/');
	});

	it('should handle URL with fragment', () => {
		const content = 'See https://pubmed.ncbi.nlm.nih.gov/38570095/#abstract for details';
		const result = replacePubMedUrl(content, '38570095', 'CITATION');
		expect(result).toBe('See CITATION#abstract for details');
	});

	it('should handle URL with query string', () => {
		const content = 'See https://pubmed.ncbi.nlm.nih.gov/38570095/?ref=foo for details';
		const result = replacePubMedUrl(content, '38570095', 'CITATION');
		expect(result).toBe('See CITATION?ref=foo for details');
	});
});

describe('replacePMCUrl', () => {
	it('should replace articles/ URL with citation', () => {
		const content = 'See https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/ for details';
		const result = replacePMCUrl(content, 'PMC6792392', '📄 Citation');
		expect(result).toBe('See 📄 Citation for details');
	});

	it('should replace simple PMC URL', () => {
		const content = 'See https://pmc.ncbi.nlm.nih.gov/PMC6792392/ for details';
		const result = replacePMCUrl(content, 'PMC6792392', 'CITATION');
		expect(result).toBe('See CITATION for details');
	});

	it('should replace all occurrences of repeated PMC IDs', () => {
		const content = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/ and https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/';
		const result = replacePMCUrl(content, 'PMC6792392', 'CITATION');
		expect(result).toBe('CITATION and CITATION');
	});

	it('should not replace different PMC IDs', () => {
		const content = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/ and https://pmc.ncbi.nlm.nih.gov/articles/PMC12345/';
		const result = replacePMCUrl(content, 'PMC6792392', 'CITATION');
		expect(result).toBe('CITATION and https://pmc.ncbi.nlm.nih.gov/articles/PMC12345/');
	});
});

describe('replaceDOIUrl', () => {
	it('should replace doi.org URL with citation', () => {
		const content = 'See https://doi.org/10.1234/test for details';
		const result = replaceDOIUrl(content, '10.1234/test', '🔗 Citation');
		expect(result).toBe('See 🔗 Citation for details');
	});

	it('should replace dx.doi.org URL', () => {
		const content = 'See https://dx.doi.org/10.1234/test for details';
		const result = replaceDOIUrl(content, '10.1234/test', 'CITATION');
		expect(result).toBe('See CITATION for details');
	});

	it('should replace all occurrences of repeated DOIs', () => {
		const content = 'https://doi.org/10.1234/test and https://doi.org/10.1234/test';
		const result = replaceDOIUrl(content, '10.1234/test', 'CITATION');
		expect(result).toBe('CITATION and CITATION');
	});

	it('should not replace different DOIs', () => {
		const content = 'https://doi.org/10.1234/test and https://doi.org/10.5678/other';
		const result = replaceDOIUrl(content, '10.1234/test', 'CITATION');
		expect(result).toBe('CITATION and https://doi.org/10.5678/other');
	});

	it('should handle DOI URL with fragment', () => {
		const content = 'See https://doi.org/10.1234/test#section for details';
		const result = replaceDOIUrl(content, '10.1234/test', 'CITATION');
		expect(result).toBe('See CITATION#section for details');
	});

	it('should handle DOI URL with query string', () => {
		const content = 'See https://doi.org/10.1234/test?ref=foo for details';
		const result = replaceDOIUrl(content, '10.1234/test', 'CITATION');
		expect(result).toBe('See CITATION?ref=foo for details');
	});
});

describe('Replacement in code blocks', () => {
	it('should replace PubMed URL inside inline code', () => {
		const content = 'Use `https://pubmed.ncbi.nlm.nih.gov/38570095/` as reference';
		const result = replacePubMedUrl(content, '38570095', 'CITATION');
		expect(result).toBe('Use `CITATION` as reference');
	});

	it('should replace PubMed URL inside fenced code block', () => {
		const content = '```\nhttps://pubmed.ncbi.nlm.nih.gov/38570095/\n```';
		const result = replacePubMedUrl(content, '38570095', 'CITATION');
		expect(result).toBe('```\nCITATION\n```');
	});
});
