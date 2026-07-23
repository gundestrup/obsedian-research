/**
 * Unit tests for API functions with mocked requestUrl
 */

import { describe, it, expect, vi, type MockedFunction } from 'vitest';
import {
	fetchPubMedApiData,
	fetchDOIApiData,
	findPubMedIdFromPMC,
	findPubMedIdFromDOI,
	parsePubMedResult,
	type RequestFunction,
} from '../src/api';
import type { RequestUrlResponse } from '../src/types';

function mockRequest(response: RequestUrlResponse): MockedFunction<RequestFunction> {
	return vi.fn().mockResolvedValue(response);
}

describe('parsePubMedResult', () => {
	it('should parse a complete PubMed result', () => {
		const result = {
			title: 'Test Article',
			source: 'Test Journal',
			pubdate: '2024 Jan',
			doi: '10.1234/test',
			articleids: [
				{ idtype: 'pmc', value: 'PMC1234567' },
			],
			pubtype: ['Review'],
		};

		const info = parsePubMedResult(result, '38570095', 'Article');
		expect(info.title).toBe('Test Article');
		expect(info.journal).toBe('Test Journal');
		expect(info.year).toBe('2024');
		expect(info.pubmedId).toBe('38570095');
		expect(info.doi).toBe('10.1234/test');
		expect(info.pmcId).toBe('PMC1234567');
		expect(info.articleType).toBe('Review');
	});

	it('should extract DOI from articleids when not in top-level field', () => {
		const result = {
			title: 'Test',
			source: 'Journal',
			pubdate: '2023',
			articleids: [
				{ idtype: 'doi', value: 'doi: 10.5678/article' },
				{ idtype: 'pmc', value: '9876543' },
			],
			pubtype: ['Journal Article'],
		};

		const info = parsePubMedResult(result, '12345', 'Article');
		expect(info.doi).toBe('10.5678/article');
		expect(info.pmcId).toBe('PMC9876543');
	});

	it('should use default article type when pubtype is empty', () => {
		const result = {
			title: 'Test',
			source: 'Journal',
			pubdate: '2024',
		};

		const info = parsePubMedResult(result, '12345', 'Review');
		expect(info.articleType).toBe('Review');
	});

	it('should handle missing fields with defaults', () => {
		const result = {};

		const info = parsePubMedResult(result, '12345', 'Article');
		expect(info.title).toBe('No title available');
		expect(info.journal).toBe('No journal available');
		expect(info.year).toBe('No year available');
	});
});

describe('fetchPubMedApiData', () => {
	it('should fetch and parse PubMed article data', async () => {
		const mockResponse: RequestUrlResponse = {
			status: 200,
			json: {
				result: {
					'38570095': {
						title: 'Test Article',
						source: 'Test Journal',
						pubdate: '2024 Jan',
						doi: '10.1234/test',
						articleids: [
							{ idtype: 'pmc', value: 'PMC1234567' },
						],
						pubtype: ['Review'],
					},
				},
			},
		};

		const requestFn = mockRequest(mockResponse);
		const info = await fetchPubMedApiData('38570095', '', requestFn);

		expect(info.title).toBe('Test Article');
		expect(info.pubmedId).toBe('38570095');
		expect(info.doi).toBe('10.1234/test');
		expect(info.pmcId).toBe('PMC1234567');
		expect(requestFn).toHaveBeenCalledTimes(1);
		expect(requestFn.mock.calls[0][0].url).toContain('esummary.fcgi');
	});

	it('should include API key in URL when provided', async () => {
		const mockResponse: RequestUrlResponse = {
			status: 200,
			json: {
				result: {
					'12345': {
						title: 'Test',
						source: 'Journal',
						pubdate: '2024',
					},
				},
			},
		};

		const requestFn = mockRequest(mockResponse);
		await fetchPubMedApiData('12345', 'my-api-key', requestFn);

		expect(requestFn).toHaveBeenCalledTimes(1);
		expect(requestFn.mock.calls[0][0].url).toContain('api_key=my-api-key');
	});

	it('should throw on non-200 status', async () => {
		const requestFn = mockRequest({ status: 404, json: {} });
		await expect(fetchPubMedApiData('12345', '', requestFn)).rejects.toThrow('HTTP error! status: 404');
	});

	it('should throw when article not found', async () => {
		const requestFn = mockRequest({ status: 200, json: { result: {} } });
		await expect(fetchPubMedApiData('99999', '', requestFn)).rejects.toThrow('Article not found');
	});
});

