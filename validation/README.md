# Pokemon Data Validation System

This directory contains all Pokemon data validation tools and resources, completely separate from the main Pokemon Walkthrough Project.

## Directory Structure

```text
validation/
├── README.md                    # This file
├── validation-report.css        # Styles for validation reports
├── validation-report.js         # Interactive features for reports
├── scripts/                     # Validation logic and CLI tools
│   ├── README.md               # Detailed usage documentation
│   ├── pokemon-validator.js    # Core validation engine
│   ├── html-report-generator.js # Report generation
│   ├── validation-cli.js       # Command-line interface
│   └── server-data-fetcher.js  # External data fetching
├── data/                       # Validation metadata and stats
│   ├── statistics.json         # Validation statistics
│   └── in-game-validated.json  # In-game validation records
└── reports/                    # Generated validation reports
    └── (auto-generated HTML reports)
```

## Architecture Separation

**This validation system is intentionally separate from the main project:**

- **Main Project**: VS Code extension-only approach, no external dependencies
- **Validation System**: Node.js development tool (requires manual dependency setup)

## Quick Start

See [`scripts/README.md`](scripts/README.md) for detailed usage instructions.

### Basic Usage

```bash
# Navigate to the validation directory
cd validation

# Note: External dependencies required for data fetching
# See scripts/README.md for dependency setup instructions

# Run validation
node scripts/validation-cli.js
```

### Key Features

- **External Source Verification**: Cross-references Pokemon data with Bulbapedia and Serebii
- **Interactive HTML Reports**: Comprehensive reports with filtering and search
- **In-Game Validation Tracking**: Records manually verified in-game data
- **Progress Monitoring**: Tracks validation improvements over time

## Integration with Main Project

The validation system:

1. **Reads**: Pokemon data from `/data/core/gen1/pokemon.json`
2. **Validates**: Against external sources and in-game verification
3. **Reports**: Generates detailed HTML reports in `validation/reports/`
4. **Tracks**: Progress and statistics in `validation/data/`

The main Pokemon Walkthrough Project remains completely independent and requires no knowledge of this validation system.

## Development Note

This validation system uses npm dependencies and Node.js, which contradicts the main project's architecture by design. This separation allows:

- **Main Project**: Stays simple, accessible, and framework-free
- **Validation**: Uses powerful tools for reliable data accuracy verification

Both systems can evolve independently while serving their specific purposes.
