# PubMed Article Fetcher - Test Suite

This directory contains comprehensive test files for the PubMed Article Fetcher plugin functionality.

## 📁 Test Files

### **Individual Test Files**

- **`test-pmc.js`** - PMC URL processing tests
  - PMC ID extraction from URLs
  - PMC to PubMed ID conversion
  - URL pattern matching and replacement
  - API integration testing

- **`test-doi.js`** - DOI URL processing tests
  - DOI extraction from URLs and direct input
  - DOI cleaning and validation
  - DOI to PubMed ID conversion
  - CrossRef API integration
  - URL pattern matching and replacement

- **`test-pmid.js`** - PubMed ID processing tests
  - PubMed ID extraction from URLs
  - PubMed API data fetching
  - Citation formatting
  - URL pattern matching and replacement
  - Edge case handling

- **`test-duplicate-prevention.js`** - Duplicate citation prevention tests
  - Detection of already cited articles
  - Skip logic for existing citations
  - Mixed content processing scenarios
  - Edge case handling for duplicate detection
  - Comprehensive scenario testing

- **`test-enhanced-detection.js`** - Enhanced citation detection tests
  - Detection of incomplete citations (missing links)
  - Title and year matching for duplicate prevention
  - Real-world scenario testing
  - Mixed citation format handling
  - Advanced duplicate detection logic

### **Test Runners**

- **`run-tests.js`** - Simple test runner (recommended)
  - Runs all tests sequentially
  - Provides summary results
  - Handles errors gracefully
  - Adds delays between API calls

- **`test-all.js`** - ES modules test runner
  - Uses dynamic imports
  - Requires Node.js with ES module support

## 🚀 Running Tests

### **Quick Start**
```bash
# Run all tests
node run-tests.js

# Run individual tests
node test-pmc.js
node test-doi.js
node test-pmid.js
node test-duplicate-prevention.js
node test-enhanced-detection.js
```

### **Test Coverage**

The test suite covers:

✅ **URL Extraction**
- PubMed URLs: `https://pubmed.ncbi.nlm.nih.gov/38570095/`
- PMC URLs: `https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/`
- DOI URLs: `https://doi.org/10.1016/j.clinme.2024.100038`
- Direct IDs: `38570095`, `PMC6792392`, `10.1016/j.clinme.2024.100038`

✅ **API Integration**
- NCBI E-utilities (PubMed & PMC)
- CrossRef API
- Error handling
- Rate limiting prevention (350ms delays)
- Performance optimization (quick checks before API calls)

✅ **URL Processing**
- Pattern matching
- URL replacement
- Regex escaping
- Edge cases

✅ **Citation Formatting**
- PubMed + PMC format
- PubMed + DOI format
- PubMed only format
- DOI only format

✅ **Edge Cases**
- Invalid URLs
- Empty strings
- Malformed IDs
- Network errors

✅ **URL Specificity**
- Only matches exact PubMed/PMC/DOI URL patterns
- Rejects other academic sites (arXiv, Google Scholar, etc.)
- Rejects general websites (Google, GitHub, Wikipedia)
- Rejects similar but incorrect URL formats
- Mixed content processing with multiple URL types

✅ **Duplicate Prevention**
- Detection of already cited articles
- Skip logic for existing citations
- Mixed content with new and existing citations
- Robust edge case handling
- Performance optimization (no redundant API calls)

✅ **Enhanced Detection**
- Detection of incomplete citations (missing links)
- Title and year matching for duplicate prevention
- Real-world scenario testing
- Mixed citation format handling
- Advanced duplicate detection logic

✅ **Performance Optimization**
- Quick pattern checks before API calls (80% reduction in API calls)
- Two-layer detection system (quick check + full check)
- Skip already cited URLs without API requests
- Rate limiting compliance (350ms delays)
- Enhanced debugging with detailed console logging

## 🔍 Test Results

All tests should pass with output like:

```
📊 Test Results Summary:
------------------------------
✅ PASS PMC Tests
✅ PASS DOI Tests
✅ PASS PubMed ID Tests
✅ PASS Duplicate Prevention Tests
✅ PASS Enhanced Detection Tests
------------------------------
Total: 5 passed, 0 failed

🎉 All tests passed! The plugin should work correctly.
```

## 🐛 Debugging

If tests fail:

1. **Check network connectivity** - Tests require internet access for API calls
2. **API rate limits** - Tests include delays, but NCBI may still rate limit
3. **Node.js version** - Requires Node.js 14+ for async/await support
4. **Test data** - Some test articles may become unavailable over time

## 📝 Test Data Used

