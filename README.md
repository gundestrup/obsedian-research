# PubMed Article Fetcher Plugin for Obsidian

This Obsidian plugin allows you to fetch article metadata from PubMed ID or DOI links and automatically create notes with the article information.

## Features

- **Fetch by PubMed ID**: Enter a numeric PubMed ID (e.g., `38570095`)
- **Fetch by PMC ID**: Enter a PubMed Central ID (e.g., `PMC6792392`)
- **Fetch by DOI**: Enter a DOI link (e.g., `10.1016/j.clinme.2024.100038`)
- **Automatic Detection**: The plugin automatically detects whether you've entered a PubMed ID, PMC ID, or DOI
- **Rich Metadata**: Extracts article title, journal name, and year of publication
- **Full Text Access**: PMC links provide direct access to free full-text articles
- **Note Creation**: Automatically creates a new note with the fetched information

## Installation

1. Clone this repository to your Obsidian plugins directory
2. Run `npm install` to install dependencies
3. Run `npm run build` to compile the plugin
4. Enable the plugin in Obsidian settings

## Usage

### Method 1: Command Palette (Creates New Note)

1. Open the command palette in Obsidian (Cmd/Ctrl + P)
2. Search for "PubMed Article Fetcher Note - Create new note with article info" and select it
3. Enter any of the following formats:
   - **PubMed ID**: `38570095`
   - **PubMed URL**: `https://pubmed.ncbi.nlm.nih.gov/38570095/`
   - **PMC ID**: `PMC6792392`
   - **PMC URL**: `https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/`
   - **DOI**: `10.1016/j.clinme.2024.100038`
   - **DOI URL**: `https://doi.org/10.1016/j.clinme.2024.100038`
4. Press Enter or click "Fetch Article"
5. The plugin creates a new note with article information **including a clickable link**

**Note Template:**
```markdown
# Article Title

**Journal:** Journal Name  
**Year:** 2024  
**Link:** https://pubmed.ncbi.nlm.nih.gov/ID/  
**ID:** PMID or DOI

---

*Fetched by PubMed Article Fetcher plugin*
```

### Method 2: Inline Text Replacement (While Writing)

1. **Type or paste** any supported format in your note:
   - PubMed ID: `38570095`
   - PubMed URL: `https://pubmed.ncbi.nlm.nih.gov/38570095/`
   - PMC ID: `PMC6792392`
   - PMC URL: `https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/`
   - DOI: `10.1016/j.clinme.2024.100038`
   - DOI URL: `https://doi.org/10.1016/j.clinme.2024.100038`
2. **Select the text** with your cursor
3. **Right-click** and choose "PubMed Article Fetcher Link Selected" from the context menu
   - OR use Command Palette: "PubMed Article Fetcher Link Selected - Update selected link only"
4. The selected text is **replaced** with a formatted citation with clickable link

### Method 3: Batch Processing - Current Note (Update All Links)

1. Open a note that contains multiple PubMed URLs, PMC URLs, or DOI URLs
2. Open the command palette (Cmd/Ctrl + P)
3. Search for "PubMed Article Fetcher Link All - Update all links in current note only"
4. The plugin will find all PubMed, PMC, and DOI URLs in the current note and convert them to formatted citations
5. Shows progress: "Found X links to process in current note..." and "Successfully processed Y of X links in current note"

### Method 4: Batch Processing - All Notes (Global Update)

**⚠️ IMPORTANT:** This command is disabled by default for safety. To enable:
1. Go to Settings > PubMed Article Fetcher
2. Enable "Enable Global Update Command"
3. Reload Obsidian

**Once enabled:**
1. Open the command palette (Cmd/Ctrl + P)
2. Search for "PubMed Article Fetcher Link Global - Update all links in all notes"
3. A folder selection dialog will appear:
   - Choose "📁 All notes in vault" to process everything
   - OR select a specific folder (will include all subfolders)
4. The plugin will scan the selected folder for PubMed, PMC, and DOI URLs
5. Converts all found URLs to formatted citations
6. Shows progress: "Scanning X notes in folder: Y..." and "Global update complete: Processed A of B links across C notes"

**⚠️ SAFETY WARNINGS:**
- This command modifies multiple files automatically
- **Always backup your vault before using this command**
- Test on a small folder first before running on entire vault
- The command processes folders recursively (includes all subfolders)
- Only actual PubMed/PMC/DOI URLs are processed (not random numbers)

**Examples:**

**PubMed Example:**
- Type: `https://pubmed.ncbi.nlm.nih.gov/38570095/`
- Result: `📚 Review: [An introduction to neuropalliative care](https://pubmed.ncbi.nlm.nih.gov/38570095/) - 2024, Clin Med (Lond) [🔗](https://doi.org/10.1016/...)`

**PMC Example (Preferred):**
- Type: `PMC6792392` or `https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/`
- Result: `📚 Journal Article: [Top Ten Tips Palliative Care Clinicians Should Know About Caring for Patients with Neurologic Illnesses.](https://pubmed.ncbi.nlm.nih.gov/30707071/) - 2019, J Palliat Med [📄](https://pmc.ncbi.nlm.nih.gov/articles/PMC6792392/)`

**Citation Icons:**
- **📚 Book icon** for PubMed articles (links to PubMed abstract)
- **📄 Document icon** for PMC articles (links to free full text)
- **🔗 Link icon** for DOI links (links to publisher page)
- **Article Type** (Review, Article, etc.) included in citation
- **Clickable Title** links to primary source
- **Year and Journal** name

## Settings

You can optionally add your NCBI API key in the plugin settings for higher rate limits:
1. Go to Settings > Community Plugins > PubMed Article Fetcher
2. Enter your NCBI API key (get one from https://www.ncbi.nlm.nih.gov/account/dev/)

## Development

- `npm run dev` - Start development mode with hot reloading
- `npm run build` - Build the plugin for production

## API Sources

- **PubMed**: Uses NCBI E-utilities API
- **DOI**: Uses Crossref API

## License

AGPL-3.0
