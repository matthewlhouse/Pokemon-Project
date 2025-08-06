/**
 * HTML Report Generator for Pokemon Validation
 *
 * Focused, modular approach to generating interactive HTML validation reports
 * with clean separation of concerns and easy-to-maintain code.
 */

const fs = require('fs').promises;
const path = require('path');

class HTMLReportGenerator {
    constructor() {
        this.timestamp = new Date().toLocaleString();
    }

    /**
     * Main entry point - generate complete HTML report
     */
    async generateReport(results, outputPath) {
        const html = this.buildCompleteHTML(results);
        await fs.writeFile(outputPath, html, 'utf8');
        return outputPath;
    }

    /**
     * Build the complete HTML document
     */
    buildCompleteHTML(results) {
        return `<!DOCTYPE html>
<html lang="en">
${this.generateHead()}
<body>
    ${this.generateHeader()}
    ${this.generateAnalyticsSection(results)}
    ${this.generateControls(results)}
    ${this.generateResultsSection(results)}
    <script src="../js/validation-report.js"></script>
</body>
</html>`;
    }

    /**
     * Generate HTML head section with external stylesheets
     */
    generateHead() {
        return `<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Pokemon Validation Report - Database accuracy verification">
    <meta name="author" content="Pokemon Project Validator">
    <title>Pokemon Validation Report - ${this.timestamp}</title>
    <link rel="stylesheet" href="../css/validation-report.css">
</head>`;
    }

