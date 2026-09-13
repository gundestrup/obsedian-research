/**
 * Unit tests for URL replacement helpers
 */

import { describe, it, expect } from 'vitest';
import {
	replacePubMedUrl,
	replacePMCUrl,
	replaceDOIUrl,
} from '../src/utils';

type ReplaceFn = (content: string, id: string, citation: string) => string;

const replacers: { name: string; fn: ReplaceFn; id: string; otherId: string; url: (id: string) => string }[] = [
	{
		name: 'replacePubMedUrl',
		fn: replacePubMedUrl,
		id: '38570095',
		otherId: '12345',
		url: (id) => `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
	},
	{
		name: 'replacePMCUrl',
		fn: replacePMCUrl,
		id: 'PMC6792392',
		otherId: 'PMC12345',
		url: (id) => `https://pmc.ncbi.nlm.nih.gov/articles/${id}/`,
	},
	{
		name: 'replaceDOIUrl',
		fn: replaceDOIUrl,
		id: '10.1234/test',
		otherId: '10.5678/other',
		url: (id) => `https://doi.org/${id}`,
	},
];

describe.each(replacers)('$name', ({ fn, id, otherId, url }) => {
	it('should replace all occurrences of repeated IDs', () => {
		const content = `${url(id)} and ${url(id)}`;
		expect(fn(content, id, 'CITATION')).toBe('CITATION and CITATION');
	});

	it('should not replace different IDs', () => {
		const content = `${url(id)} and ${url(otherId)}`;
		expect(fn(content, id, 'CITATION')).toBe(`CITATION and ${url(otherId)}`);
	});
});

describe('replacePubMedUrl', () => {
	it.each<[string, string, string, string]>([
		[
			'bare URL',
			'See https://pubmed.ncbi.nlm.nih.gov/38570095/ for details',
			'📚 [Article](https://pubmed.ncbi.nlm.nih.gov/38570095/)',
			'See 📚 [Article](https://pubmed.ncbi.nlm.nih.gov/38570095/) for details',
		],
		[
			'URL inside Markdown link',
			'See [link](https://pubmed.ncbi.nlm.nih.gov/38570095/) for details',
			'📚 Citation',
			'See [link](📚 Citation) for details',
		],
		[
			'URL without trailing slash',
			'See https://pubmed.ncbi.nlm.nih.gov/38570095 for details',
			'CITATION',
			'See CITATION for details',
		],
		[
			'HTTP variant',
			'See http://pubmed.ncbi.nlm.nih.gov/38570095/ for details',
			'CITATION',
			'See CITATION for details',
		],
		[
			'URL with fragment',
			'See https://pubmed.ncbi.nlm.nih.gov/38570095/#abstract for details',
			'CITATION',
			'See CITATION#abstract for details',
		],
		[
			'URL with query string',
			'See https://pubmed.ncbi.nlm.nih.gov/38570095/?ref=foo for details',
			'CITATION',
			'See CITATION?ref=foo for details',
		],
	])('should replace %s', (_name, content, citation, expected) => {
		expect(replacePubMedUrl(content, '38570095', citation)).toBe(expected);
	});
});

describe('replacePMCUrl', () => {
	it.each<[string, string, string, string]>([
		[
			'articles/ URL',
			'See https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/ for details',
			'📄 Citation',
			'See 📄 Citation for details',
		],
		[
			'simple PMC URL',
			'See https://pmc.ncbi.nlm.nih.gov/PMC6792392/ for details',
			'CITATION',
			'See CITATION for details',
		],
	])('should replace %s', (_name, content, citation, expected) => {
		expect(replacePMCUrl(content, 'PMC6792392', citation)).toBe(expected);
	});
});

describe('replaceDOIUrl', () => {
	it.each<[string, string, string, string]>([
		[
			'doi.org URL',
			'See https://doi.org/10.1234/test for details',
			'🔗 Citation',
			'See 🔗 Citation for details',
		],
		[
			'dx.doi.org URL',
			'See https://dx.doi.org/10.1234/test for details',
			'CITATION',
			'See CITATION for details',
		],
		[
			'DOI URL with fragment',
			'See https://doi.org/10.1234/test#section for details',
			'CITATION',
			'See CITATION#section for details',
		],
		[
			'DOI URL with query string',
			'See https://doi.org/10.1234/test?ref=foo for details',
			'CITATION',
			'See CITATION?ref=foo for details',
		],
	])('should replace %s', (_name, content, citation, expected) => {
		expect(replaceDOIUrl(content, '10.1234/test', citation)).toBe(expected);
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
