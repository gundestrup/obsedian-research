import type {
	ArticleInfo,
	PubMedResult,
	PubMedApiResponse,
	PubMedSearchResponse,
	CrossRefResponse,
	RequestUrlResponse,
} from './types';
import { cleanDOI } from './utils';

export type RequestFunction = (params: { url: string }) => Promise<RequestUrlResponse>;

export function parsePubMedResult(
	result: PubMedResult,
	pubmedId: string,
	defaultArticleType: string
): ArticleInfo {
	let doi = '';
	let pmcId = '';

	if (result.doi) {
		doi = cleanDOI(result.doi);
	} else if (result.elocationid) {
		doi = cleanDOI(result.elocationid);
	}

	if (result.articleids) {
		const doiObj = result.articleids.find((id) => id.idtype === 'doi');
		if (doiObj && !doi) {
			doi = cleanDOI(doiObj.value);
		}

		const pmcObj = result.articleids.find((id) => id.idtype === 'pmc');
		if (pmcObj) {
			pmcId = pmcObj.value;
			if (!pmcId.startsWith('PMC')) {
				pmcId = 'PMC' + pmcId;
			}
		}
	}

	return {
		title: result.title || 'No title available',
		journal: result.source || result.fulljournalname || 'No journal available',
		year: result.pubdate ? result.pubdate.split(' ')[0] : 'No year available',
		pubmedId: pubmedId,
		doi: doi,
		pmcId: pmcId,
		articleType: result.pubtype?.[0] || defaultArticleType || 'Article',
	};
}

export async function fetchPubMedApiData(
	pubmedId: string,
	apiKey: string,
	requestFn: RequestFunction
): Promise<ArticleInfo> {
	const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
	const params = new URLSearchParams({
		db: 'pubmed',
		id: pubmedId,
		retmode: 'json',
		version: '2.0',
	});

	if (apiKey) {
		params.append('api_key', apiKey);
	}

	const response = await requestFn({ url: `${baseUrl}?${params}` });

	if (response.status !== 200) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const data = response.json as PubMedApiResponse;
	const result = data.result?.[pubmedId];

	if (!result) {
		throw new Error('Article not found');
	}

	return parsePubMedResult(result, pubmedId, '');
}

export async function findPubMedIdFromPMC(
	pmcId: string,
	apiKey: string,
	requestFn: RequestFunction
): Promise<string | null> {
	try {
		const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
		const params = new URLSearchParams({
			db: 'pubmed',
			term: `"${pmcId}"[pmcid]`,
			retmode: 'json',
		});

		if (apiKey) {
			params.append('api_key', apiKey);
		}

		const response = await requestFn({ url: `${baseUrl}?${params}` });

		if (response.status !== 200) {
			return null;
		}

		const json = response.json as PubMedSearchResponse;
		if (json.esearchresult?.idlist && json.esearchresult.idlist.length > 0) {
			return json.esearchresult.idlist[0];
		}
	} catch (error) {
		console.error('Error searching PubMed for PMC ID:', error);
	}
	return null;
}

export async function findPubMedIdFromDOI(
	doi: string,
	apiKey: string,
	requestFn: RequestFunction
): Promise<string | null> {
	try {
		const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
		const params = new URLSearchParams({
			db: 'pubmed',
			term: `"${doi}"[DOI]`,
			retmode: 'json',
			retmax: '1',
		});

		if (apiKey) {
			params.append('api_key', apiKey);
		}

		const response = await requestFn({ url: `${baseUrl}?${params}` });

		if (response.status !== 200) {
			return null;
		}

		const data = response.json as PubMedSearchResponse;
		const idList = data.esearchresult?.idlist;

		return idList && idList.length > 0 ? idList[0] : null;
	} catch (error) {
		console.error('Error searching PubMed by DOI:', error);
		return null;
	}
}

export async function fetchDOIApiData(
	doi: string,
	defaultArticleType: string,
	requestFn: RequestFunction
): Promise<ArticleInfo> {
	const baseUrl = 'https://api.crossref.org/works/' + encodeURIComponent(doi);

	const response = await requestFn({ url: baseUrl });

	if (response.status !== 200) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const data = response.json as CrossRefResponse;
	const message = data.message;

	if (!message) {
		throw new Error('Article not found');
	}

	return {
		title: message.title?.[0] || 'No title available',
		journal:
			message['short-container-title']?.[0] ||
			message['container-title']?.[0] ||
			'No journal available',
		year: message.created?.['date-parts']?.[0]?.[0]?.toString() || 'No year available',
		doi: doi,
		pubmedId: undefined,
		pmcId: undefined,
		articleType: message.type || defaultArticleType || 'Article',
	};
}
