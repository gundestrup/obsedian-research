# Test Suite for PubMed Article Fetcher

This directory contains the Jest-based test suite for the PubMed Article Fetcher Obsidian plugin.

## Structure

```
tests/
├── test-utils.ts              # Shared test utilities and mock data
├── extraction.test.ts         # Tests for ID extraction functions
├── duplicate-detection.test.ts # Tests for duplicate citation detection
└── citation-formatting.test.ts # Tests for citation formatting
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run legacy integration tests (actual API calls)
npm run test:legacy
```

## Test Framework

This test suite uses:
- **Mocha** - Fast, flexible testing framework (community standard for Obsidian plugins)
- **Chai** - Expressive assertion library
- **Sinon** - Mocking and stubbing library
- **sinon-chai** - Chai plugin for Sinon assertions
- **tsx** - TypeScript loader for Mocha
- **c8** - Code coverage tool

## Test Categories

### Unit Tests (Jest)
Fast, isolated tests that don't make external API calls:
- `extraction.test.ts` - ID extraction from URLs and text
- `duplicate-detection.test.ts` - Citation duplicate detection logic
- `citation-formatting.test.ts` - Citation string formatting

### Integration Tests (Legacy)
Slower tests that make actual API calls to PubMed and CrossRef:
- `test-pmid.js` - PubMed ID processing
- `test-pmc.js` - PMC ID processing
- `test-doi.js` - DOI processing
- `test-duplicate-prevention.js` - Duplicate prevention
- `test-enhanced-detection.js` - Enhanced citation detection

## Writing New Tests

### Example Test

```typescript
import { expect } from './setup';
import { extractPubMedId } from './test-utils';

describe('My Feature', () => {
  it('should do something', () => {
    const result = extractPubMedId('https://pubmed.ncbi.nlm.nih.gov/12345/');
    expect(result).to.equal('12345');
  });
});
```

### Best Practices

1. **Use descriptive test names** - Test names should clearly describe what is being tested
2. **Test edge cases** - Include tests for empty strings, null values, invalid inputs
3. **Keep tests isolated** - Each test should be independent
4. **Use test-utils** - Import shared utilities from `test-utils.ts` to avoid duplication
5. **Mock external dependencies** - Don't make real API calls in unit tests

## Coverage

Run `npm run test:coverage` to generate a coverage report. The report will be available in the `coverage/` directory.

Current coverage targets:
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

## CI/CD Integration

These tests are designed to run in CI/CD pipelines. They are fast, reliable, and don't depend on external APIs.

## Troubleshooting

### Tests fail with "Cannot find module"
Run `npm install` to ensure all dependencies are installed.

### TypeScript errors in tests
Make sure `@types/mocha`, `@types/chai`, and `@types/sinon` are installed and your IDE is using the workspace TypeScript version.

### Watch mode crashes on syntax errors
This is expected behavior with Mocha + tsx. Fix the syntax error and the tests will auto-restart.
