# Pokemon Validation Scripts

This directory contains the core validation logic for ensuring Pokemon data accuracy and consistency.

## Parent Directory Note

This is part of the `/validation` system - see [`../README.md`](../README.md) for overall system architecture.

## Scripts Overview

### Core Validation System

- **`pokemon-validator.js`** - Main validation engine comparing local data against external sources
- **`html-report-generator.js`** - Generates comprehensive HTML validation reports
- **`validation-cli.js`** - Command-line interface for running validations

### Data Fetching

- **`server-data-fetcher.js`** - Fetches Pokemon data from Bulbapedia and Serebii (requires external dependencies)

## Dependencies

These validation scripts require Node.js and external packages for web scraping:

**Manual Setup Required:**

- `cheerio` - HTML parsing for web scraping
- `axios` - HTTP client for web requests

**Setup Options:**

1. **Local Installation**: `npm install cheerio axios` (creates local node_modules)
2. **Global Installation**: `npm install -g cheerio axios` (system-wide)
3. **Alternative**: Use different HTTP/HTML parsing libraries as needed

**Note:** The main Pokemon Walkthrough Project uses NO external dependencies. This validation system is a separate development tool only.

## Usage

### Running Validation (Recommended)

```bash
# Validate all Pokemon data
node validation-cli.js

# Validate specific Pokemon by ID
node validation-cli.js --pokemon 1,4,7

# Run in silent mode (errors only)
node validation-cli.js --silent
```

### Alternative: Direct Script Execution

```bash
# Run validator directly (if external dependencies are available)
node pokemon-validator.js
```

### Viewing Results

Validation reports are generated in the `../reports` directory as HTML files with:

- Interactive filtering and search
- Visual analytics charts
- Detailed comparison tables
- Dark/light mode support

## Architecture Separation

**Main Project (VS Code Extension Approach):**

- Static HTML, CSS, JavaScript
- No npm dependencies
- Uses VS Code Live Server extension
- Client-side only with localStorage

**Validation Scripts (Development Tools):**

- Node.js based for reliable web scraping
- External dependencies for HTML parsing
- Server-side data fetching capabilities
- Generates reports for development use

## Integration

The validation scripts:

1. Read Pokemon data from `../../data/core/gen1/pokemon.json`
2. Fetch reference data from external sources
3. Compare and identify discrepancies
4. Generate HTML reports for review
5. Output results to `../reports` directory

The main project remains completely independent of these validation tools.
