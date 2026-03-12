/**
 * Unit tests for ID extraction functions
 */

import { expect } from './setup';
import {
	extractPubMedId,
	extractPMCId,
	extractDOI,
	cleanDOI,
	extractURLs
} from './test-utils';

describe('PubMed ID Extraction', () => {
	describe('from URLs', () => {
		it('should extract PubMed ID from standard URL with trailing slash', () => {
			expect(extractPubMedId('https://pubmed.ncbi.nlm.nih.gov/38570095/')).to.equal('38570095');
		});

		it('should extract PubMed ID from standard URL without trailing slash', () => {
			expect(extractPubMedId('https://pubmed.ncbi.nlm.nih.gov/38570095')).to.equal('38570095');
		});

		it('should extract PubMed ID from HTTP URL', () => {
			expect(extractPubMedId('http://pubmed.ncbi.nlm.nih.gov/12345678/')).to.equal('12345678');
		});

		it('should extract single-digit PubMed ID', () => {
			expect(extractPubMedId('https://pubmed.ncbi.nlm.nih.gov/1/')).to.equal('1');
		});

		it('should extract long PubMed ID', () => {
			expect(extractPubMedId('https://pubmed.ncbi.nlm.nih.gov/999999999')).to.equal('999999999');
		});
	});

	describe('from direct input', () => {
		it('should accept direct numeric ID', () => {
			expect(extractPubMedId('38570095')).to.equal('38570095');
		});

		it('should accept single-digit ID', () => {
			expect(extractPubMedId('1')).to.equal('1');
		});
	});

	describe('invalid inputs', () => {
		it('should return null for PMC URL', () => {
			expect(extractPubMedId('https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/')).to.be.null;
		});

		it('should return null for wrong domain', () => {
			expect(extractPubMedId('https://www.ncbi.nlm.nih.gov/pubmed/38570095/')).to.be.null;
		});

		it('should return null for non-numeric ID', () => {
			expect(extractPubMedId('abc123def')).to.be.null;
		});

		it('should return null for empty string', () => {
			expect(extractPubMedId('')).to.be.null;
		});

		it('should return null for URL without ID', () => {
			expect(extractPubMedId('https://pubmed.ncbi.nlm.nih.gov/')).to.be.null;
		});

		it('should return null for decimal numbers', () => {
			expect(extractPubMedId('123.456')).to.be.null;
		});
	});
});

describe('PMC ID Extraction', () => {
	describe('from URLs', () => {
		it('should extract PMC ID from articles URL with trailing slash', () => {
			expect(extractPMCId('https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/')).to.equal('PMC6792392');
		});

		it('should extract PMC ID from articles URL without trailing slash', () => {
			expect(extractPMCId('https://pmc.ncbi.nlm.nih.gov/articles/PMC12345678')).to.equal('PMC12345678');
		});

		it('should extract PMC ID from simple URL', () => {
			expect(extractPMCId('https://pmc.ncbi.nlm.nih.gov/PMC6792392/')).to.equal('PMC6792392');
		});

		it('should extract PMC ID from HTTP URL', () => {
			expect(extractPMCId('http://pmc.ncbi.nlm.nih.gov/articles/PMC98765432/')).to.equal('PMC98765432');
		});
	});

	describe('from direct input', () => {
		it('should accept direct PMC ID', () => {
			expect(extractPMCId('PMC6792392')).to.equal('PMC6792392');
		});

		it('should accept PMC ID with large number', () => {
			expect(extractPMCId('PMC123456789')).to.equal('PMC123456789');
		});
	});

	describe('invalid inputs', () => {
		it('should return null for PubMed URL', () => {
			expect(extractPMCId('https://pubmed.ncbi.nlm.nih.gov/38570095/')).to.be.null;
		});

		it('should return null for PMC ID without prefix', () => {
			expect(extractPMCId('6792392')).to.be.null;
		});

		it('should return null for empty string', () => {
			expect(extractPMCId('')).to.be.null;
		});

		it('should return null for invalid format', () => {
			expect(extractPMCId('PMC-6792392')).to.be.null;
		});
	});
});

