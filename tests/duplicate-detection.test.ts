/**
 * Unit tests for duplicate citation detection
 */

import { describe, it, expect } from 'vitest';
import {
	isAlreadyCited,
	isPubMedIdCited,
	isPMCIdCited,
	isDOICited,
} from '../src/utils';

describe('Duplicate Citation Detection', () => {
	describe('PubMed ID detection', () => {
		it('should detect already cited PubMed article', () => {
			const content = '📚 Article: [An introduction to neuropalliative care](https://pubmed.ncbi.nlm.nih.gov/38570095/) - 2024, Clin Med (Lond)';
			expect(isAlreadyCited(content, '38570095')).to.be.true;
		});

		it('should not detect uncited PubMed article', () => {
			const content = 'Check this article: https://pubmed.ncbi.nlm.nih.gov/38570095/';
			expect(isAlreadyCited(content, '38570095')).to.be.false;
		});

		it('should detect PubMed article with ID as link text', () => {
			const content = 'Article: [38570095](https://pubmed.ncbi.nlm.nih.gov/38570095/) - Year, Journal';
			expect(isAlreadyCited(content, '38570095')).to.be.true;
		});

		it('should not detect different PubMed ID', () => {
			const content = '📚 Article: [Title](https://pubmed.ncbi.nlm.nih.gov/12345678/) - 2024, Journal';
			expect(isAlreadyCited(content, '38570095')).to.be.false;
		});
	});

	describe('DOI detection', () => {
		it('should detect already cited DOI', () => {
			const content = '🔗 Article: [Test Title](https://doi.org/10.1016/j.clinme.2024.100038) - 2024, Test Journal';
			expect(isAlreadyCited(content, undefined, '10.1016/j.clinme.2024.100038')).to.be.true;
		});

		it('should not detect uncited DOI', () => {
			const content = 'Read more: https://doi.org/10.1016/j.clinme.2024.100038';
			expect(isAlreadyCited(content, undefined, '10.1016/j.clinme.2024.100038')).to.be.false;
		});

		it('should detect DOI with different citation format', () => {
			const content = 'Article: [Title](https://doi.org/10.1016/j.clinme.2024.100038) - 2024, Journal';
			expect(isAlreadyCited(content, undefined, '10.1016/j.clinme.2024.100038')).to.be.true;
		});

		it('should handle DOI with "doi:" prefix', () => {
			const content = '🔗 Article: [Title](https://doi.org/10.1016/j.clinme.2024.100038) - 2024, Journal';
			expect(isAlreadyCited(content, undefined, 'doi: 10.1016/j.clinme.2024.100038')).to.be.true;
		});
	});

	describe('PMC ID detection', () => {
		it('should detect already cited PMC article', () => {
			const content = '📚 Article: [Title](https://pubmed.ncbi.nlm.nih.gov/6792392/) - 2024, Journal [📄](https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/)';
			expect(isAlreadyCited(content, undefined, undefined, 'PMC6792392')).to.be.true;
		});

		it('should not detect uncited PMC article', () => {
			const content = 'Full text available: https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/';
			expect(isAlreadyCited(content, undefined, undefined, 'PMC6792392')).to.be.false;
		});

		it('should not detect different PMC ID', () => {
			const content = '📚 Article: [Title](https://pubmed.ncbi.nlm.nih.gov/123/) - 2024, Journal [📄](https://pmc.ncbi.nlm.nih.gov/articles/PMC12345678/)';
			expect(isAlreadyCited(content, undefined, undefined, 'PMC6792392')).to.be.false;
		});
	});

	describe('mixed content scenarios', () => {
		it('should handle content with multiple citations', () => {
			const content = `
				Already cited: 📚 Article: [Existing Article](https://pubmed.ncbi.nlm.nih.gov/12345678/) - 2023, Test Journal
				New PubMed: https://pubmed.ncbi.nlm.nih.gov/38570095/
				Already cited DOI: 🔗 Article: [Existing DOI](https://doi.org/10.1000/existing.doi) - 2023, Test Journal
				New DOI: https://doi.org/10.1016/j.clinme.2024.100038
			`;
			
			expect(isAlreadyCited(content, '12345678')).to.be.true;
			expect(isAlreadyCited(content, '38570095')).to.be.false;
			expect(isAlreadyCited(content, undefined, '10.1000/existing.doi')).to.be.true;
			expect(isAlreadyCited(content, undefined, '10.1016/j.clinme.2024.100038')).to.be.false;
		});

		it('should handle empty content', () => {
			expect(isAlreadyCited('', '38570095')).to.be.false;
			expect(isAlreadyCited('', undefined, '10.1016/j.test.2024.001')).to.be.false;
			expect(isAlreadyCited('', undefined, undefined, 'PMC6792392')).to.be.false;
		});

		it('should handle content with no citations', () => {
			const content = 'Just some regular text without any citations.';
			expect(isAlreadyCited(content, '38570095')).to.be.false;
			expect(isAlreadyCited(content, undefined, '10.1016/j.test.2024.001')).to.be.false;
		});

		it('should handle partial matches correctly', () => {
			const content = 'Some text with 38570095 but no proper citation format';
			expect(isAlreadyCited(content, '38570095')).to.be.false;
		});
	});

	describe('edge cases', () => {
		it('should handle special characters in IDs', () => {
			const content = '🔗 Article: [Title](https://doi.org/10.1016/j.test(2024)001) - 2024, Journal';
			expect(isAlreadyCited(content, undefined, '10.1016/j.test(2024)001')).to.be.true;
		});

		it('should be case-insensitive for citation markers', () => {
			const content = '📚 article: [Title](https://pubmed.ncbi.nlm.nih.gov/38570095/) - 2024, Journal';
			expect(isAlreadyCited(content, '38570095')).to.be.true;
		});

		it('should handle multiple occurrences of same ID', () => {
			const content = `
				First mention: https://pubmed.ncbi.nlm.nih.gov/38570095/
				Second mention: 📚 Article: [Title](https://pubmed.ncbi.nlm.nih.gov/38570095/) - 2024, Journal
			`;
			expect(isAlreadyCited(content, '38570095')).to.be.true;
		});

		it('should detect a marked citation link without trailing slash', () => {
			const content = '📚 Article: [Title](https://pubmed.ncbi.nlm.nih.gov/38570095) - 2024, Journal';
			expect(isAlreadyCited(content, '38570095')).to.be.true;
		});

		it('should find the earliest link when both slash variants exist', () => {
			const content = '📚 Article: [A](https://pubmed.ncbi.nlm.nih.gov/38570095/) and [B](https://pubmed.ncbi.nlm.nih.gov/38570095)';
			expect(isAlreadyCited(content, '38570095')).to.be.true;
		});

		it('should keep scanning markers when the link is on a later line', () => {
			const content = `
				📚 Article: [Other](https://pubmed.ncbi.nlm.nih.gov/11111111/) - 2020, Journal
				📚 Article: [Title](https://pubmed.ncbi.nlm.nih.gov/38570095/) - 2024, Journal
			`;
			expect(isAlreadyCited(content, '38570095')).to.be.true;
		});
	});

	describe('title and year detection', () => {
		const cited =
			'📚 Article: [An introduction to neuropalliative care](https://pubmed.ncbi.nlm.nih.gov/38570095/) - 2024, Clin Med (Lond)';

		it('should detect citation by title and year', () => {
			expect(
				isAlreadyCited(cited, undefined, undefined, undefined, 'An introduction to neuropalliative care', '2024')
			).to.be.true;
		});

		it('should match title and year case-insensitively', () => {
			expect(
				isAlreadyCited(cited, undefined, undefined, undefined, 'AN INTRODUCTION TO NEUROPALLIATIVE CARE', '2024')
			).to.be.true;
		});

		it('should not detect a different year', () => {
			expect(
				isAlreadyCited(cited, undefined, undefined, undefined, 'An introduction to neuropalliative care', '2023')
			).to.be.false;
		});

		it('should not detect a different title', () => {
			expect(
				isAlreadyCited(cited, undefined, undefined, undefined, 'A different article', '2024')
			).to.be.false;
		});

		it('should require the citation marker on the same line', () => {
			const content = `
				Plain link: [An introduction to neuropalliative care](https://example.com) - 2024
				📚 Article: [Another article](https://pubmed.ncbi.nlm.nih.gov/12345678/) - 2023, Journal
			`;
			expect(
				isAlreadyCited(content, undefined, undefined, undefined, 'An introduction to neuropalliative care', '2024')
			).to.be.false;
		});
	});
});