describe('fetchDOIApiData', () => {
	it('should fetch and parse DOI article data from CrossRef', async () => {
		const mockResponse: RequestUrlResponse = {
			status: 200,
			json: {
				message: {
					title: ['DOI Article Title'],
					'short-container-title': ['Test Journal'],
					created: { 'date-parts': [[2024, 3, 15]] },
					type: 'journal-article',
				},
			},
		};

		const requestFn = mockRequest(mockResponse);
		const info = await fetchDOIApiData('10.1234/test', 'Article', requestFn);

		expect(info.title).toBe('DOI Article Title');
		expect(info.journal).toBe('Test Journal');
		expect(info.year).toBe('2024');
		expect(info.doi).toBe('10.1234/test');
		expect(info.articleType).toBe('journal-article');
	});

	it('should fall back to container-title when short-container-title is missing', async () => {
		const mockResponse: RequestUrlResponse = {
			status: 200,
			json: {
				message: {
					title: ['Test'],
					'container-title': ['Full Journal Name'],
					created: { 'date-parts': [[2023]] },
				},
			},
		};

		const requestFn = mockRequest(mockResponse);
		const info = await fetchDOIApiData('10.1234/test', 'Article', requestFn);

		expect(info.journal).toBe('Full Journal Name');
	});

	it('should throw on non-200 status', async () => {
		const requestFn = mockRequest({ status: 404, json: {} });
		await expect(fetchDOIApiData('10.1234/test', 'Article', requestFn)).rejects.toThrow('HTTP error! status: 404');
	});

	it('should throw when message is missing', async () => {
		const requestFn = mockRequest({ status: 200, json: {} });
		await expect(fetchDOIApiData('10.1234/test', 'Article', requestFn)).rejects.toThrow('Article not found');
	});
});

describe('findPubMedIdFromPMC', () => {
	it('should return PubMed ID when found', async () => {
		const mockResponse: RequestUrlResponse = {
			status: 200,
			json: {
				esearchresult: {
					idlist: ['38570095'],
				},
			},
		};

		const requestFn = mockRequest(mockResponse);
		const result = await findPubMedIdFromPMC('PMC6792392', '', requestFn);
		expect(result).toBe('38570095');
	});

	it('should return null when no results', async () => {
		const mockResponse: RequestUrlResponse = {
			status: 200,
			json: {
				esearchresult: {
					idlist: [],
				},
			},
		};

		const requestFn = mockRequest(mockResponse);
		const result = await findPubMedIdFromPMC('PMC9999999', '', requestFn);
		expect(result).toBeNull();
	});

	it('should return null on error', async () => {
		const requestFn = vi.fn().mockRejectedValue(new Error('Network error'));
		const result = await findPubMedIdFromPMC('PMC9999999', '', requestFn);
		expect(result).toBeNull();
	});
});

describe('findPubMedIdFromDOI', () => {
	it('should return PubMed ID when found', async () => {
		const mockResponse: RequestUrlResponse = {
			status: 200,
			json: {
				esearchresult: {
					idlist: ['38570095'],
				},
			},
		};

		const requestFn = mockRequest(mockResponse);
		const result = await findPubMedIdFromDOI('10.1234/test', '', requestFn);
		expect(result).toBe('38570095');
	});

	it('should return null when no results', async () => {
		const mockResponse: RequestUrlResponse = {
			status: 200,
			json: {
				esearchresult: {
					idlist: [],
				},
			},
		};

		const requestFn = mockRequest(mockResponse);
		const result = await findPubMedIdFromDOI('10.9999/nonexistent', '', requestFn);
		expect(result).toBeNull();
	});

	it('should return null on non-200 status', async () => {
		const requestFn = mockRequest({ status: 500, json: {} });
		const result = await findPubMedIdFromDOI('10.1234/test', '', requestFn);
		expect(result).toBeNull();
	});

	it('should return null on error', async () => {
		const requestFn = vi.fn().mockRejectedValue(new Error('Network error'));
		const result = await findPubMedIdFromDOI('10.1234/test', '', requestFn);
		expect(result).toBeNull();
	});
});

