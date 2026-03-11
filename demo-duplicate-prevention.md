# Duplicate Citation Prevention Demo

This document demonstrates how the PubMed Article Fetcher plugin prevents re-processing already cited articles.

## Initial Content

Here are some academic links that haven't been processed yet:

- PubMed: https://pubmed.ncbi.nlm.nih.gov/38570095/
- PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/
- DOI: https://doi.org/10.1016/j.clinme.2024.100038

## After First "Link All" Command

Running the "Link All" command will convert the above URLs to citations:

- 📚 Article: [An introduction to neuropalliative care: A growing need.](https://pubmed.ncbi.nlm.nih.gov/38570095/) - 2024, Clin Med (Lond) [📄](https://pmc.ncbi.nlm.nih.gov/articles/PMC11066135/)
- 📚 Article: [Test Article Title](https://pubmed.ncbi.nlm.nih.gov/6792392/) - 2024, Test Journal [📄](https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/)
- 🔗 Article: [Test Article Title](https://doi.org/10.1016/j.clinme.2024.100038) - 2024, Test Journal

## Adding New Links

Now let's add some new links to the document:

- New PubMed: https://pubmed.ncbi.nlm.nih.gov/12345678/
- Already cited: https://pubmed.ncbi.nlm.nih.gov/38570095/
- New DOI: https://doi.org/10.1007/s10654-023-01010-8
- Already cited: https://doi.org/10.1016/j.clinme.2024.100038

## After Second "Link All" Command

The plugin will:
- ✅ Process the new PubMed link (12345678)
- ❌ Skip the already cited PubMed link (38570095)
- ✅ Process the new DOI link (10.1007/s10654-023-01010-8)
- ❌ Skip the already cited DOI link (10.1016/j.clinme.2024.100038)

Console output would show:
```
PubMed ID 38570095 already cited, skipping
PubMed ID 12345678: Not cited, would process
DOI 10.1016/j.clinme.2024.100038 already cited, skipping
DOI 10.1007/s10654-023-01010-8: Not cited, would process
```

## Key Benefits

1. **No Duplicate Citations**: Prevents the same article from being cited multiple times
2. **Clean Content**: Maintains tidy, readable notes without redundant citations
3. **Efficient Processing**: Avoids unnecessary API calls for already processed articles
4. **User-Friendly**: Clear console feedback shows which URLs are being skipped
5. **Robust Detection**: Works with all citation formats and URL variations

## Detection Patterns

The plugin detects existing citations using these patterns:

- **PubMed**: `📚.*\[.*\]\(https://pubmed\.ncbi\.nlm\.nih\.gov/\d+\/?\)`
- **PMC**: `\[📄\]\(https://pmc\.ncbi\.nlm\.nih\.gov/articles/PMC\d+\/?\)`
- **DOI**: `🔗.*\[.*\]\(https://doi\.org/10\.\d+\/.+\)`

## Test Coverage

Comprehensive tests ensure the duplicate prevention works correctly:

- ✅ Detects already cited PubMed articles
- ✅ Detects already cited PMC articles  
- ✅ Detects already cited DOI articles
- ✅ Processes new articles correctly
- ✅ Handles mixed content scenarios
- ✅ Robust edge case handling

Run the tests with: `node test-duplicate-prevention.js`