describe('DOI Extraction', () => {
	describe('from URLs', () => {
		it('should extract DOI from standard doi.org URL', () => {
			expect(extractDOI('https://doi.org/10.1016/j.clinme.2024.100038')).to.equal('10.1016/j.clinme.2024.100038');
		});

		it('should extract DOI from dx.doi.org URL', () => {
			expect(extractDOI('https://dx.doi.org/10.1007/s10654-023-01010-8')).to.equal('10.1007/s10654-023-01010-8');
		});

		it('should extract DOI from HTTP URL', () => {
			expect(extractDOI('http://doi.org/10.1186/s12916-023-02845-8')).to.equal('10.1186/s12916-023-02845-8');
		});

		it('should handle DOI in markdown link', () => {
			const markdown = '[Article](https://doi.org/10.1016/j.test.2024.001)';
			expect(extractDOI(markdown)).to.equal('10.1016/j.test.2024.001');
		});
	});

	describe('from direct input', () => {
		it('should accept direct DOI', () => {
			expect(extractDOI('10.1016/j.clinme.2024.100038')).to.equal('10.1016/j.clinme.2024.100038');
		});

		it('should accept DOI with complex suffix', () => {
			expect(extractDOI('10.1007/978-3-319-12345-6_7')).to.equal('10.1007/978-3-319-12345-6_7');
		});
	});

	describe('DOI cleaning', () => {
		it('should remove "doi:" prefix (lowercase)', () => {
			expect(cleanDOI('doi: 10.1016/j.clinme.2024.100038')).to.equal('10.1016/j.clinme.2024.100038');
		});

		it('should remove "DOI:" prefix (uppercase)', () => {
			expect(cleanDOI('DOI: 10.1007/s10654-023-01010-8')).to.equal('10.1007/s10654-023-01010-8');
		});

		it('should trim whitespace', () => {
			expect(cleanDOI('  10.1186/s12916-023-02845-8  ')).to.equal('10.1186/s12916-023-02845-8');
		});

		it('should handle already clean DOI', () => {
			expect(cleanDOI('10.1016/j.test.2024.001')).to.equal('10.1016/j.test.2024.001');
		});
	});

	describe('invalid inputs', () => {
		it('should return null for invalid DOI format', () => {
			expect(extractDOI('not-a-doi')).to.be.null;
		});

		it('should return null for empty string', () => {
			expect(extractDOI('')).to.be.null;
		});

		it('should return null for PubMed URL', () => {
			expect(extractDOI('https://pubmed.ncbi.nlm.nih.gov/38570095/')).to.be.null;
		});
	});
});

describe('URL Extraction from Content', () => {
	it('should extract all PubMed URLs from mixed content', () => {
		const content = `
			Check this: https://pubmed.ncbi.nlm.nih.gov/38570095/
			And this: http://pubmed.ncbi.nlm.nih.gov/12345678
			Also: https://pubmed.ncbi.nlm.nih.gov/98765432/
		`;
		const urls = extractURLs(content);
		expect(urls.pubmedUrls).to.have.lengthOf(3);
		expect(urls.pubmedUrls).to.include('https://pubmed.ncbi.nlm.nih.gov/38570095/');
		expect(urls.pubmedUrls).to.include('http://pubmed.ncbi.nlm.nih.gov/12345678');
		expect(urls.pubmedUrls).to.include('https://pubmed.ncbi.nlm.nih.gov/98765432/');
	});

	it('should extract all PMC URLs from mixed content', () => {
		const content = `
			PMC article: https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/
			Another: https://pmc.ncbi.nlm.nih.gov/PMC12345678/
		`;
		const urls = extractURLs(content);
		expect(urls.pmcUrls).to.have.lengthOf(2);
		expect(urls.pmcUrls).to.include('https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/');
		expect(urls.pmcUrls).to.include('https://pmc.ncbi.nlm.nih.gov/PMC12345678/');
	});

	it('should extract all DOI URLs from mixed content', () => {
		const content = `
			DOI: https://doi.org/10.1016/j.clinme.2024.100038
			Another: https://dx.doi.org/10.1007/s10654-023-01010-8
		`;
		const urls = extractURLs(content);
		expect(urls.doiUrls).to.have.lengthOf(2);
	});

	it('should handle content with no URLs', () => {
		const content = 'Just some regular text without any links.';
		const urls = extractURLs(content);
		expect(urls.pubmedUrls).to.have.lengthOf(0);
		expect(urls.pmcUrls).to.have.lengthOf(0);
		expect(urls.doiUrls).to.have.lengthOf(0);
	});

	it('should ignore invalid URLs', () => {
		const content = `
			Valid: https://pubmed.ncbi.nlm.nih.gov/38570095/
			Invalid: https://google.com
			Invalid: https://github.com/user/repo
		`;
		const urls = extractURLs(content);
		expect(urls.pubmedUrls).to.have.lengthOf(1);
		expect(urls.pmcUrls).to.have.lengthOf(0);
		expect(urls.doiUrls).to.have.lengthOf(0);
	});
});