- **PMC ID**: `PMC6792392` → PubMed ID: `30321896`
- **PubMed ID**: `38570095` → DOI: `10.1016/j.clinme.2024.100038`
- **DOI**: `10.1016/j.clinme.2024.100038` → PubMed ID: `38570095`

## 🎯 URL Specificity Testing

The test suite includes comprehensive specificity testing to ensure that URL patterns only match the intended academic URLs:

### **What Gets Tested:**

#### **Valid URLs (Should Match):**
- **PubMed:** `https://pubmed.ncbi.nlm.nih.gov/38570095/`
- **PMC:** `https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/`
- **DOI:** `https://doi.org/10.1016/j.clinme.2024.100038`

#### **Invalid URLs (Should NOT Match):**
- **Other academic sites:** arXiv, Google Scholar, ResearchGate, Sci-Hub
- **General websites:** Google, GitHub, Wikipedia, Example domains
- **Similar but incorrect patterns:**
  - `https://pubmedx.ncbi.nlm.nih.gov/38570095/` (typo)
  - `https://pmc.ncbi.nlm.nih.gov/article/PMC6792392/` (wrong path)
  - `https://doi.org/abc` (invalid DOI format)
  - `https://www.ncbi.nlm.nih.gov/pubmed/38570095/` (wrong subdomain)

### **Mixed Content Testing:**
Tests verify that in text containing multiple URL types, only the valid academic URLs are extracted and processed:

```
Valid: https://pubmed.ncbi.nlm.nih.gov/38570095/ ✅
Valid: https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/ ✅
Valid: https://doi.org/10.1016/j.clinme.2024.100038 ✅
Invalid: https://google.com/search?q=pubmed ❌
Invalid: https://github.com/user/repo ❌
Invalid: https://arxiv.org/abs/1234.5678 ❌
```

### **Why This Matters:**
- **Prevents false positives** - Won't process random website links
- **Maintains accuracy** - Only processes legitimate academic URLs
- **User confidence** - Users know exactly what will be processed
- **Performance** - Avoids unnecessary API calls for invalid URLs

## ⚡ Performance Optimization Testing

The test suite verifies that the plugin's performance optimizations work correctly:

### **Two-Layer Detection System:**
1. **Quick Check** (no API call): Skips already cited URLs using pattern matching
2. **Full Check** (API call if needed): Fetches article data only for new URLs

### **Expected Behavior:**
```
Found 5 links to process...
PubMed ID 30707071 already cited, skipping          ← No API call
PubMed ID 38570095 already cited, skipping          ← No API call
Processing PMC ID: PMC6792392                         ← API call + process ✅
PMC ID PMC11066135 already cited, skipping          ← No API call
DOI 10.1089/jpm.2018.0617 already cited, skipping   ← No API call
Result: 5 URLs found, 1 processed, 4 skipped (80% reduction in API calls)
```

### **Benefits Tested:**
- **Faster processing** - No waiting for API responses for already cited articles
- **Rate limit compliance** - Fewer API calls prevent 429 errors
- **Better user experience** - Immediate feedback for already cited content
- **Scalability** - Efficient processing of notes with many existing citations

## 🐛 Debugging Features

The enhanced logging provides detailed feedback:

```
Processing PMC ID: PMC6792392
  Found PubMed ID: 30321896
  Article: Neuropalliative Care: A Practical Guide for the Neurologist.
  Already cited: false
  ✅ Processed PMC PMC6792392
```

This helps with:
- **Troubleshooting** - See exactly what's happening at each step
- **Performance monitoring** - Track which URLs are processed vs skipped
- **Error diagnosis** - Clear indication of where issues occur

## 🔄 Updating Tests

When adding new features:

1. Add corresponding tests to the relevant test file
2. Update the test runner if adding new test files
3. Test with real data first, then mock if needed
4. Update this README with new test coverage
5. Add specificity tests for any new URL patterns

## 🛠️ Development

The test files mirror the actual plugin code structure:

```javascript
// Functions in test files match main.ts:
extractPubMedId()    // Same logic
extractPMCId()       // Same logic  
extractDOI()         // Same logic
findPubMedIdFromPMC() // Same API calls
findPubMedIdFromDOI() // Same API calls
formatCitation()     // Same formatting
```

This ensures tests accurately reflect plugin behavior.

## 📞 Support

If tests fail unexpectedly:

1. Check the individual test output for specific error messages
2. Verify the main.ts file matches the test expectations
3. Test with a simple URL first to ensure basic functionality
4. Check for API changes or deprecations

---

**Remember**: These tests use live APIs, so they depend on external service availability and may occasionally fail due to network issues or API changes.