    /**
     * Generate report header section
     */
    generateHeader() {
        const dateFormatted = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const timeFormatted = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });

        return `<div class="header">
    <div class="header-content">
        <h1>🔍 Pokemon Validation Report</h1>
        <button id="dark-mode-toggle" class="dark-mode-toggle" aria-label="Toggle dark mode" title="Toggle dark mode">
            <span class="dark-mode-icon"></span>
        </button>
    </div>
    <div class="header-info">
        <p><strong>Generated:</strong> ${dateFormatted} at ${timeFormatted}</p>
    </div>
</div>`;
    }

    /**
     * Generate interactive charts section
     */
    generateChartsSection(results) {
        const stats = this.calculateDetailedStats(results);

        return `<div class="charts">
        <details class="summary-section collapsible-section" open>
    <summary class="section-summary">
        <h3>📈 Visual Analytics</h3>
    </summary>
    <div class="charts-container" id="charts-container">
        <div class="chart-grid">
            <div class="chart-card">
                <h4>Validation Completion</h4>
                <div class="chart-wrapper">
                    <canvas id="completion-chart" width="300" height="300" aria-label="Pokemon validation completion donut chart"></canvas>
                    <div class="chart-legend" id="completion-legend" role="list" aria-label="Completion chart legend"></div>
                </div>
            </div>
            <div class="chart-card">
                <h4>Issue Breakdown</h4>
                <div class="chart-wrapper">
                    <canvas id="issues-chart" width="400" height="300" aria-label="Issue severity breakdown bar chart"></canvas>
                    <div class="chart-legend" id="issues-legend" role="list" aria-label="Issues chart legend"></div>
                </div>
            </div>
            <div class="chart-card">
                <h4>Validation Levels</h4>
                <div class="chart-wrapper">
                    <canvas id="levels-chart" width="400" height="250" aria-label="Validation level distribution bar chart"></canvas>
                    <div class="chart-legend" id="levels-legend" role="list" aria-label="Validation levels chart legend"></div>
                </div>
            </div>
            <div class="chart-card">
                <h4>Average Completeness Trend</h4>
                <div class="chart-wrapper">
                    <canvas id="trend-chart" width="500" height="300" aria-label="Historical average completeness trend line chart"></canvas>
                    <div class="chart-legend" id="trend-legend" role="list" aria-label="Trend chart legend"></div>
                </div>
            </div>
        </div>
    </div>
    <script>
        // Pass chart data to JavaScript
        window.chartData = ${JSON.stringify({
            completion: {
                complete: stats.fullyValidated,
                highValidation: stats.highlyValidated,
                lowValidation: stats.lowValidated,
                total: stats.total,
            },
            issues: {
                totalIssues: stats.totalIssues,
                severityCounts: stats.severityCounts,
            },
            levels: {
                complete: stats.fullyValidated,
                high: stats.highlyValidated,
                low: stats.lowValidated,
            },
        })};
    </script>
</details>
</div>`;
    }

    /**
     * Generate filter controls section
     */
    generateControls(results) {
        const stats = this.calculateBasicStats(results);

        return `<div class="controls">
    <div class="search-group">
        <label for="pokemon-search">Search Pokemon:</label>
        <div class="search-input-wrapper">
            <input 
                type="text" 
                id="pokemon-search" 
                class="search-input" 
                placeholder="Type Pokemon name..."
                aria-label="Search Pokemon by name"
                autocomplete="off"
            >
            <button 
                id="clear-search" 
                class="clear-search-btn" 
                aria-label="Clear search"
                title="Clear search"
                type="button"
            >
                ✕
            </button>
        </div>
        <div id="search-results-count" class="search-results-count" aria-live="polite"></div>
    </div>

    <div class="filter-group">
        <label>Show Pokemon:</label>
        <div class="filter-buttons" role="group" aria-label="Pokemon validation level filters">
            ${this.generatePokemonFilterButtons(stats)}
        </div>
    </div>

    <div class="filter-group">
        <label>Show Attributes:</label>
        <div class="filter-buttons" role="group" aria-label="Attribute display filters">
            ${this.generateAttributeFilterButtons()}
        </div>
    </div>
</div>`;
    }

    /**
     * Generate Pokemon filter buttons
     */
    generatePokemonFilterButtons(stats) {
        return `
            <button class="filter-btn active" data-filter="pokemon" data-value="all" 
                    aria-pressed="true" role="button" tabindex="0">
                All Pokemon <span class="count">${stats.total}</span>
            </button>
            <button class="filter-btn" data-filter="pokemon" data-value="complete" 
                    aria-pressed="false" role="button" tabindex="0">
                100% Validated <span class="count">${stats.fullyValidated}</span>
            </button>
            <button class="filter-btn" data-filter="pokemon" data-value="high" 
                    aria-pressed="false" role="button" tabindex="0">
                75%+ Validated <span class="count">${stats.highlyValidated}</span>
            </button>
            <button class="filter-btn" data-filter="pokemon" data-value="low" 
                    aria-pressed="false" role="button" tabindex="0">
                Below 75% <span class="count">${stats.lowValidated}</span>
            </button>`;
    }

    /**
     * Generate attribute filter buttons
     */
    generateAttributeFilterButtons() {
        return `
            <button class="filter-btn active" data-filter="attributes" data-value="all" 
                    aria-pressed="true" role="button" tabindex="0">
                All Attributes
            </button>
            <button class="filter-btn" data-filter="attributes" data-value="validated" 
                    aria-pressed="false" role="button" tabindex="0">
                Validated Only
            </button>
            <button class="filter-btn" data-filter="attributes" data-value="issues" 
                    aria-pressed="false" role="button" tabindex="0">
                Issues & No Reference
            </button>`;
    }

    /**
     * Generate a collapsible analytics section containing all summary and charts
     */
    generateAnalyticsSection(results) {
        return `<details class="analytics-wrapper" open>
    <summary class="analytics-summary">
        <h2>📊 Data Analytics & Validation Summary</h2>
    </summary>
    <div class="analytics-content">
        ${this.generateSummary(results)}
        ${this.generateChartsSection(results)}
    </div>
</details>`;
    }

    /**
     * Generate summary statistics section
     */
    generateSummary(results) {
        const stats = this.calculateDetailedStats(results);

        return `<div class="summary">
    <details class="summary-section collapsible-section" open>
        <summary class="section-summary">
            <h3>📊 Validation Overview</h3>
        </summary>
        <div class="summary-grid">
            ${this.generateSummaryCard('Total Pokemon', stats.total, 'total')}
            ${this.generateSummaryCard('Needs Review', stats.lowValidated, 'needs-review')}
            ${this.generateSummaryCard('Well Validated', stats.highlyValidated, 'high-validation')}
            ${this.generateSummaryCard('Complete', stats.fullyValidated, 'complete')}
        </div>
    </details>
    <details class="summary-section collapsible-section" open>
        <summary class="section-summary">
            <h3>🔍 Issues Breakdown</h3>
        </summary>
        <div class="summary-grid">
            ${this.generateSummaryCard('Total Issues', stats.totalIssues, 'total-issues')}
            ${this.generateSummaryCard('Missing Attributes', stats.severityCounts.missing_attribute || 0, 'missing-attributes')}
            ${this.generateSummaryCard('Data Mismatches', stats.severityCounts.inaccurate || 0, 'mismatches')}
            ${this.generateSummaryCard('Source Conflicts', stats.severityCounts.source_conflict || 0, 'conflicts')}
            ${this.generateSummaryCard('Partial Matches', stats.severityCounts.partial_match || 0, 'partial-matches')}
            ${this.generateSummaryCard('No Reference', stats.severityCounts.no_reference || 0, 'no-reference')}
        </div>
    </details>
    <details class="summary-section collapsible-section" open>
        <summary class="section-summary">
            <h3>🕒 Progress Since Last Report</h3>
        </summary>
        <div class="progress-controls">
            <button id="export-history-btn" class="export-history-btn" title="Export historical validation data">
                📊 Export History
            </button>
        </div>
        <div id="progress-summary" class="progress-summary">
            <div class="progress-loading">
                📊 Analyzing changes since previous report...
            </div>
        </div>
    </details>
</div>`;
    }

    /**
     * Generate a single summary card with optional type for styling
     */
    generateSummaryCard(title, value, type = '') {
        const typeClass = type ? ` summary-card-${type}` : '';
        return `<div class="summary-card${typeClass}">
    <h4>${title}</h4>
    <div class="number">${value}</div>
</div>`;
    }

    /**
     * Generate results count and Pokemon list section
     */
    generateResultsSection(results) {
        return `<div class="pokemon-results" id="pokemon-results">
    <div class="virtual-scroll-container" id="virtual-scroll-container">
        <div class="virtual-scroll-spacer-top" id="virtual-scroll-spacer-top"></div>
        <div class="virtual-scroll-content" id="virtual-scroll-content">
            ${this.generatePokemonCards(results)}
        </div>
        <div class="virtual-scroll-spacer-bottom" id="virtual-scroll-spacer-bottom"></div>
    </div>
</div>`;
    }

    /**
     * Generate all Pokemon cards
     */
    generatePokemonCards(results) {
        return results.map(result => this.generatePokemonCard(result)).join('');
    }

    /**
     * Generate a single Pokemon card
     */
    generatePokemonCard(result) {
        const completeness = Math.round(result.completeness || 0);
        const issueCount = result.issues?.length || 0;
        const validatedCount = 11 - issueCount; // Total fields - issues = validated fields

        return `<div class="pokemon-card collapsed" 
                     data-completeness="${completeness}"
                     data-issue-count="${issueCount}"
                     data-validated-count="${validatedCount}"
                     data-pokemon-id="${result.id}"
                     data-pokemon-name="${result.name || 'Unnamed'}">
    ${this.generatePokemonHeader(result)}
    ${this.generatePokemonContent(result)}
</div>`;
    }

    /**
     * Generate Pokemon card header (always visible)
     */
    generatePokemonHeader(result) {
        const completeness = Math.round(result.completeness || 0);
        const issueCount = result.issues?.length || 0;
        const validatedCount = 11 - issueCount;

        return `<div class="pokemon-header" 
                     role="button" 
                     tabindex="0" 
                     aria-expanded="false"
                     aria-label="Toggle details for ${result.name || 'Unnamed'} - ${completeness}% validated">
    <div class="pokemon-name-section">
        <div class="pokemon-name">${result.name || 'Unnamed'}</div>
        <div class="pokemon-id">#${result.id}</div>
        <div class="pokemon-stats">
            <span class="stat-item" title="${validatedCount} fields validated">
                ✅ ${validatedCount}
            </span>
            ${issueCount > 0 ? `<span class="stat-item" title="${issueCount} fields with issues">⚠️ ${issueCount}</span>` : ''}
        </div>
        <div class="collapse-indicator" aria-hidden="true">▼</div>
    </div>
    <div class="completeness-section">
        ${this.generateCompletenessBar(completeness)}
        ${this.generateCompletenessText(result)}
    </div>
</div>`;
    }

    /**
     * Generate completeness progress bar
     */
    generateCompletenessBar(completeness) {
        const colorClass = this.getCompletenessColorClass(completeness);

        return `<div class="completeness-bar" role="progressbar" 
                     aria-valuenow="${completeness}" 
                     aria-valuemin="0" 
                     aria-valuemax="100"
                     aria-label="Validation completeness: ${completeness}%">
    <div class="completeness-fill ${colorClass}" style="width: ${completeness}%"></div>
    <div class="completeness-segments" aria-hidden="true">
        <div class="segment" style="left: 25%"></div>
        <div class="segment" style="left: 50%"></div>
        <div class="segment" style="left: 75%"></div>
    </div>
</div>`;
    }

    /**
     * Generate completeness text with tooltip
     */
    generateCompletenessText(result) {
        const completeness = Math.round(result.completeness || 0);
        const tooltip = this.generateCompletenessTooltip(result);
        const issueCount = result.issues?.length || 0;
        const validatedCount = 11 - issueCount;

        return `<div class="completeness-text" 
                     tabindex="0" 
                     role="button"
                     aria-label="Validation details: ${completeness}% complete, ${validatedCount} validated, ${issueCount} issues">
    <div class="completeness-percentage">${completeness}%</div>
    <div class="completeness-breakdown">
        <small>${validatedCount}/11 validated</small>
    </div>
    <div class="tooltip" role="tooltip" aria-hidden="true">${tooltip}</div>
</div>`;
    }

    /**
     * Generate completeness tooltip content
     */
    generateCompletenessTooltip(result) {
        const completeness = Math.round(result.completeness || 0);
        const issueCount = result.issues?.length || 0;
        const validatedCount = 11 - issueCount;
        const inGameCount = result.inGameValidatedFields?.length || 0;

        const breakdownHTML = `
            <div class="tooltip-section">
                <strong>Validation Breakdown:</strong><br>
                ✅ ${validatedCount} fields validated<br>
                ${issueCount > 0 ? `⚠️ ${issueCount} fields with issues<br>` : ''}
                ${inGameCount > 0 ? `🎮 ${inGameCount} verified in-game<br>` : ''}
            </div>
            <div class="tooltip-section">
                <strong>Scoring:</strong><br>
                External Validation: 75% max<br>
                In-game Validation: 25% max<br>
                Current Score: ${completeness}%
            </div>
        `;

        return breakdownHTML;
    }

    /**
     * Generate Pokemon card content (collapsible)
     */
    generatePokemonContent(result) {
        return `<div class="pokemon-content" aria-hidden="true">
    ${this.generateValidationBadges(result)}
    ${this.generateIssuesSection(result)}
</div>`;
    }

    /**
     * Generate validation badges for Pokemon
     */
    generateValidationBadges(result) {
        const badges = [];

        // Only add in-game validation badge if applicable (not percentage-based)
        if (result.hasInGameValidation) {
            badges.push('<span class="validation-badge badge-in-game">In-Game Verified</span>');
        }

        // If no badges to show, return empty div to maintain structure
        if (badges.length === 0) {
            return '<div class="validation-badges"></div>';
        }

        return `<div class="validation-badges">${badges.join('')}</div>`;
    }

    /**
     * Generate issues section for Pokemon
     */
    generateIssuesSection(result) {
        // Define all required fields that should be shown
        const requiredFields = [
            'name',
            'species',
            'types',
            'baseStats',
            'height',
            'weight',
            'catchRate',
            'evolutionChain',
            'learnset',
            'tmCompatibility',
            'pokedexEntry',
        ];

        const issueMap = new Map();
        if (result.issues) {
            result.issues.forEach(issue => {
                issueMap.set(issue.field, issue);
            });
        }

        const allFieldCards = requiredFields.map(field => {
            const issue = issueMap.get(field);
            if (issue) {
                // Add pokemonId to the issue for Quick Fix functionality
                const issueWithPokemonId = { ...issue, pokemonId: result.id };
                // Generate issue card for fields with problems
                return this.generateIssueCard(issueWithPokemonId);
            } else {
                // Generate validated card for fields without issues
                return this.generateValidatedCard(field, result);
            }
        });

        return `<div class="issues">
    ${allFieldCards.join('')}
</div>`;
    }

    /**
     * Generate a single issue card
     */
    generateIssueCard(issue) {
        const severityClass = this.getSeverityClass(issue.severity);
        const acceptedClass = issue.accepted ? ' accepted' : '';

        return `<div class="issue ${severityClass}${acceptedClass} collapsed" data-pokemon-id="${issue.pokemonId}" data-field="${issue.field}">
    ${this.generateIssueHeader(issue)}
    <div class="issue-content" aria-hidden="true">
        ${this.generateIssueComparison(issue)}
        ${this.generateAcceptIssueQuickFix(issue)}
        ${this.generateInGameQuickFix(issue)}
    </div>
</div>`;
    }

    /**
     * Generate a validated field card (for fields without issues)
     */
    generateValidatedCard(field, result) {
        const isInGameValidated = result.inGameValidatedFields?.includes(field);
        const inGameClass = isInGameValidated ? ' in-game-validated' : '';

        return `<div class="issue accurate${inGameClass} collapsed">
    <div class="issue-header" 
         role="button" 
         tabindex="0" 
         aria-expanded="false"
         aria-label="Toggle details for ${field}">
        <div class="issue-field">${field}</div>
        <div class="issue-badges">
            <span class="accurate-badge">VALIDATED</span>
            ${isInGameValidated ? '<span class="in-game-badge">IN-GAME</span>' : ''}
        </div>
        <div class="collapse-indicator" aria-hidden="true">▼</div>
    </div>
    <div class="issue-content" aria-hidden="true">
        <div class="validated-details">
            <p>This field has been validated against external sources and matches expected values.</p>
            ${isInGameValidated ? '<p class="in-game-note">✅ Additional verification through in-game data collection.</p>' : ''}
        </div>
        ${this.generateInGameQuickFixForValidated(field, result)}
    </div>
</div>`;
    }

    /**
     * Generate issue header with field name and badges
     */
    generateIssueHeader(issue) {
        const statusBadge = this.generateStatusBadge(issue.severity);

        return `<div class="issue-header" 
                     role="button" 
                     tabindex="0" 
                     aria-expanded="false"
                     aria-label="Toggle details for ${issue.field}">
    <div class="issue-field">${issue.field}</div>
    <div class="issue-badges">
        ${statusBadge}
        ${issue.accepted ? '<span class="accepted-badge">ACCEPTED</span>' : ''}
        ${issue.inGameValidated ? '<span class="in-game-badge">IN-GAME</span>' : ''}
    </div>
    <div class="collapse-indicator" aria-hidden="true">▼</div>
</div>`;
    }

    /**
     * Generate status badge for issue severity
     */
    generateStatusBadge(severity) {
        const statusMap = {
            missing_attribute:
                '<span class="status-badge status-missing">🚫 MISSING ATTRIBUTE</span>',
            inaccurate: '<span class="status-badge status-mismatch">❌ MISMATCH</span>',
            partial_match: '<span class="status-badge status-conflict">⚠️ PARTIAL MATCH</span>',
            source_conflict: '<span class="status-badge status-conflict">⚠️ SOURCE CONFLICT</span>',
            no_reference: '<span class="status-badge status-no-ref">ℹ️ NO REFERENCE</span>',
        };

        return statusMap[severity] || '';
    }

    /**
     * Generate issue comparison based on severity type and field complexity
     */
    generateIssueComparison(issue) {
        // Determine the field type for specialized layout
        const fieldType = this.getFieldType(issue.field);

        switch (issue.severity) {
            case 'missing_attribute':
                return this.generateMissingAttributeComparison(issue, fieldType);
            case 'inaccurate':
                return this.generateInaccurateComparison(issue, fieldType);
            case 'partial_match':
                return this.generatePartialMatchComparison(issue, fieldType);
            case 'source_conflict':
                return this.generateSourceConflictComparison(issue, fieldType);
            case 'no_reference':
                return this.generateNoReferenceComparison(issue, fieldType);
            default:
                return '';
        }
    }

    /**
     * Determine the field type for specialized comparison layouts
     */
    getFieldType(field) {
        const simpleFields = ['species', 'types', 'height', 'weight', 'catchRate', 'pokedexEntry'];
        const simpleArrayFields = ['baseStats'];
        const complexFields = ['evolutionChain', 'learnset', 'tmCompatibility'];

        if (simpleFields.includes(field)) return 'simple';
        if (simpleArrayFields.includes(field)) return 'simpleArray';
        if (complexFields.includes(field)) return 'complex';
        return 'simple'; // Default to simple for unknown fields
    }

    /**
     * Generate comparison for missing attribute data
     */
    generateMissingAttributeComparison(issue, fieldType = 'simple') {
        const footnotes = [];
        const sources = [];

        // Add available sources and their values
        if (issue.bulbapediaValue !== undefined) {
            sources.push({ label: 'Bulbapedia', value: issue.bulbapediaValue, type: 'expected' });
        } else {
            footnotes.push('¹Bulbapedia did not provide this field');
        }

        if (issue.serebiiValue !== undefined) {
            sources.push({ label: 'Serebii', value: issue.serebiiValue, type: 'expected' });
        } else {
            footnotes.push('²Serebii did not provide this field');
        }

        // Always show current as undefined/missing
        const comparisonSources = [
            { label: 'Current', value: '(missing)', type: 'current' },
            ...sources,
        ];

        if (fieldType === 'simple') {
            return this.generateSimpleComparison(issue, comparisonSources, footnotes);
        } else if (fieldType === 'simpleArray') {
            return this.generateSimpleArrayComparison(issue, comparisonSources, footnotes);
        } else if (fieldType === 'tmCompatibility') {
            return this.generateTmCompatibilityComparison(issue, comparisonSources, footnotes);
        } else if (fieldType === 'learnset') {
            return this.generateLearnsetComparison(issue, comparisonSources, footnotes);
        } else if (fieldType === 'evolutionChain') {
            return this.generateEvolutionChainComparison(issue, comparisonSources, footnotes);
        }

        return '';
    }

    /**
     * Generate comparison for inaccurate data
     */
    generateInaccurateComparison(issue, fieldType = 'simple') {
        if (fieldType === 'simple') {
            return this.generateSimpleComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                {
                    label: 'Bulbapedia',
                    value: issue.bulbapediaValue,
                    type: issue.source === 'Bulbapedia' ? 'expected' : 'neutral',
                },
                {
                    label: 'Serebii',
                    value: issue.serebiiValue,
                    type: issue.source === 'Serebii' ? 'expected' : 'neutral',
                },
            ]);
        } else if (fieldType === 'simpleArray') {
            return this.generateSimpleArrayComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                {
                    label: 'Bulbapedia',
                    value: issue.bulbapediaValue,
                    type: issue.source === 'Bulbapedia' ? 'expected' : 'neutral',
                },
                {
                    label: 'Serebii',
                    value: issue.serebiiValue,
                    type: issue.source === 'Serebii' ? 'expected' : 'neutral',
                },
            ]);
        } else if (issue.field === 'tmCompatibility') {
            return this.generateTmCompatibilityComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                {
                    label: 'Bulbapedia',
                    value: issue.bulbapediaValue,
                    type: issue.source === 'Bulbapedia' ? 'expected' : 'neutral',
                },
                {
                    label: 'Serebii',
                    value: issue.serebiiValue,
                    type: issue.source === 'Serebii' ? 'expected' : 'neutral',
                },
            ]);
        } else if (issue.field === 'learnset') {
            return this.generateLearnsetComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                {
                    label: 'Bulbapedia',
                    value: issue.bulbapediaValue,
                    type: issue.source === 'Bulbapedia' ? 'expected' : 'neutral',
                },
                {
                    label: 'Serebii',
                    value: issue.serebiiValue,
                    type: issue.source === 'Serebii' ? 'expected' : 'neutral',
                },
            ]);
        } else if (issue.field === 'evolutionChain') {
            return this.generateEvolutionChainComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                {
                    label: 'Bulbapedia',
                    value: issue.bulbapediaValue,
                    type: issue.source === 'Bulbapedia' ? 'expected' : 'neutral',
                },
                {
                    label: 'Serebii',
                    value: issue.serebiiValue,
                    type: issue.source === 'Serebii' ? 'expected' : 'neutral',
                },
            ]);
        } else {
            // Fallback to table format for other complex fields
            return `<div class="comparison">
    <table class="comparison-table">
        <tr>
            <th>Source</th>
            <th>Value</th>
        </tr>
        <tr class="comparison-current">
            <td>Current</td>
            <td>${this.formatValue(issue.current)}</td>
        </tr>
        <tr class="comparison-expected">
            <td>${issue.source}</td>
            <td>${this.formatValue(issue.expected)}</td>
        </tr>
    </table>
    ${issue.accepted ? '<div class="accepted-note">✅ Accepted Override: This issue has been manually verified and accepted.</div>' : ''}
</div>`;
        }
    }

    /**
     * Generate comparison for partial match
     */
    generatePartialMatchComparison(issue, fieldType = 'simple') {
        if (fieldType === 'simple') {
            return this.generateSimpleComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                { label: issue.matchingSource, value: issue.matchingValue, type: 'expected' },
                { label: issue.conflictingSource, value: issue.conflictingValue, type: 'conflict' },
            ]);
        } else if (fieldType === 'simpleArray') {
            return this.generateSimpleArrayComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                { label: issue.matchingSource, value: issue.matchingValue, type: 'expected' },
                { label: issue.conflictingSource, value: issue.conflictingValue, type: 'conflict' },
            ]);
        } else if (issue.field === 'tmCompatibility') {
            return this.generateTmCompatibilityComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                { label: issue.matchingSource, value: issue.matchingValue, type: 'expected' },
                { label: issue.conflictingSource, value: issue.conflictingValue, type: 'conflict' },
            ]);
        } else if (issue.field === 'learnset') {
            return this.generateLearnsetComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                { label: issue.matchingSource, value: issue.matchingValue, type: 'expected' },
                { label: issue.conflictingSource, value: issue.conflictingValue, type: 'conflict' },
            ]);
        } else if (issue.field === 'evolutionChain') {
            return this.generateEvolutionChainComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                { label: issue.matchingSource, value: issue.matchingValue, type: 'expected' },
                { label: issue.conflictingSource, value: issue.conflictingValue, type: 'conflict' },
            ]);
        } else {
            // Fallback to table format for other complex fields
            return `<div class="comparison">
    <table class="comparison-table">
        <tr>
            <th>Source</th>
            <th>Value</th>
        </tr>
        <tr class="comparison-current">
            <td>Current</td>
            <td>${this.formatValue(issue.current)}</td>
        </tr>
        <tr class="comparison-expected">
            <td>${issue.matchingSource}</td>
            <td>${this.formatValue(issue.matchingValue)}</td>
        </tr>
        <tr class="comparison-conflict">
            <td>${issue.conflictingSource}</td>
            <td>${this.formatValue(issue.conflictingValue)}</td>
        </tr>
    </table>
    ${issue.accepted ? '<div class="accepted-note">✅ Accepted Override: This issue has been manually verified and accepted.</div>' : ''}
</div>`;
        }
    }

    /**
     * Generate comparison for source conflict
     */
    generateSourceConflictComparison(issue, fieldType = 'simple') {
        if (fieldType === 'simple') {
            return this.generateSimpleComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                { label: 'Bulbapedia', value: issue.bulbapediaValue, type: 'conflict' },
                { label: 'Serebii', value: issue.serebiiValue, type: 'conflict' },
            ]);
        } else if (fieldType === 'simpleArray') {
            return this.generateSimpleArrayComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                { label: 'Bulbapedia', value: issue.bulbapediaValue, type: 'conflict' },
                { label: 'Serebii', value: issue.serebiiValue, type: 'conflict' },
            ]);
        } else if (issue.field === 'tmCompatibility') {
            return this.generateTmCompatibilityComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                { label: 'Bulbapedia', value: issue.bulbapediaValue, type: 'conflict' },
                { label: 'Serebii', value: issue.serebiiValue, type: 'conflict' },
            ]);
        } else if (issue.field === 'learnset') {
            return this.generateLearnsetComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                { label: 'Bulbapedia', value: issue.bulbapediaValue, type: 'conflict' },
                { label: 'Serebii', value: issue.serebiiValue, type: 'conflict' },
            ]);
        } else if (issue.field === 'evolutionChain') {
            return this.generateEvolutionChainComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                { label: 'Bulbapedia', value: issue.bulbapediaValue, type: 'conflict' },
                { label: 'Serebii', value: issue.serebiiValue, type: 'conflict' },
            ]);
        } else {
            // Fallback to table format for other complex fields
            return `<div class="comparison">
    <table class="comparison-table">
        <tr>
            <th>Source</th>
            <th>Value</th>
        </tr>
        <tr class="comparison-current">
            <td>Current</td>
            <td>${this.formatValue(issue.current)}</td>
        </tr>
        <tr class="comparison-conflict">
            <td>Bulbapedia</td>
            <td>${this.formatValue(issue.bulbapediaValue)}</td>
        </tr>
        <tr class="comparison-conflict">
            <td>Serebii</td>
            <td>${this.formatValue(issue.serebiiValue)}</td>
        </tr>
    </table>
    ${issue.accepted ? '<div class="accepted-note">✅ Accepted Override: This issue has been manually verified and accepted.</div>' : ''}
</div>`;
        }
    }

    /**
     * Generate comparison for no reference data
     */
    generateNoReferenceComparison(issue, fieldType = 'simple') {
        if (fieldType === 'simple') {
            return this.generateSimpleComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                { label: 'Bulbapedia', value: issue.bulbapediaValue, type: 'neutral' },
                { label: 'Serebii', value: issue.serebiiValue, type: 'neutral' },
            ]);
        } else if (fieldType === 'simpleArray') {
            return this.generateSimpleArrayComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                { label: 'Bulbapedia', value: issue.bulbapediaValue, type: 'neutral' },
                { label: 'Serebii', value: issue.serebiiValue, type: 'neutral' },
            ]);
        } else if (issue.field === 'tmCompatibility') {
            return this.generateTmCompatibilityComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                { label: 'Bulbapedia', value: issue.bulbapediaValue, type: 'neutral' },
                { label: 'Serebii', value: issue.serebiiValue, type: 'neutral' },
            ]);
        } else if (issue.field === 'learnset') {
            return this.generateLearnsetComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                { label: 'Bulbapedia', value: issue.bulbapediaValue, type: 'neutral' },
                { label: 'Serebii', value: issue.serebiiValue, type: 'neutral' },
            ]);
        } else if (issue.field === 'evolutionChain') {
            return this.generateEvolutionChainComparison(issue, [
                { label: 'Current', value: issue.current, type: 'current' },
                { label: 'Bulbapedia', value: issue.bulbapediaValue, type: 'neutral' },
                { label: 'Serebii', value: issue.serebiiValue, type: 'neutral' },
            ]);
        } else {
            // Fallback to table format for other complex fields
            return `<div class="comparison">
    <table class="comparison-table">
        <tr>
            <th>Source</th>
            <th>Value</th>
        </tr>
        <tr class="comparison-current">
            <td>Current</td>
            <td>${this.formatValue(issue.current)}</td>
        </tr>
        <tr class="comparison-neutral">
            <td>External Sources</td>
            <td><em>No reference data available</em></td>
        </tr>
    </table>
    ${issue.accepted ? '<div class="accepted-note">✅ Accepted Override: This issue has been manually verified and accepted.</div>' : ''}
</div>`;
        }
    }

    /**
     * Generate simple side-by-side comparison for basic fields
     */
    generateSimpleComparison(issue, sources) {
        // Filter out sources with no data (null, undefined, empty string)
        const validSources = sources.filter(
            source => source.value !== null && source.value !== undefined && source.value !== ''
        );

        const sourceColumns = validSources
            .map(
                source =>
                    `<div class="simple-source ${source.type}">
                <div class="source-label">${source.label}</div>
                <div class="source-value">${this.formatSimpleValue(source.value)}</div>
            </div>`
            )
            .join('');

        const footnotes = this.generateSourceFootnotes(sources);

        return `<div class="comparison simple-comparison">
    <div class="simple-sources">
        ${sourceColumns}
    </div>
    ${footnotes}
    ${issue.accepted ? '<div class="accepted-note">✅ Accepted Override: This issue has been manually verified and accepted.</div>' : ''}
</div>`;
    }

    /**
     * Generate simple array comparison for array fields like baseStats
     */
    generateSimpleArrayComparison(issue, sources) {
        // Filter out sources with no data (null, undefined, empty string)
        const validSources = sources.filter(
            source => source.value !== null && source.value !== undefined && source.value !== ''
        );

        // Get all unique keys from all valid sources
        const allKeys = new Set();
        validSources.forEach(source => {
            if (typeof source.value === 'object' && source.value !== null) {
                Object.keys(source.value).forEach(key => allKeys.add(key));
            }
        });

        const keyRows = Array.from(allKeys)
            .map(key => {
                const valueCells = validSources
                    .map(source => {
                        const value =
                            typeof source.value === 'object' && source.value !== null
                                ? source.value[key]
                                : source.value;
                        return `<div class="array-value ${source.type}">${this.formatSimpleValue(value || '—')}</div>`;
                    })
                    .join('');

                return `<div class="array-row">
                <div class="array-key">${key}</div>
                <div class="array-values">${valueCells}</div>
            </div>`;
            })
            .join('');

        const sourceHeaders = validSources
            .map(source => `<div class="array-header ${source.type}">${source.label}</div>`)
            .join('');

        const footnotes = this.generateSourceFootnotes(sources);

        return `<div class="comparison array-comparison">
    <div class="array-container">
        <div class="array-header-row">
            <div class="array-key-header">Field</div>
            <div class="array-headers">${sourceHeaders}</div>
        </div>
        ${keyRows}
    </div>
    ${footnotes}
    ${issue.accepted ? '<div class="accepted-note">✅ Accepted Override: This issue has been manually verified and accepted.</div>' : ''}
</div>`;
    }

    /**
     * Format value for simple comparison display
     */
    formatSimpleValue(value) {
        if (value === null || value === undefined) {
            return '<em class="null-value">null</em>';
        }

        if (value === 'No reference data available') {
            return '<em class="no-reference">No reference data available</em>';
        }

        if (Array.isArray(value)) {
            return value.join(', ');
        }

        if (typeof value === 'object') {
            return JSON.stringify(value);
        }

        return String(value);
    }

    /**
     * Generate Evolution Chain comparison table
     */
    generateEvolutionChainComparison(issue, sources) {
        // Process each source and determine what to display
        const sourceTables = sources.map(source => {
            // Check if the source has the evolutionChain attribute at all
            const hasAttribute = source.value !== undefined;

            if (!hasAttribute) {
                // Don't show a table if the attribute doesn't exist in this source
                return {
                    ...source,
                    hasAttribute: false,
                    shouldDisplay: false,
                    tableHtml: '',
                };
            }

            // If attribute exists but has no data (null, empty array, etc.)
            const hasData =
                source.value !== null &&
                source.value !== '' &&
                (Array.isArray(source.value)
                    ? source.value.length > 0
                    : typeof source.value === 'object' &&
                      Object.keys(source.value || {}).length > 0);

            if (!hasData) {
                return {
                    ...source,
                    hasAttribute: true,
                    shouldDisplay: true,
                    hasData: false,
                    tableHtml: `<div class="evolution-source-section">
                        <h4 class="evolution-source-title ${source.type}">${source.label}</h4>
                        <div class="evolution-no-data">No evolutions (final form)</div>
                    </div>`,
                };
            }

            // Has data - normalize and create table
            const evolutionData = this.normalizeEvolutionChainData(source.value);
            console.log(`🧪 ${source.label} evolution data after normalization:`, evolutionData);

            if (evolutionData.length === 0) {
                console.log(`⚠️ ${source.label} normalized to empty array`);
                return {
                    ...source,
                    hasAttribute: true,
                    shouldDisplay: true,
                    hasData: false,
                    tableHtml: `<div class="evolution-source-section">
                        <h4 class="evolution-source-title ${source.type}">${source.label}</h4>
                        <div class="evolution-no-data">No evolutions (final form)</div>
                    </div>`,
                };
            }

            // Generate individual table for this source
            console.log(
                `📋 Generating table rows for ${source.label} with ${evolutionData.length} evolutions`
            );
            const evolutionRows = evolutionData
                .map((evolution, index) => {
                    console.log(`  Row ${index}:`, evolution);
                    const method = evolution.method || 'unknown';
                    const displayMethod = method.charAt(0).toUpperCase() + method.slice(1);

                    let requirement = '—';
                    if (method === 'level' && evolution.level !== undefined) {
                        requirement = evolution.level.toString();
                    } else if (method === 'stone' && evolution.stone) {
                        requirement = evolution.stone;
                    } else if (method === 'stone' && evolution.item) {
                        requirement = evolution.item;
                    } else if (evolution.method) {
                        requirement = evolution.method;
                    }

                    let target = '—';
                    if (evolution.evolves_to) {
                        const normalizedTarget = this.normalizeEvolutionTarget(
                            evolution.evolves_to
                        );
                        console.log(
                            `    Target for evolution ${index}: ${evolution.evolves_to} → ${normalizedTarget}`
                        );
                        target = `#${normalizedTarget}`;
                    } else {
                        console.log(
                            `    No evolves_to found for evolution ${index}, checking other fields:`,
                            Object.keys(evolution)
                        );
                        // Check alternative target fields
                        if (evolution.target) {
                            target = `#${evolution.target}`;
                        } else if (evolution.pokemon) {
                            target = `#${evolution.pokemon}`;
                        } else if (evolution.name) {
                            target = `#${evolution.name}`;
                        }
                    }

                    return `<tr class="evolution-row">
                    <td class="evolution-method">${displayMethod}</td>
                    <td class="evolution-requirement">${requirement}</td>
                    <td class="evolution-target">${target}</td>
                </tr>`;
                })
                .join('');

            const tableHtml = `<div class="evolution-source-section">
                <h4 class="evolution-source-title ${source.type}">${source.label}</h4>
                <table class="evolution-source-table ${source.type}">
                    <thead>
                        <tr>
                            <th class="evolution-method-header">Method</th>
                            <th class="evolution-requirement-header">Requirement</th>
                            <th class="evolution-target-header">Evolves To</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${evolutionRows}
                    </tbody>
                </table>
            </div>`;

            return {
                ...source,
                hasAttribute: true,
                shouldDisplay: true,
                hasData: true,
                evolutionData,
                tableHtml,
            };
        });

        // Only include sources that should be displayed
        const displayedTables = sourceTables
            .filter(sourceTable => sourceTable.shouldDisplay)
            .map(sourceTable => sourceTable.tableHtml)
            .join('');

        const footnotes = this.generateSourceFootnotes(sources);

        return `<div class="comparison evolution-comparison evolution-side-by-side">
    <div class="evolution-tables-container">
        ${displayedTables}
    </div>
    ${footnotes}
    ${issue.accepted ? '<div class="accepted-note">✅ Accepted Override: This issue has been manually verified and accepted.</div>' : ''}
</div>`;
    }

    /**
     * Normalize evolution chain data to a consistent array format
     */
    normalizeEvolutionChainData(data) {
        // Debug logging for evolution chain data
        console.log('🔍 Normalizing evolution chain data:', JSON.stringify(data, null, 2));

        if (Array.isArray(data)) {
            console.log('✅ Data is already an array with', data.length, 'items');
            return data; // Already in the expected format
        }

        if (typeof data === 'object' && data !== null) {
            console.log('🔄 Converting object format to array format');
            // Convert object format to array format
            const evolutionArray = [];
            Object.keys(data).forEach(method => {
                const methodData = data[method];
                if (Array.isArray(methodData)) {
                    methodData.forEach(evolution => {
                        evolutionArray.push({ method, ...evolution });
                    });
                } else if (typeof methodData === 'object') {
                    evolutionArray.push({ method, ...methodData });
                }
            });
            console.log('✅ Converted to array with', evolutionArray.length, 'items');
            return evolutionArray;
        }

        console.log('⚠️ Data is not in expected format, returning empty array');
        return []; // Empty array if data is not in expected format
    }

    /**
     * Normalize evolution target to just the Pokemon number
     */
    normalizeEvolutionTarget(target) {
        if (typeof target === 'string') {
            // Extract number from formats like "101", "Pokemon #101", etc.
            const numberRegex = /\d+/;
            const match = numberRegex.exec(target);
            return match ? match[0] : target;
        }
        return target?.toString() || '';
    }

    /**
     * Generate Learnset comparison table
     */
    generateLearnsetComparison(issue, sources) {
        // Process each source and determine what to display
        const sourceTables = sources.map(source => {
            // Check if the source has the learnset attribute at all
            const hasAttribute = source.value !== undefined;

            if (!hasAttribute) {
                // Don't show a table if the attribute doesn't exist in this source
                return {
                    ...source,
                    hasAttribute: false,
                    shouldDisplay: false,
                    tableHtml: '',
                };
            }

            // If attribute exists but has no data (null, empty array, etc.)
            const hasData =
                source.value !== null &&
                source.value !== '' &&
                (Array.isArray(source.value)
                    ? source.value.length > 0
                    : typeof source.value === 'object' &&
                      Object.keys(source.value || {}).length > 0);

            if (!hasData) {
                return {
                    ...source,
                    hasAttribute: true,
                    shouldDisplay: true,
                    hasData: false,
                    tableHtml: `<div class="learnset-source-section">
                        <h4 class="learnset-source-title ${source.type}">${source.label}</h4>
                        <div class="learnset-no-data">No moves learned by leveling up</div>
                    </div>`,
                };
            }

            // Has data - normalize and create table
            const learnsetData = this.normalizeLearnsetData(source.value);

            if (learnsetData.length === 0) {
                return {
                    ...source,
                    hasAttribute: true,
                    shouldDisplay: true,
                    hasData: false,
                    tableHtml: `<div class="learnset-source-section">
                        <h4 class="learnset-source-title ${source.type}">${source.label}</h4>
                        <div class="learnset-no-data">No moves learned by leveling up</div>
                    </div>`,
                };
            }

            // Generate individual table for this source
            const learnsetRows = learnsetData
                .map((move, index) => {
                    const level = move.level !== undefined ? move.level : '—';
                    const moveName = move.attack_name || move.name || move.move || '—';

                    return `<tr class="learnset-row">
                    <td class="learnset-level">${level === 0 ? 'Start' : `Level ${level}`}</td>
                    <td class="learnset-move">${moveName}</td>
                </tr>`;
                })
                .join('');

            const tableHtml = `<div class="learnset-source-section">
                <h4 class="learnset-source-title ${source.type}">${source.label}</h4>
                <table class="learnset-source-table ${source.type}">
                    <thead>
                        <tr>
                            <th class="learnset-level-header">Level</th>
                            <th class="learnset-move-header">Move</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${learnsetRows}
                    </tbody>
                </table>
            </div>`;

            return {
                ...source,
                hasAttribute: true,
                shouldDisplay: true,
                hasData: true,
                learnsetData,
                tableHtml,
            };
        });

        // Only include sources that should be displayed
        const displayedTables = sourceTables
            .filter(sourceTable => sourceTable.shouldDisplay)
            .map(sourceTable => sourceTable.tableHtml)
            .join('');

        const footnotes = this.generateSourceFootnotes(sources);

        return `<div class="comparison learnset-comparison learnset-side-by-side">
    <div class="learnset-tables-container">
        ${displayedTables}
    </div>
    ${footnotes}
    ${issue.accepted ? '<div class="accepted-note">✅ Accepted Override: This issue has been manually verified and accepted.</div>' : ''}
</div>`;
    }

    /**
     * Normalize learnset data to a consistent array format
     */
    normalizeLearnsetData(data) {
        if (Array.isArray(data)) {
            // Already in array format - sort by level
            return data.sort((a, b) => {
                const levelA = a.level !== undefined ? a.level : 999;
                const levelB = b.level !== undefined ? b.level : 999;
                return levelA - levelB;
            });
        }

        if (typeof data === 'object' && data !== null) {
            // Convert object format to array format
            const learnsetArray = [];
            Object.entries(data).forEach(([level, moves]) => {
                const numLevel = parseInt(level, 10);
                if (Array.isArray(moves)) {
                    moves.forEach(move => {
                        learnsetArray.push({
                            level: numLevel,
                            attack_name:
                                typeof move === 'string'
                                    ? move
                                    : move.name || move.attack_name || move,
                        });
                    });
                } else if (typeof moves === 'string') {
                    learnsetArray.push({
                        level: numLevel,
                        attack_name: moves,
                    });
                } else if (typeof moves === 'object' && moves !== null) {
                    learnsetArray.push({
                        level: numLevel,
                        attack_name: moves.name || moves.attack_name || 'Unknown Move',
                    });
                }
            });

            // Sort by level
            return learnsetArray.sort((a, b) => (a.level || 999) - (b.level || 999));
        }

        return [];
    }

    /**
     * Generate TM Compatibility comparison table
     */
    generateTmCompatibilityComparison(issue, sources) {
        // Filter out sources with no data
        const validSources = sources.filter(
            source =>
                source.value !== null &&
                source.value !== undefined &&
                source.value !== '' &&
                Array.isArray(source.value)
        );

        // Get all unique TMs from all sources
        const allTms = new Set();
        validSources.forEach(source => {
            if (Array.isArray(source.value)) {
                source.value.forEach(tm => allTms.add(tm));
            }
        });

        // Sort TMs naturally (TM01, TM02, etc.)
        const sortedTms = Array.from(allTms).sort((a, b) => {
            // Extract number from TM string (e.g., "TM01" -> 1)
            const getNumber = tm => {
                const match = tm.match(/(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            };
            return getNumber(a) - getNumber(b);
        });

        // Generate table headers
        const sourceHeaders = validSources
            .map(source => `<th class="tm-source-header ${source.type}">${source.label}</th>`)
            .join('');

        // Generate table rows
        const tmRows = sortedTms
            .map(tm => {
                const sourceCells = validSources
                    .map(source => {
                        const hasTm = Array.isArray(source.value) && source.value.includes(tm);
                        const icon = hasTm ? '✓' : '✗';
                        const cellClass = hasTm ? 'tm-has' : 'tm-missing';
                        return `<td class="tm-cell ${cellClass} ${source.type}">${icon}</td>`;
                    })
                    .join('');

                return `<tr class="tm-row">
                <td class="tm-name">${tm}</td>
                ${sourceCells}
            </tr>`;
            })
            .join('');

        const footnotes = this.generateSourceFootnotes(sources);

        return `<div class="comparison tm-compatibility-comparison">
    <table class="tm-comparison-table">
        <thead>
            <tr>
                <th class="tm-name-header">TM/HM</th>
                ${sourceHeaders}
            </tr>
        </thead>
        <tbody>
            ${tmRows}
        </tbody>
    </table>
    ${footnotes}
    ${issue.accepted ? '<div class="accepted-note">✅ Accepted Override: This issue has been manually verified and accepted.</div>' : ''}
</div>`;
    }

    /**
     * Generate footnotes for missing source data
     */
    generateSourceFootnotes(sources) {
        const missingSources = sources.filter(
            source =>
                source.label !== 'Current' &&
                (source.value === null ||
                    source.value === undefined ||
                    source.value === 'No reference data available' ||
                    (typeof source.value === 'string' && source.value.trim() === ''))
        );

        if (missingSources.length === 0) {
            return '';
        }

        const footnoteText = missingSources
            .map(source => `${source.label} did not return data for this field`)
            .join(', ');

        return `<div class="source-footnotes">
            <small>* ${footnoteText}</small>
        </div>`;
    }

    // ============ UTILITY METHODS ============

    /**
     * Calculate basic statistics for filter buttons
     */
    calculateBasicStats(results) {
        const total = results.length;
        const fullyValidated = results.filter(r => (r.completeness || 0) >= 100).length;
        const highlyValidated = results.filter(r => (r.completeness || 0) >= 75).length;
        const lowValidated = results.filter(r => (r.completeness || 0) < 75).length;

        return { total, fullyValidated, highlyValidated, lowValidated };
    }

    /**
     * Calculate detailed statistics for summary cards
     */
    calculateDetailedStats(results) {
        const basicStats = this.calculateBasicStats(results);
        const totalIssues = results.reduce((sum, r) => sum + (r.issues?.length || 0), 0);

        const severityCounts = results.reduce((counts, r) => {
            if (r.issues) {
                r.issues.forEach(issue => {
                    counts[issue.severity] = (counts[issue.severity] || 0) + 1;
                });
            }
            return counts;
        }, {});

        return { ...basicStats, totalIssues, severityCounts };
    }

    /**
     * Generate Accept Issue Quick Fix buttons
     */
    generateAcceptIssueQuickFix(issue) {
        // Only show Quick Fix for issues that can be accepted/removed
        if (issue.severity === 'accurate') {
            return '';
        }

        const pokemonId = issue.pokemonId || 'unknown';
        const field = issue.field;

        if (issue.accepted) {
            // Show "Remove Accepted" button for already accepted issues
            return `<div class="quick-fix-section">
    <div class="quick-fix-header">
        <h4>🔧 Quick Fix Actions</h4>
        <p>This issue has been accepted as valid. You can remove the accepted status if needed.</p>
    </div>
    <div class="quick-fix-buttons">
        <button class="quick-fix-btn remove-accepted-btn" 
                data-pokemon-id="${pokemonId}" 
                data-field="${field}"
                data-action="remove-accepted"
                title="Remove accepted status for this field">
            🗑️ Remove Accepted Status
        </button>
        <div class="quick-fix-command">
            <strong>CLI Command:</strong>
            <code>node scripts/validation-cli.js remove-accepted ${pokemonId} ${field}</code>
        </div>
    </div>
</div>`;
        } else {
            // Show "Accept Issue" button for unaccepted issues
            return `<div class="quick-fix-section">
    <div class="quick-fix-header">
        <h4>🔧 Quick Fix Actions</h4>
        <p>Mark this issue as acceptable if you've verified the data is correct despite the validation conflict.</p>
    </div>
    <div class="quick-fix-buttons">
        <button class="quick-fix-btn accept-issue-btn" 
                data-pokemon-id="${pokemonId}" 
                data-field="${field}"
                data-action="accept-issue"
                title="Accept this issue as valid">
            ✅ Accept Issue
        </button>
        <div class="quick-fix-command">
            <strong>CLI Command:</strong>
            <code>node scripts/validation-cli.js accept-issue ${pokemonId} ${field}</code>
        </div>
    </div>
</div>`;
        }
    }

    /**
     * Generate In-Game Quick Fix buttons for issue cards
     */
    generateInGameQuickFix(issue) {
        // Don't show In-Game Quick Fix for accurate issues (they have their own method)
        if (issue.severity === 'accurate') {
            return '';
        }

        const pokemonId = issue.pokemonId || 'unknown';
        const field = issue.field;

        if (issue.inGameValidated) {
            // Show "Remove In-Game Validation" button for fields already marked as in-game validated
            return `<div class="in-game-quick-fix-section">
    <div class="in-game-quick-fix-header">
        <h4>🎮 In-Game Validation</h4>
        <p>This field has been verified through actual gameplay. You can remove this validation if needed.</p>
    </div>
    <div class="in-game-quick-fix-buttons">
        <button class="quick-fix-btn remove-in-game-btn" 
                data-pokemon-id="${pokemonId}" 
                data-field="${field}"
                data-action="remove-in-game-validated"
                title="Remove in-game validation for this field">
            🗑️ Remove In-Game Validation
        </button>
        <div class="quick-fix-command">
            <strong>CLI Command:</strong>
            <code>node scripts/validation-cli.js remove-in-game-validated ${pokemonId} ${field}</code>
        </div>
    </div>
</div>`;
        } else {
            // Show "Mark as In-Game Validated" button for fields not yet validated in-game
            return `<div class="in-game-quick-fix-section">
    <div class="in-game-quick-fix-header">
        <h4>🎮 In-Game Validation</h4>
        <p>Mark this field as verified through actual gameplay - the ultimate validation authority.</p>
    </div>
    <div class="in-game-quick-fix-buttons">
        <button class="quick-fix-btn set-in-game-btn" 
                data-pokemon-id="${pokemonId}" 
                data-field="${field}"
                data-action="set-in-game-validated"
                title="Mark this field as validated through gameplay">
            🎮 Mark as In-Game Validated
        </button>
        <div class="quick-fix-command">
            <strong>CLI Command:</strong>
            <code>node scripts/validation-cli.js set-in-game-validated ${pokemonId} ${field}</code>
        </div>
    </div>
</div>`;
        }
    }

    /**
     * Generate In-Game Quick Fix buttons for validated (accurate) cards
     */
    generateInGameQuickFixForValidated(field, result) {
        const pokemonId = result.id || 'unknown';
        const isInGameValidated = result.inGameValidatedFields?.includes(field);

        if (isInGameValidated) {
            // Show "Remove In-Game Validation" button
            return `<div class="in-game-quick-fix-section">
    <div class="in-game-quick-fix-header">
        <h4>🎮 In-Game Validation</h4>
        <p>This field has been verified through actual gameplay. You can remove this validation if needed.</p>
    </div>
    <div class="in-game-quick-fix-buttons">
        <button class="quick-fix-btn remove-in-game-btn" 
                data-pokemon-id="${pokemonId}" 
                data-field="${field}"
                data-action="remove-in-game-validated"
                title="Remove in-game validation for this field">
            🗑️ Remove In-Game Validation
        </button>
        <div class="quick-fix-command">
            <strong>CLI Command:</strong>
            <code>node scripts/validation-cli.js remove-in-game-validated ${pokemonId} ${field}</code>
        </div>
    </div>
</div>`;
        } else {
            // Show "Mark as In-Game Validated" button
            return `<div class="in-game-quick-fix-section">
    <div class="in-game-quick-fix-header">
        <h4>🎮 In-Game Validation</h4>
        <p>Add additional verification by marking this field as confirmed through actual gameplay.</p>
    </div>
    <div class="in-game-quick-fix-buttons">
        <button class="quick-fix-btn set-in-game-btn" 
                data-pokemon-id="${pokemonId}" 
                data-field="${field}"
                data-action="set-in-game-validated"
                title="Mark this field as validated through gameplay">
            🎮 Mark as In-Game Validated
        </button>
        <div class="quick-fix-command">
            <strong>CLI Command:</strong>
            <code>node scripts/validation-cli.js set-in-game-validated ${pokemonId} ${field}</code>
        </div>
    </div>
</div>`;
        }
    }

    /**
     * Get CSS class for issue severity
     */
    getSeverityClass(severity) {
        const severityMap = {
            accurate: 'accurate',
            missing_attribute: 'missing_attribute',
            inaccurate: 'inaccurate',
            no_reference: 'no_reference',
            partial_match: 'partial_match',
            source_conflict: 'source_conflict',
            error: 'error',
        };

        return severityMap[severity] || 'error';
    }

    /**
     * Get CSS class for completeness color coding
     */
    getCompletenessColorClass(completeness) {
        if (completeness >= 100) return 'complete';
        if (completeness >= 75) return 'high';
        if (completeness >= 50) return 'medium';
        if (completeness >= 25) return 'low';
        return 'very-low';
    }

    /**
     * Format a value for display in comparison tables
     */
    formatValue(value) {
        if (value === null || value === undefined) {
            return '<em style="color: #999;">null</em>';
        }

        if (typeof value === 'string') {
            return value.length > 100 ? `${value.substring(0, 97)}...` : value;
        }

        if (typeof value === 'object') {
            const jsonStr = JSON.stringify(value, null, 1);
            return jsonStr.length > 200 ? `${jsonStr.substring(0, 197)}...` : jsonStr;
        }

        return String(value);
    }
}

module.exports = HTMLReportGenerator;
