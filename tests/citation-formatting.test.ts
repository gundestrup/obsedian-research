/**
 * Unit tests for citation formatting
 */

import { expect } from './setup';
import { formatCitation } from './test-utils';

describe('Citation Formatting', () => {
	describe('PubMed + PMC citations', () => {
		it('should format citation with PubMed ID and PMC ID', () => {
			const info = {
				title: 'Test Article Title',
				journal: 'Test Journal',
				year: '2024',
				pubmedId: '38570095',
				pmcId: 'PMC1234567',
				articleType: 'Article'
			};
			
			const citation = formatCitation(info);
			expect(citation).to.equal('📚 Article: [Test Article Title](https://pubmed.ncbi.nlm.nih.gov/38570095/) - 2024, Test Journal [📄](https://pmc.ncbi.nlm.nih.gov/articles/PMC1234567/)');
		});

		it('should use custom article type', () => {
			const info = {
				title: 'Review Article',
				journal: 'Nature Reviews',
				year: '2023',
				pubmedId: '12345678',
				pmcId: 'PMC9876543',
				articleType: 'Review'
			};
			
			const citation = formatCitation(info);
			expect(citation).to.include('📚 Review:');
		});
	});

	describe('PubMed + DOI citations', () => {
		it('should format citation with PubMed ID and DOI', () => {
			const info = {
				title: 'Test Article Title',
				journal: 'Test Journal',
				year: '2024',
				pubmedId: '38570095',
				doi: '10.1000/test.doi',
				articleType: 'Article'
			};
			
			const citation = formatCitation(info);
			expect(citation).to.equal('📚 Article: [Test Article Title](https://pubmed.ncbi.nlm.nih.gov/38570095/) - 2024, Test Journal [🔗](https://doi.org/10.1000/test.doi)');
		});

		it('should clean DOI with prefix', () => {
			const info = {
				title: 'Test Article',
				journal: 'Test Journal',
				year: '2024',
				pubmedId: '38570095',
				doi: 'doi: 10.1000/test.doi',
				articleType: 'Article'
			};
			
			const citation = formatCitation(info);
			expect(citation).to.include('https://doi.org/10.1000/test.doi');
			expect(citation).to.not.include('doi:');
		});
	});

	describe('PubMed only citations', () => {
		it('should format citation with only PubMed ID', () => {
			const info = {
				title: 'Test Article Title',
				journal: 'Test Journal',
				year: '2024',
				pubmedId: '38570095',
				articleType: 'Article'
			};
			
			const citation = formatCitation(info);
			expect(citation).to.equal('📚 Article: [Test Article Title](https://pubmed.ncbi.nlm.nih.gov/38570095/) - 2024, Test Journal');
		});

		it('should default to "Article" type when not specified', () => {
			const info = {
				title: 'Test Article',
				journal: 'Test Journal',
				year: '2024',
				pubmedId: '38570095'
			};
			
			const citation = formatCitation(info);
			expect(citation).to.include('📚 Article:');
		});
	});

	describe('DOI only citations', () => {
		it('should format citation with only DOI', () => {
			const info = {
				title: 'Test Article Title',
				journal: 'Test Journal',
				year: '2024',
				doi: '10.1000/test.doi',
				articleType: 'Article'
			};
			
			const citation = formatCitation(info);
			expect(citation).to.equal('🔗 Article: [Test Article Title](https://doi.org/10.1000/test.doi) - 2024, Test Journal');
		});

		it('should use DOI icon for DOI-only citations', () => {
			const info = {
				title: 'DOI Article',
				journal: 'Test Journal',
				year: '2024',
				doi: '10.1000/test.doi',
				articleType: 'Article'
			};
			
			const citation = formatCitation(info);
			expect(citation).to.match(/^🔗/);
		});
	});

	describe('edge cases', () => {
		it('should handle empty title', () => {
			const info = {
				title: '',
				journal: 'Test Journal',
				year: '2024',
				pubmedId: '38570095',
				articleType: 'Article'
			};
			
			const citation = formatCitation(info);
			expect(citation).to.include('[]');
		});

		it('should handle special characters in title', () => {
			const info = {
				title: 'Test: A Study of "Special" Characters & More',
				journal: 'Test Journal',
				year: '2024',
				pubmedId: '38570095',
				articleType: 'Article'
			};
			
			const citation = formatCitation(info);
			expect(citation).to.include('Test: A Study of "Special" Characters & More');
		});

		it('should return empty string when no IDs provided', () => {
			const info = {
				title: 'Test Article',
				journal: 'Test Journal',
				year: '2024',
				articleType: 'Article'
			};
			
			const citation = formatCitation(info);
			expect(citation).to.equal('');
		});

		it('should prioritize PMC over DOI when both present with PubMed', () => {
			const info = {
				title: 'Test Article',
				journal: 'Test Journal',
				year: '2024',
				pubmedId: '38570095',
				pmcId: 'PMC1234567',
				doi: '10.1000/test.doi',
				articleType: 'Article'
			};
			
			const citation = formatCitation(info);
			expect(citation).to.include('📄'); // PMC icon
			expect(citation).to.not.include('🔗'); // DOI icon
		});

		it('should handle long journal names', () => {
			const info = {
				title: 'Test Article',
				journal: 'The International Journal of Very Long Journal Names and Academic Publishing',
				year: '2024',
				pubmedId: '38570095',
				articleType: 'Article'
			};
			
			const citation = formatCitation(info);
			expect(citation).to.include('The International Journal of Very Long Journal Names and Academic Publishing');
		});
	});
});