describe('Identifier citation helpers', () => {
	describe('isPubMedIdCited', () => {
		it('should detect a PubMed markdown link', () => {
			const content = '📚 Article: [Title](https://pubmed.ncbi.nlm.nih.gov/38570095/) - 2024, Journal';
			expect(isPubMedIdCited(content, '38570095')).to.be.true;
		});

		it('should not detect a bare PubMed URL', () => {
			const content = 'Check https://pubmed.ncbi.nlm.nih.gov/38570095/ for details';
			expect(isPubMedIdCited(content, '38570095')).to.be.false;
		});

		it('should not detect a different PubMed ID', () => {
			const content = '📚 Article: [Title](https://pubmed.ncbi.nlm.nih.gov/12345678/) - 2024, Journal';
			expect(isPubMedIdCited(content, '38570095')).to.be.false;
		});
	});

	describe('isPMCIdCited', () => {
		it('should detect a PMC markdown link', () => {
			const content = '📚 Article: [Title](https://pubmed.ncbi.nlm.nih.gov/6792392/) - 2024, Journal [📄](https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/)';
			expect(isPMCIdCited(content, 'PMC6792392')).to.be.true;
		});

		it('should not detect a bare PMC URL', () => {
			const content = 'Full text: https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/';
			expect(isPMCIdCited(content, 'PMC6792392')).to.be.false;
		});
	});

	describe('isDOICited', () => {
		it('should detect a DOI markdown link', () => {
			const content = '🔗 Article: [Title](https://doi.org/10.1016/j.clinme.2024.100038) - 2024, Journal';
			expect(isDOICited(content, '10.1016/j.clinme.2024.100038')).to.be.true;
		});

		it('should not detect a bare DOI URL', () => {
			const content = 'Read more: https://doi.org/10.1016/j.clinme.2024.100038';
			expect(isDOICited(content, '10.1016/j.clinme.2024.100038')).to.be.false;
		});
	});
});
