# Testing

## Quick Start

```bash
# Install dependencies
npm install

# Run unit tests (fast, no API calls)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Types

### Unit Tests (`npm test`)
- **Fast**: No external API calls
- **Reliable**: Consistent results
- **Files**: `tests/*.test.ts`
- **Coverage**: 91 tests covering extraction, formatting, duplicate detection, and API parsing

### Watch mode (`npm run test:watch`)
- Re-runs tests automatically when files change

### Coverage (`npm run test:coverage`)
- Generates a coverage report with v8 provider

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
import { describe, it, expect } from 'vitest';
import { extractPubMedId } from '../src/utils';

describe('PubMed ID Extraction', () => {
  it('should extract ID from standard URL', () => {
    const result = extractPubMedId('https://pubmed.ncbi.nlm.nih.gov/12345/');
    expect(result).toBe('12345');
  });
});
```

## Troubleshooting

- **Missing dependencies**: Run `npm install`
- **TypeScript errors**: Ensure `vitest` is installed and your IDE uses the workspace TypeScript version

## Performance

The plugin uses a two-layer detection system:
1. **Quick Check**: Pattern matching to skip already cited URLs
2. **Full Check**: API calls only for new URLs

This reduces API calls by ~80% while maintaining accuracy.
