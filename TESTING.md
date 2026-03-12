# Testing

## Quick Start

```bash
# Install dependencies
npm install

# Run unit tests (fast, no API calls)
npm test

# Run integration tests (real API calls)
npm run test:integration

# Run tests with coverage
npm run test:coverage
```

## Test Types

### Unit Tests (`npm test`)
- **Fast**: No external API calls
- **Reliable**: Consistent results
- **Files**: `tests/*.ts`
- **Coverage**: 72 tests covering extraction, formatting, and duplicate detection

### Integration Tests (`npm run test:integration`)
- **Comprehensive**: Real API calls to PubMed/CrossRef
- **Slower**: Network dependent
- **Files**: `test-*.js` in root
- **Purpose**: Validates actual API integration

## Test Coverage

✅ **URL Extraction**
- PubMed URLs: `https://pubmed.ncbi.nlm.nih.gov/38570095/`
- PMC URLs: `https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/`
- DOI URLs: `https://doi.org/10.1016/j.clinme.2024.100038`
- Direct IDs and edge cases

✅ **Citation Formatting**
- PubMed + PMC format
- PubMed + DOI format
- PubMed/DOI only formats
- Custom article types and icons

✅ **Duplicate Prevention**
- Detects already cited articles
- Skips redundant API calls
- Mixed content handling
- Performance optimization (80% fewer API calls)

✅ **Specificity**
- Only matches exact PubMed/PMC/DOI patterns
- Rejects other academic sites (arXiv, Google Scholar)
- Rejects general websites (Google, GitHub, Wikipedia)

## Writing New Tests

```typescript
import { expect } from './setup';
import { extractPubMedId } from './test-utils';

describe('PubMed ID Extraction', () => {
  it('should extract ID from standard URL', () => {
    const result = extractPubMedId('https://pubmed.ncbi.nlm.nih.gov/12345/');
    expect(result).to.equal('12345');
  });
});
```

## Troubleshooting

- **Network errors**: Check internet connection for integration tests
- **API rate limits**: Tests include delays, but NCBI may still limit
- **Missing dependencies**: Run `npm install`
- **TypeScript errors**: Ensure `@types/*` packages are installed

## Performance

The plugin uses a two-layer detection system:
1. **Quick Check**: Pattern matching to skip already cited URLs
2. **Full Check**: API calls only for new URLs

This reduces API calls by ~80% while maintaining accuracy.