describe('Edge cases — API URL encoding', () => {
	it('should encode DOI with special characters in URL', async () => {
		const mockResponse: RequestUrlResponse = {
			status: 200,
			json: {
				esearchresult: {
					idlist: ['12345'],
				},
			},
		};

		const requestFn = mockRequest(mockResponse);
		await findPubMedIdFromDOI('10.1007/s10654-023-01010-8', '', requestFn);
		expect(requestFn.mock.calls[0][0].url).toContain('10.1007');
	});

	it('should encode API key parameter in URL', async () => {
		const mockResponse: RequestUrlResponse = {
			status: 200,
			json: {
				result: {
					'12345': {
						title: 'Test',
						source: 'Journal',
						pubdate: '2024',
					},
				},
			},
		};

		const requestFn = mockRequest(mockResponse);
		await fetchPubMedApiData('12345', 'key with spaces', requestFn);
		expect(requestFn.mock.calls[0][0].url).toContain('api_key=key+with+spaces');
	});
});

describe('Edge cases — malformed response bodies', () => {
	it('should handle PubMed response with null json', async () => {
		const requestFn = mockRequest({ status: 200, json: null });
		await expect(fetchPubMedApiData('12345', '', requestFn)).rejects.toThrow();
	});

	it('should handle CrossRef response with null json', async () => {
		const requestFn = mockRequest({ status: 200, json: null });
		await expect(fetchDOIApiData('10.1234/test', 'Article', requestFn)).rejects.toThrow();
	});

	it('should handle PubMed search response with missing esearchresult', async () => {
		const requestFn = mockRequest({ status: 200, json: {} });
		const result = await findPubMedIdFromPMC('PMC9999999', '', requestFn);
		expect(result).toBeNull();
	});

	it('should handle PubMed search response with null idlist', async () => {
		const requestFn = mockRequest({
			status: 200,
			json: { esearchresult: { idlist: null as unknown as string[] } },
		});
		const result = await findPubMedIdFromPMC('PMC9999999', '', requestFn);
		expect(result).toBeNull();
	});
});

describe('Edge cases — PMC non-200 responses', () => {
	it('should return null on 404', async () => {
		const requestFn = mockRequest({ status: 404, json: {} });
		const result = await findPubMedIdFromPMC('PMC9999999', '', requestFn);
		expect(result).toBeNull();
	});

	it('should return null on 500', async () => {
		const requestFn = mockRequest({ status: 500, json: {} });
		const result = await findPubMedIdFromPMC('PMC9999999', '', requestFn);
		expect(result).toBeNull();
	});

	it('should return null on 429 (rate limited)', async () => {
		const requestFn = mockRequest({ status: 429, json: {} });
		const result = await findPubMedIdFromPMC('PMC9999999', '', requestFn);
		expect(result).toBeNull();
	});
});

describe('Edge cases — parsePubMedResult DOI cleaning', () => {
	it('should clean doi: prefix from top-level doi field', () => {
		const result = {
			title: 'Test',
			source: 'Journal',
			pubdate: '2024',
			doi: 'doi: 10.1234/test',
		};

		const info = parsePubMedResult(result, '12345', 'Article');
		expect(info.doi).toBe('10.1234/test');
	});

	it('should clean doi: prefix from elocationid field', () => {
		const result = {
			title: 'Test',
			source: 'Journal',
			pubdate: '2024',
			elocationid: 'doi: 10.5678/article',
		};

		const info = parsePubMedResult(result, '12345', 'Article');
		expect(info.doi).toBe('10.5678/article');
	});

	it('should trim whitespace from top-level doi', () => {
		const result = {
			title: 'Test',
			source: 'Journal',
			pubdate: '2024',
			doi: '  10.1234/test  ',
		};

		const info = parsePubMedResult(result, '12345', 'Article');
		expect(info.doi).toBe('10.1234/test');
	});
});
