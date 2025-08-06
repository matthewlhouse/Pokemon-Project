/**
 * JavaScript for Pokemon Validation Report Interactive Features
 *
 * Handles filtering, collapsible cards, tooltips, and other interactive
 * elements in the validation report with accessibility support.
 */

(function () {
    'use strict';

    // Global state
    let currentPokemonFilter = 'all';
    let currentAttributeFilter = 'all';
    let currentSearchQuery = '';

    // Historical data tracking
    let currentReportData = null;
    let previousReportData = null;
    let reportHistory = [];
    let historicalChanges = null;

    // Virtual scrolling state
    let virtualScrollEnabled = false;
    let virtualScrollContainer = null;
    let virtualScrollContent = null;
    let virtualScrollSpacerTop = null;
    let virtualScrollSpacerBottom = null;
    let allPokemonData = [];
    let visiblePokemonData = [];
    let itemHeight = 120; // Approximate height of a collapsed Pokemon card
    let containerHeight = 600;
    let visibleItemsCount = 0;
    let scrollTop = 0;
    let startIndex = 0;
    let endIndex = 0;

    /**
     * Dark Mode Management
     */
    function initializeDarkMode() {
        // Get saved theme preference or default to light
        const savedTheme = localStorage.getItem('validationReportTheme') || 'light';
        setTheme(savedTheme);

        // Add event listener to toggle button
        const toggleButton = document.getElementById('dark-mode-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', toggleDarkMode);
        }
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('validationReportTheme', theme);

        // Update button aria-label for accessibility
        const toggleButton = document.getElementById('dark-mode-toggle');
        if (toggleButton) {
            const newLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
            toggleButton.setAttribute('aria-label', newLabel);
            toggleButton.setAttribute('title', newLabel);
        }
    }

    function toggleDarkMode() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    }

    /**
     * Historical Data Management
     */
    function initializeHistoricalData() {
        // Load historical data from localStorage
        const storedHistory = localStorage.getItem('pokemonValidationHistory');
        if (storedHistory) {
            try {
                reportHistory = JSON.parse(storedHistory);
                // Keep only the last 10 reports to prevent storage bloat
                if (reportHistory.length > 10) {
                    reportHistory = reportHistory.slice(-10);
                    saveHistoricalData();
                }
            } catch (error) {
                console.warn('Failed to parse historical data:', error);
                reportHistory = [];
            }
        }

        // Extract current report data from the page
        currentReportData = extractCurrentReportData();

        // Get the most recent previous report for comparison
        if (reportHistory.length > 0) {
            previousReportData = reportHistory[reportHistory.length - 1];
            historicalChanges = calculateChanges(previousReportData, currentReportData);
        }

        // Add current report to history
        addCurrentReportToHistory();
    }

    function extractCurrentReportData() {
        const timestamp = new Date().toISOString();
        const pokemonCards = document.querySelectorAll('.pokemon-card');
        const pokemonData = [];
        let totalCompleteness = 0;
        let totalIssues = 0;

        pokemonCards.forEach(card => {
            const pokemonId = card.dataset.pokemonId;
            const pokemonName = card.dataset.pokemonName;
            const completeness = parseInt(card.dataset.completeness) || 0;
            const issueCount = parseInt(card.dataset.issueCount) || 0;
            const validatedCount = parseInt(card.dataset.validatedCount) || 0;

            // Extract field statuses
            const fieldStatuses = {};
            const issues = card.querySelectorAll('.issue');
            issues.forEach(issue => {
                const field = issue.dataset.field;
                if (field) {
                    const isAccurate = issue.classList.contains('accurate');
                    const isAccepted = issue.classList.contains('accepted');
                    const isInGameValidated = issue.classList.contains('in-game-validated');
                    const severityClass =
                        Array.from(issue.classList).find(
                            cls =>
                                cls.startsWith('severity-') ||
                                [
                                    'accurate',
                                    'missing_attribute',
                                    'inaccurate',
                                    'partial_match',
                                    'source_conflict',
                                    'no_reference',
                                ].includes(cls)
                        ) || 'unknown';

                    fieldStatuses[field] = {
                        status: isAccurate ? 'validated' : severityClass,
                        accepted: isAccepted,
                        inGameValidated: isInGameValidated,
                    };
                }
            });

            pokemonData.push({
                id: pokemonId,
                name: pokemonName,
                completeness,
                issueCount,
                validatedCount,
                fieldStatuses,
            });

            totalCompleteness += completeness;
            totalIssues += issueCount;
        });

        const averageCompleteness =
            pokemonCards.length > 0 ? totalCompleteness / pokemonCards.length : 0;

        return {
            timestamp,
            totalPokemon: pokemonCards.length,
            averageCompleteness: Math.round(averageCompleteness * 100) / 100,
            totalIssues,
            pokemonData,
        };
    }

    function calculateChanges(previousData, currentData) {
        if (!previousData || !currentData) return null;

        const changes = {
            overallCompletenessChange:
                currentData.averageCompleteness - previousData.averageCompleteness,
            totalIssuesChange: currentData.totalIssues - previousData.totalIssues,
            pokemonChanges: {
                improved: 0,
                regressed: 0,
                unchanged: 0,
                fieldChanges: [],
            },
            previousTimestamp: previousData.timestamp,
        };

        // Track Pokemon-level changes
        const previousPokemonMap = new Map();
        previousData.pokemonData.forEach(pokemon => {
            previousPokemonMap.set(pokemon.id, pokemon);
        });

        currentData.pokemonData.forEach(currentPokemon => {
            const previousPokemon = previousPokemonMap.get(currentPokemon.id);
            if (!previousPokemon) return;

            const completenessChange = currentPokemon.completeness - previousPokemon.completeness;

            if (completenessChange > 0) {
                changes.pokemonChanges.improved++;
            } else if (completenessChange < 0) {
                changes.pokemonChanges.regressed++;
            } else {
                changes.pokemonChanges.unchanged++;
            }

            // Track field-level changes
            Object.keys(currentPokemon.fieldStatuses).forEach(field => {
                const currentStatus = currentPokemon.fieldStatuses[field];
                const previousStatus = previousPokemon.fieldStatuses?.[field];

                if (!previousStatus) return;

                const statusChanged = currentStatus.status !== previousStatus.status;
                const acceptedChanged = currentStatus.accepted !== previousStatus.accepted;
                const inGameChanged =
                    currentStatus.inGameValidated !== previousStatus.inGameValidated;

                if (statusChanged || acceptedChanged || inGameChanged) {
                    changes.pokemonChanges.fieldChanges.push({
                        pokemonId: currentPokemon.id,
                        pokemonName: currentPokemon.name,
                        field,
                        previousStatus: previousStatus.status,
                        currentStatus: currentStatus.status,
                        statusChanged,
                        acceptedChanged,
                        inGameChanged,
                        completenessChange,
                    });
                }
            });
        });

        return changes;
    }

    function addCurrentReportToHistory() {
        if (!currentReportData) return;

        // Add to history array
        reportHistory.push(currentReportData);

        // Keep only the last 10 reports
        if (reportHistory.length > 10) {
            reportHistory = reportHistory.slice(-10);
        }

        saveHistoricalData();
    }

    function saveHistoricalData() {
        try {
            localStorage.setItem('pokemonValidationHistory', JSON.stringify(reportHistory));
        } catch (error) {
            console.warn('Failed to save historical data:', error);
        }
    }

    function getHistoricalTrendData() {
        return reportHistory.map(report => ({
            timestamp: report.timestamp,
            averageCompleteness: report.averageCompleteness,
            totalIssues: report.totalIssues,
            totalPokemon: report.totalPokemon,
        }));
    }

    function generateProgressSummary() {
        const progressContainer = document.getElementById('progress-summary');
        if (!progressContainer) return;

        if (!historicalChanges) {
            progressContainer.innerHTML = `
                <div class="progress-no-history">
                    🆕 This is your first validation report!<br>
                    <small>Future reports will show progress comparisons here.</small>
                </div>
            `;
            return;
        }

        const prevDate = new Date(historicalChanges.previousTimestamp).toLocaleDateString();
        const completenessChange = historicalChanges.overallCompletenessChange;
        const issuesChange = historicalChanges.totalIssuesChange;
        const pokemonChanges = historicalChanges.pokemonChanges;

        // Generate trend indicators
        const completenessIcon =
            completenessChange > 0 ? '📈' : completenessChange < 0 ? '📉' : '➡️';
        const completenessClass =
            completenessChange > 0 ? 'positive' : completenessChange < 0 ? 'negative' : 'neutral';
        const completenessText =
            completenessChange > 0
                ? `+${completenessChange.toFixed(1)}%`
                : `${completenessChange.toFixed(1)}%`;

        const issuesIcon = issuesChange < 0 ? '✅' : issuesChange > 0 ? '⚠️' : '➡️';
        const issuesClass =
            issuesChange < 0 ? 'positive' : issuesChange > 0 ? 'negative' : 'neutral';
        const issuesText = issuesChange > 0 ? `+${issuesChange}` : issuesChange.toString();

        progressContainer.innerHTML = `
            <div class="progress-summary-content">
                <div class="progress-header">
                    <h4>📊 Progress Since ${prevDate}</h4>
                </div>
                <div class="progress-metrics">
                    <div class="progress-metric ${completenessClass}">
                        <div class="metric-icon">${completenessIcon}</div>
                        <div class="metric-content">
                            <div class="metric-label">Average Completeness</div>
                            <div class="metric-value">${completenessText}</div>
                        </div>
                    </div>
                    <div class="progress-metric ${issuesClass}">
                        <div class="metric-icon">${issuesIcon}</div>
                        <div class="metric-content">
                            <div class="metric-label">Total Issues</div>
                            <div class="metric-value">${issuesText}</div>
                        </div>
                    </div>
                </div>
                <div class="progress-breakdown">
                    <div class="pokemon-changes">
                        <span class="change-item positive">📈 ${pokemonChanges.improved} improved</span>
                        ${pokemonChanges.regressed > 0 ? `<span class="change-item negative">📉 ${pokemonChanges.regressed} regressed</span>` : ''}
                        <span class="change-item neutral">➡️ ${pokemonChanges.unchanged} unchanged</span>
                    </div>
                    ${
                        pokemonChanges.fieldChanges.length > 0
                            ? `<div class="field-changes-summary">
                            <small>🔄 ${pokemonChanges.fieldChanges.length} field status changes detected</small>
                        </div>`
                            : ''
                    }
                </div>
                ${generateWhatsNewSection()}
            </div>
        `;
    }

    function generateWhatsNewSection() {
        if (!historicalChanges || !historicalChanges.pokemonChanges.fieldChanges.length) {
            return '';
        }

        // Find the most significant improvements
        const improvements = historicalChanges.pokemonChanges.fieldChanges
            .filter(
                change =>
                    (change.currentStatus === 'validated' || change.currentStatus === 'accurate') &&
                    change.previousStatus !== 'validated' &&
                    change.previousStatus !== 'accurate'
            )
            .sort((a, b) => b.completenessChange - a.completenessChange)
            .slice(0, 5);

        // Find regressions
        const regressions = historicalChanges.pokemonChanges.fieldChanges
            .filter(
                change =>
                    (change.previousStatus === 'validated' ||
                        change.previousStatus === 'accurate') &&
                    change.currentStatus !== 'validated' &&
                    change.currentStatus !== 'accurate'
            )
            .slice(0, 3);

        if (!improvements.length && !regressions.length) {
            return '';
        }

        let whatsNewContent = '<div class="whats-new-section"><h4>🎯 Notable Changes</h4>';

        if (improvements.length) {
            whatsNewContent += '<div class="improvements-list"><h5>✅ Recent Improvements</h5><ul>';
            improvements.forEach(change => {
                whatsNewContent += `
                    <li class="improvement-item">
                        <strong>${change.pokemonName}</strong>: ${change.field} field resolved
                        <small>(${change.previousStatus} → ${change.currentStatus})</small>
                    </li>
                `;
            });
            whatsNewContent += '</ul></div>';
        }

        if (regressions.length) {
            whatsNewContent += '<div class="regressions-list"><h5>⚠️ Needs Attention</h5><ul>';
            regressions.forEach(change => {
                whatsNewContent += `
                    <li class="regression-item">
                        <strong>${change.pokemonName}</strong>: ${change.field} field needs review
                        <small>(${change.previousStatus} → ${change.currentStatus})</small>
                    </li>
                `;
            });
            whatsNewContent += '</ul></div>';
        }

        whatsNewContent += '</div>';
        return whatsNewContent;
    }

    function exportHistoricalData() {
        if (reportHistory.length === 0) {
            alert('No historical data available to export.');
            return;
        }

        const exportData = {
            exportDate: new Date().toISOString(),
            totalReports: reportHistory.length,
            dateRange: {
                earliest: reportHistory[0].timestamp,
                latest: reportHistory[reportHistory.length - 1].timestamp,
            },
            trendData: getHistoricalTrendData(),
            fullHistory: reportHistory,
            currentComparison: historicalChanges,
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `pokemon-validation-history-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        // Clean up
        URL.revokeObjectURL(link.href);

        announceToScreenReader('Historical data exported successfully');
    }

    function addChangeIndicatorsToPokemonCards() {
        if (!historicalChanges || !previousReportData) return;

        const previousPokemonMap = new Map();
        previousReportData.pokemonData.forEach(pokemon => {
            previousPokemonMap.set(pokemon.id, pokemon);
        });

        const pokemonCards = document.querySelectorAll('.pokemon-card');
        pokemonCards.forEach(card => {
            const pokemonId = card.dataset.pokemonId;
            const currentCompleteness = parseInt(card.dataset.completeness) || 0;
            const previousPokemon = previousPokemonMap.get(pokemonId);

            if (!previousPokemon) return;

            const completenessChange = currentCompleteness - previousPokemon.completeness;

            // Add trend indicator to completeness section
            const completenessSection = card.querySelector('.completeness-section');
            if (completenessSection && Math.abs(completenessChange) >= 1) {
                // Only show for changes >= 1%
                const trendIndicator = document.createElement('div');
                trendIndicator.className = 'trend-indicator';

                const trendIcon = completenessChange > 0 ? '📈' : '📉';
                const trendClass = completenessChange > 0 ? 'trend-positive' : 'trend-negative';
                const changeText =
                    completenessChange > 0 ? `+${completenessChange}%` : `${completenessChange}%`;

                trendIndicator.innerHTML = `
                    <span class="trend-icon ${trendClass}" title="Change since last report: ${changeText}">
                        ${trendIcon}
                    </span>
                `;

                completenessSection.appendChild(trendIndicator);
            }

            // Add field-level change indicators
            const fieldChanges = historicalChanges.pokemonChanges.fieldChanges.filter(
                change => change.pokemonId === pokemonId
            );

            if (fieldChanges.length > 0) {
                fieldChanges.forEach(fieldChange => {
                    const fieldElement = card.querySelector(`[data-field="${fieldChange.field}"]`);
                    if (fieldElement) {
                        const changeIndicator = document.createElement('div');
                        changeIndicator.className = 'field-change-indicator';

                        let changeIcon = '🔄';
                        let changeTitle = 'Field status changed';

                        if (fieldChange.statusChanged) {
                            if (
                                fieldChange.currentStatus === 'validated' ||
                                fieldChange.currentStatus === 'accurate'
                            ) {
                                changeIcon = '✅';
                                changeTitle = `Field improved: ${fieldChange.previousStatus} → ${fieldChange.currentStatus}`;
                            } else if (
                                fieldChange.previousStatus === 'validated' ||
                                fieldChange.previousStatus === 'accurate'
                            ) {
                                changeIcon = '⚠️';
                                changeTitle = `Field regressed: ${fieldChange.previousStatus} → ${fieldChange.currentStatus}`;
                            }
                        }

                        if (fieldChange.acceptedChanged) {
                            changeIcon = fieldChange.accepted ? '✅' : '❌';
                            changeTitle += fieldChange.accepted
                                ? ' (Accepted)'
                                : ' (No longer accepted)';
                        }

                        if (fieldChange.inGameChanged) {
                            changeIcon = '🎮';
                            changeTitle += ' (In-game validation changed)';
                        }

                        changeIndicator.innerHTML = `
                            <span class="change-badge" title="${changeTitle}">
                                ${changeIcon}
                            </span>
                        `;

                        const issueHeader = fieldElement.querySelector('.issue-header');
                        if (issueHeader) {
                            issueHeader.appendChild(changeIndicator);
                        }
                    }
                });
            }
        });
    }

    /**
     * Initialize virtual scrolling functionality
     */
    function initializeVirtualScrolling() {
        virtualScrollContainer = document.getElementById('virtual-scroll-container');
        virtualScrollContent = document.getElementById('virtual-scroll-content');
        virtualScrollSpacerTop = document.getElementById('virtual-scroll-spacer-top');
        virtualScrollSpacerBottom = document.getElementById('virtual-scroll-spacer-bottom');

        if (!virtualScrollContainer || !virtualScrollContent) {
            console.warn('Virtual scrolling elements not found, falling back to normal scrolling');
            return;
        }

        // Get all Pokemon cards data
        const allCards = document.querySelectorAll('.pokemon-card');
        allPokemonData = Array.from(allCards).map((card, index) => ({
            element: card,
            index: index,
            visible: !card.classList.contains('hidden'),
            height: itemHeight,
        }));

        // Check if we should enable virtual scrolling (threshold: 20+ items)
        if (allPokemonData.length >= 20) {
            enableVirtualScrolling();
        } else {
            disableVirtualScrolling();
        }
    }

    /**
     * Enable virtual scrolling mode
     */
    function enableVirtualScrolling() {
        if (!virtualScrollContainer) return;

        virtualScrollEnabled = true;

        // Set up container dimensions
        containerHeight = virtualScrollContainer.clientHeight;
        visibleItemsCount = Math.ceil(containerHeight / itemHeight) + 2; // Extra buffer

        // Add scroll listener
        virtualScrollContainer.addEventListener('scroll', handleVirtualScroll);

        // Initialize virtual scroll view
        updateVirtualScroll();

        console.log(`Virtual scrolling enabled for ${allPokemonData.length} items`);
    }

    /**
     * Disable virtual scrolling mode (fallback to normal scrolling)
     */
    function disableVirtualScrolling() {
        if (!virtualScrollContainer) return;

        virtualScrollEnabled = false;

        // Remove scroll listener
        virtualScrollContainer.removeEventListener('scroll', handleVirtualScroll);

        // Reset spacers
        if (virtualScrollSpacerTop) virtualScrollSpacerTop.style.height = '0px';
        if (virtualScrollSpacerBottom) virtualScrollSpacerBottom.style.height = '0px';

        // Add fallback class
        const resultsContainer = document.querySelector('.pokemon-results');
        if (resultsContainer) {
            resultsContainer.classList.add('no-virtual-scroll');
        }

        console.log('Virtual scrolling disabled, using normal scrolling');
    }

    /**
     * Handle virtual scroll events
     */
    function handleVirtualScroll() {
        if (!virtualScrollEnabled) return;

        scrollTop = virtualScrollContainer.scrollTop;
        updateVirtualScroll();
    }

    /**
     * Update virtual scroll view based on current scroll position
     */
    function updateVirtualScroll() {
        if (!virtualScrollEnabled || !virtualScrollContainer) return;

        // Get currently visible Pokemon based on filters
        visiblePokemonData = allPokemonData.filter(item => item.visible);

        if (visiblePokemonData.length === 0) {
            // No items visible, clear content
            virtualScrollContent.innerHTML = '';
            virtualScrollSpacerTop.style.height = '0px';
            virtualScrollSpacerBottom.style.height = '0px';
            return;
        }

        // Calculate which items should be visible in viewport
        startIndex = Math.floor(scrollTop / itemHeight);
        endIndex = Math.min(startIndex + visibleItemsCount, visiblePokemonData.length);

        // Ensure we don't go below 0
        startIndex = Math.max(0, startIndex);

        // Calculate spacer heights
        const topSpacerHeight = startIndex * itemHeight;
        const bottomSpacerHeight = (visiblePokemonData.length - endIndex) * itemHeight;

        // Update spacers
        virtualScrollSpacerTop.style.height = `${topSpacerHeight}px`;
        virtualScrollSpacerBottom.style.height = `${bottomSpacerHeight}px`;

        // Render visible items
        renderVirtualScrollItems();
    }

    /**
     * Render only the visible items in the virtual scroll viewport
     */
    function renderVirtualScrollItems() {
        if (!virtualScrollContent) return;

        const fragment = document.createDocumentFragment();

        for (let i = startIndex; i < endIndex; i++) {
            if (i < visiblePokemonData.length) {
                const itemData = visiblePokemonData[i];
                const clonedElement = itemData.element.cloneNode(true);

                // Ensure proper event handling for cloned elements
                setupClonedElementEvents(clonedElement);

                fragment.appendChild(clonedElement);
            }
        }

        // Replace content
        virtualScrollContent.innerHTML = '';
        virtualScrollContent.appendChild(fragment);
    }

    /**
     * Set up event handling for cloned Pokemon card elements
     */
    function setupClonedElementEvents(element) {
        // Find clickable elements in the cloned card
        const header = element.querySelector('.pokemon-header');
        const issueHeaders = element.querySelectorAll('.issue-header');

        // Set up Pokemon card toggle
        if (header) {
            header.addEventListener('click', event => {
                handleCardToggle(event);
            });

            header.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleCardToggle(event);
                }
            });
        }

        // Set up issue card toggles
        issueHeaders.forEach(issueHeader => {
            issueHeader.addEventListener('click', event => {
                handleCardToggle(event);
            });

            issueHeader.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleCardToggle(event);
                }
            });
        });
    }

    /**
     * Update virtual scroll when filters change
     */
    function updateVirtualScrollFilters() {
        if (!virtualScrollEnabled) return;

        // Update visibility status for all items
        allPokemonData.forEach((item, index) => {
            const card = item.element;
            const completeness = parseInt(card.dataset.completeness) || 0;
            const pokemonName = (card.dataset.pokemonName || '').toLowerCase();

            // Apply search filter
            const matchesSearch = !currentSearchQuery || pokemonName.includes(currentSearchQuery);

            // Apply Pokemon completeness filter
            let matchesFilter = false;
            switch (currentPokemonFilter) {
                case 'all':
                    matchesFilter = true;
                    break;
                case 'complete':
                    matchesFilter = completeness >= 100;
                    break;
                case 'high':
                    matchesFilter = completeness >= 75;
                    break;
                case 'low':
                    matchesFilter = completeness < 75;
                    break;
                default:
                    matchesFilter = true;
            }

            // Update visibility
            item.visible = matchesSearch && matchesFilter;
        });

        // Reset scroll to top when filters change
        if (virtualScrollContainer) {
            virtualScrollContainer.scrollTop = 0;
        }

        // Update virtual scroll view
        updateVirtualScroll();
    }
    function initializeSearch() {
        const searchInput = document.getElementById('pokemon-search');
        const clearButton = document.getElementById('clear-search');
        const resultsCount = document.getElementById('search-results-count');

        if (!searchInput) return;

        let searchTimeout;

        // Handle search input with debouncing
        searchInput.addEventListener('input', event => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearchQuery = event.target.value.trim().toLowerCase();
                updateFilters();

                // Show/hide clear button
                if (clearButton) {
                    clearButton.style.display = currentSearchQuery ? 'block' : 'none';
                }
            }, 300); // 300ms debounce
        });

        // Handle clear search button
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                searchInput.value = '';
                currentSearchQuery = '';
                updateFilters();
                clearButton.style.display = 'none';
                searchInput.focus(); // Return focus to search input
                announceToScreenReader('Search cleared');
            });

            // Handle Enter key on clear button
            clearButton.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    clearButton.click();
                }
            });
        }

        // Handle Enter key in search input
        searchInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                // Force update in case debounce hasn't fired
                currentSearchQuery = searchInput.value.trim().toLowerCase();
                updateFilters();
            }
        });

        // Initialize clear button visibility
        if (clearButton) {
            clearButton.style.display = 'none';
        }
    }

    /**
     * Update search results count display
     */
    function updateSearchResultsCount(visibleCount, totalCount) {
        const resultsCount = document.getElementById('search-results-count');
        if (!resultsCount) return;

        if (currentSearchQuery) {
            const message =
                visibleCount === 1
                    ? `${visibleCount} of ${totalCount} Pokemon found`
                    : `${visibleCount} of ${totalCount} Pokemon found`;
            resultsCount.textContent = message;
            resultsCount.style.display = 'block';
        } else {
            resultsCount.style.display = 'none';
        }
    }
    function updateFilters() {
        if (virtualScrollEnabled) {
            // Use virtual scrolling filter update
            updateVirtualScrollFilters();

            // Count visible items for search results
            const visibleCount = visiblePokemonData.length;
            const totalCount = allPokemonData.length;

            // Update search results count
            updateSearchResultsCount(visibleCount, totalCount);

            // Announce filter results to screen readers
            if (currentSearchQuery) {
                const message =
                    visibleCount === 1
                        ? `Search for "${currentSearchQuery}" found ${visibleCount} Pokemon`
                        : `Search for "${currentSearchQuery}" found ${visibleCount} Pokemon`;
                announceToScreenReader(message);
            } else {
                announceFilterResults(visibleCount);
            }

            return;
        }

        // Original non-virtual scrolling implementation
        const pokemonCards = document.querySelectorAll('.pokemon-card');
        let visibleCount = 0;
        const totalCount = pokemonCards.length;

        pokemonCards.forEach(card => {
            const completeness = parseInt(card.dataset.completeness) || 0;
            const pokemonName = (card.dataset.pokemonName || '').toLowerCase();
            let showPokemon = false;

            // Apply search filter first
            const matchesSearch = !currentSearchQuery || pokemonName.includes(currentSearchQuery);

            // Apply Pokemon completeness filter
            let matchesFilter = false;
            switch (currentPokemonFilter) {
                case 'all':
                    matchesFilter = true;
                    break;
                case 'complete':
                    matchesFilter = completeness >= 100;
                    break;
                case 'high':
                    matchesFilter = completeness >= 75;
                    break;
                case 'low':
                    matchesFilter = completeness < 75;
                    break;
                default:
                    matchesFilter = true;
            }

            // Pokemon is shown if it matches both search and filter
            showPokemon = matchesSearch && matchesFilter;

            if (showPokemon) {
                card.classList.remove('hidden');
                card.setAttribute('aria-hidden', 'false');
                visibleCount++;

                // Apply attribute filter to issues within visible cards
                filterAttributesInCard(card);
            } else {
                card.classList.add('hidden');
                card.setAttribute('aria-hidden', 'true');
            }
        });

        // Update search results count
        updateSearchResultsCount(visibleCount, totalCount);

        // Announce filter results to screen readers
        if (currentSearchQuery) {
            const message =
                visibleCount === 1
                    ? `Search for "${currentSearchQuery}" found ${visibleCount} Pokemon`
                    : `Search for "${currentSearchQuery}" found ${visibleCount} Pokemon`;
            announceToScreenReader(message);
        } else {
            announceFilterResults(visibleCount);
        }
    }

    /**
     * Filter attributes (issues) within a specific Pokemon card
     * @param {HTMLElement} card - The Pokemon card element
     */
    function filterAttributesInCard(card) {
        const issues = card.querySelectorAll('.issue');
        let visibleIssues = 0;

        issues.forEach(issue => {
            let showIssue = true;

            switch (currentAttributeFilter) {
                case 'all':
                    showIssue = true;
                    break;
                case 'validated':
                    showIssue =
                        issue.classList.contains('accepted') ||
                        issue.classList.contains('accurate');
                    break;
                case 'issues':
                    showIssue =
                        !issue.classList.contains('accepted') &&
                        !issue.classList.contains('accurate');
                    break;
                default:
                    showIssue = true;
            }

            if (showIssue) {
                issue.classList.remove('hidden');
                issue.setAttribute('aria-hidden', 'false');
                visibleIssues++;
            } else {
                issue.classList.add('hidden');
                issue.setAttribute('aria-hidden', 'true');
            }
        });

        // Show/hide "no issues" message if no issues are visible
        const noIssuesElement = card.querySelector('.no-issues');
        if (noIssuesElement) {
            if (visibleIssues === 0 && currentAttributeFilter !== 'issues') {
                noIssuesElement.style.display = 'block';
            } else {
                noIssuesElement.style.display = 'none';
            }
        }
    }

    /**
     * Announce filter results to screen readers
     * @param {number} count - Number of visible Pokemon
     */
    function announceFilterResults(count) {
        const announcement = document.getElementById('filter-announcement');
        if (announcement) {
            const message = count === 1 ? `${count} Pokemon shown` : `${count} Pokemon shown`;
            announcement.textContent = message;
        }
    }

    /**
     * Handle filter button clicks
     * @param {Event} event - Click event
     */
    function handleFilterClick(event) {
        const btn = event.target.closest('.filter-btn');
        if (!btn) return;

        const filterType = btn.dataset.filter;
        const filterValue = btn.dataset.value;

        // Update active state within the same filter group
        const filterGroup = btn.closest('.filter-group');
        if (filterGroup) {
            filterGroup.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
        }

        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        // Update current filter state
        if (filterType === 'pokemon') {
            currentPokemonFilter = filterValue;
        } else if (filterType === 'attributes') {
            currentAttributeFilter = filterValue;
        }

        // Apply filters
        updateFilters();

        // Announce change to screen readers
        const filterName = filterType === 'pokemon' ? 'Pokemon filter' : 'Attribute filter';
        const filterLabel = btn.textContent.replace(/\s+\d+$/, '').trim(); // Remove count
        announceToScreenReader(`${filterName} changed to ${filterLabel}`);
    }

    /**
     * Toggle Pokemon card collapse state
     * @param {Event} event - Click event
     */
    function handleCardToggle(event) {
        const header = event.target.closest('.pokemon-header');
        if (header) {
            const card = header.closest('.pokemon-card');
            if (!card) return;

            const isCollapsed = card.classList.toggle('collapsed');

            // Update ARIA attributes
            const content = card.querySelector('.pokemon-content');
            if (content) {
                content.setAttribute('aria-hidden', isCollapsed);
            }

            // Update header ARIA attributes
            header.setAttribute('aria-expanded', !isCollapsed);

            // Announce state change to screen readers
            const pokemonName = card.querySelector('.pokemon-name')?.textContent || 'Pokemon';
            const state = isCollapsed ? 'collapsed' : 'expanded';
            announceToScreenReader(`${pokemonName} card ${state}`);
            return;
        }

        // Handle field card toggle (issue cards)
        const issueHeader = event.target.closest('.issue-header');
        if (issueHeader) {
            const issue = issueHeader.closest('.issue');
            if (!issue) return;

            const isCollapsed = issue.classList.toggle('collapsed');

            // Update ARIA attributes
            const content = issue.querySelector('.issue-content');
            if (content) {
                content.setAttribute('aria-hidden', isCollapsed);
            }

            // Update header ARIA attributes
            issueHeader.setAttribute('aria-expanded', !isCollapsed);

            // Announce state change to screen readers
            const fieldName = issue.querySelector('.issue-field')?.textContent || 'Field';
            const state = isCollapsed ? 'collapsed' : 'expanded';
            announceToScreenReader(`${fieldName} field ${state}`);
        }
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     */
    function announceToScreenReader(message) {
        const announcement = document.getElementById('sr-announcement');
        if (announcement) {
            announcement.textContent = message;
            // Clear after a short delay to allow multiple announcements
            setTimeout(() => {
                announcement.textContent = '';
            }, 1000);
        }
    }

    /**
     * Handle keyboard navigation for interactive elements
     * @param {KeyboardEvent} event - Keyboard event
     */
    function handleKeyboardNavigation(event) {
        // Handle Enter and Space keys for filter buttons and card headers
        if (event.key === 'Enter' || event.key === ' ') {
            const target = event.target;

            if (
                target.classList.contains('filter-btn') ||
                target.classList.contains('pokemon-header') ||
                target.classList.contains('issue-header')
            ) {
                event.preventDefault();
                target.click();
            }
        }

        // Handle Escape key to close any open tooltips or reset focus
        if (event.key === 'Escape') {
            document.querySelectorAll('.tooltip').forEach(tooltip => {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
            });
        }
    }

    /**
     * Initialize accessibility features
     */
    function initializeAccessibility() {
        // Add ARIA live region for announcements
        if (!document.getElementById('sr-announcement')) {
            const announcement = document.createElement('div');
            announcement.id = 'sr-announcement';
            announcement.setAttribute('aria-live', 'polite');
            announcement.setAttribute('aria-atomic', 'true');
            announcement.style.cssText = `
                position: absolute;
                left: -10000px;
                width: 1px;
                height: 1px;
                overflow: hidden;
            `;
            document.body.appendChild(announcement);
        }

        // Add ARIA live region for filter results
        if (!document.getElementById('filter-announcement')) {
            const filterAnnouncement = document.createElement('div');
            filterAnnouncement.id = 'filter-announcement';
            filterAnnouncement.setAttribute('aria-live', 'polite');
            filterAnnouncement.setAttribute('aria-atomic', 'true');
            filterAnnouncement.style.cssText = `
                position: absolute;
                left: -10000px;
                width: 1px;
                height: 1px;
                overflow: hidden;
            `;
            document.body.appendChild(filterAnnouncement);
        }

        // Set initial ARIA attributes for filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.setAttribute('role', 'button');
            btn.setAttribute('tabindex', '0');
            btn.setAttribute('aria-pressed', btn.classList.contains('active'));
        });

        // Set initial ARIA attributes for Pokemon headers
        document.querySelectorAll('.pokemon-header').forEach(header => {
            header.setAttribute('role', 'button');
            header.setAttribute('tabindex', '0');
            header.setAttribute('aria-expanded', 'false'); // Start collapsed

            // Add event listeners for Pokemon card toggle
            header.addEventListener('click', event => {
                handleCardToggle(event);
            });

            header.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleCardToggle(event);
                }
            });

            const card = header.closest('.pokemon-card');
            if (card) {
                const content = card.querySelector('.pokemon-content');
                if (content) {
                    content.setAttribute('aria-hidden', 'true'); // Content hidden by default
                }
            }
        });

        // Set initial ARIA attributes for issue headers (field cards)
        document.querySelectorAll('.issue-header').forEach(header => {
            // Only add interactive attributes if the issue has collapsible content
            const issue = header.closest('.issue');
            const content = issue?.querySelector('.issue-content');

            if (content) {
                header.setAttribute('role', 'button');
                header.setAttribute('tabindex', '0');
                header.setAttribute('aria-expanded', 'false'); // Start collapsed
                content.setAttribute('aria-hidden', 'true'); // Content hidden by default

                // Add event listeners for issue card toggle
                header.addEventListener('click', event => {
                    handleCardToggle(event);
                });

                header.addEventListener('keydown', event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleCardToggle(event);
                    }
                });
            }
        });

        // Set initial ARIA attributes for Pokemon cards
        document.querySelectorAll('.pokemon-card').forEach(card => {
            card.setAttribute('aria-hidden', 'false');
        });
    }

    /**
     * Initialize tooltip functionality
     */
    function initializeTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', () => {
                const tooltip = element.querySelector('.tooltip');
                if (tooltip) {
                    tooltip.style.opacity = '1';
                    tooltip.style.visibility = 'visible';
                }
            });

            element.addEventListener('mouseleave', () => {
                const tooltip = element.querySelector('.tooltip');
                if (tooltip) {
                    tooltip.style.opacity = '0';
                    tooltip.style.visibility = 'hidden';
                }
            });

            // Keyboard focus support for tooltips
            element.addEventListener('focus', () => {
                const tooltip = element.querySelector('.tooltip');
                if (tooltip) {
                    tooltip.style.opacity = '1';
                    tooltip.style.visibility = 'visible';
                }
            });

            element.addEventListener('blur', () => {
                const tooltip = element.querySelector('.tooltip');
                if (tooltip) {
                    tooltip.style.opacity = '0';
                    tooltip.style.visibility = 'hidden';
                }
            });
        });
    }

    /**
     * Initialize smooth scrolling for internal links
     */
    function initializeSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', event => {
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    event.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                    });
                }
            });
        });
    }

    /**
     * Handle responsive behavior
     */
    function handleResponsiveFeatures() {
        // Collapse all cards on mobile by default
        if (window.innerWidth <= 768) {
            document.querySelectorAll('.pokemon-card').forEach(card => {
                card.classList.add('collapsed');
                const header = card.querySelector('.pokemon-header');
                const content = card.querySelector('.pokemon-content');

                if (header) header.setAttribute('aria-expanded', 'false');
                if (content) content.setAttribute('aria-hidden', 'true');
            });
        }
    }

    /**
     * Quick Fix Functionality
     */
    function initializeQuickFix() {
        // Use event delegation for dynamically created Quick Fix buttons
        document.addEventListener('click', handleQuickFixClick);
        document.addEventListener('keydown', handleQuickFixKeyboard);

        // Also handle dialog-specific events with delegation
        document.addEventListener('click', handleDialogClick);
        document.addEventListener('keydown', handleDialogKeyboard);
    }

    function handleQuickFixClick(event) {
        const quickFixBtn = event.target.closest('.quick-fix-btn');
        if (!quickFixBtn) return;

        event.preventDefault();
        event.stopPropagation();

        const pokemonId = quickFixBtn.getAttribute('data-pokemon-id');
        const field = quickFixBtn.getAttribute('data-field');
        const action = quickFixBtn.getAttribute('data-action');

        console.log('Quick Fix button clicked:', { pokemonId, field, action, button: quickFixBtn });

        if (!pokemonId || !field || !action) {
            console.error('Quick Fix button missing required data attributes', {
                pokemonId,
                field,
                action,
            });
            return;
        }

        performQuickFixAction(action, pokemonId, field, quickFixBtn);
    }

    function handleDialogClick(event) {
        const target = event.target;

        // Handle close button
        if (target.matches('.dialog-close') || target.closest('.dialog-close')) {
            event.preventDefault();
            event.stopPropagation();
            console.log('Dialog close button clicked');
            closeActiveDialog();
            return;
        }

        // Handle copy button
        if (target.matches('.copy-command-btn') || target.closest('.copy-command-btn')) {
            event.preventDefault();
            event.stopPropagation();
            console.log('Copy button clicked');
            copyCommandFromDialog();
            return;
        }

        // Handle copy and close button
        if (target.matches('#copyAndClose') || target.closest('#copyAndClose')) {
            event.preventDefault();
            event.stopPropagation();
            console.log('Copy and close button clicked');
            copyCommandFromDialog();
            setTimeout(closeActiveDialog, 1000);
            return;
        }

        // Handle close only button
        if (target.matches('#closeOnly') || target.closest('#closeOnly')) {
            event.preventDefault();
            event.stopPropagation();
            console.log('Close only button clicked');
            closeActiveDialog();
            return;
        }

        // Handle click outside dialog to close
        if (target.matches('.quick-fix-dialog-overlay')) {
            console.log('Clicked outside dialog');
            closeActiveDialog();
            return;
        }
    }

    function handleDialogKeyboard(event) {
        const dialog = document.getElementById('quickFixDialog');
        if (!dialog) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            console.log('Escape key pressed in dialog');
            closeActiveDialog();
        }
    }

    function closeActiveDialog() {
        const dialog = document.getElementById('quickFixDialog');
        if (dialog) {
            console.log('Closing active dialog');
            const originalButton = dialog.dataset.originalButton;
            dialog.remove();

            // Return focus to original button if available
            if (originalButton) {
                const button = document.querySelector(`[data-pokemon-id="${originalButton}"]`);
                if (button) {
                    button.focus();
                }
            }
        }
    }

    function copyCommandFromDialog() {
        const dialog = document.getElementById('quickFixDialog');
        if (!dialog) {
            console.error('Dialog not found for copy operation');
            return;
        }

        const commandCodeElement = dialog.querySelector('.command-code');
        if (!commandCodeElement) {
            console.error('Command code element not found');
            return;
        }

        const commandText = commandCodeElement.textContent;
        console.log('Copying command:', commandText);

        const copyBtn = dialog.querySelector('.copy-command-btn');

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(commandText)
                .then(() => {
                    console.log('Command copied successfully via clipboard API');
                    showCopyFeedback(copyBtn);
                    announceToScreenReader('Command copied to clipboard');
                })
                .catch(err => {
                    console.error('Clipboard API failed:', err);
                    fallbackCopy(commandText, copyBtn);
                });
        } else {
            console.log('Using fallback copy method');
            fallbackCopy(commandText, copyBtn);
        }
    }

    function fallbackCopy(text, feedbackElement) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('Fallback copy successful');
                showCopyFeedback(feedbackElement);
                announceToScreenReader('Command copied to clipboard');
            } else {
                console.error('Fallback copy failed');
            }
        } catch (err) {
            console.error('Fallback copy error:', err);
        }

        document.body.removeChild(textArea);
    }

    function showCopyFeedback(element) {
        if (!element) return;

        const originalText = element.textContent;
        element.textContent = '✅ Copied!';
        element.classList.add('qf-copied');

        setTimeout(() => {
            element.textContent = originalText;
            element.classList.remove('qf-copied');
        }, 2000);
    }

    function handleQuickFixKeyboard(event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        const quickFixBtn = event.target.closest('.quick-fix-btn');
        if (!quickFixBtn) return;

        event.preventDefault();
        event.stopPropagation();
        quickFixBtn.click();
    }

    function performQuickFixAction(action, pokemonId, field, buttonElement) {
        console.log('performQuickFixAction called:', { action, pokemonId, field, buttonElement });

        // All Quick Fix actions now use the same logic
        showQuickFixFeedback(buttonElement, 'processing');
        const command = `node scripts/validation-cli.js ${action} ${pokemonId} ${field}`;
        showQuickFixDialog(action, pokemonId, field, command, buttonElement);
    }

    function showQuickFixDialog(action, pokemonId, field, command, buttonElement) {
        const pokemonName = getPokemonNameById(pokemonId) || `Pokemon #${pokemonId}`;

        // Handle different action types
        let actionText, dialogIcon;
        if (action === 'accept-issue') {
            actionText = 'Accept Issue';
            dialogIcon = '🔧';
        } else if (action === 'remove-accepted') {
            actionText = 'Remove Accepted Status';
            dialogIcon = '🔧';
        } else if (action === 'set-in-game-validated') {
            actionText = 'Mark as In-Game Validated';
            dialogIcon = '🎮';
        } else if (action === 'remove-in-game-validated') {
            actionText = 'Remove In-Game Validation';
            dialogIcon = '🗑️';
        } else {
            actionText = 'Quick Fix Action';
            dialogIcon = '🔧';
        }

        // Remove any existing dialog first
        const existingDialog = document.getElementById('quickFixDialog');
        if (existingDialog) {
            existingDialog.remove();
        }

        // Create dialog HTML with inline event handlers for guaranteed functionality
        const dialogHTML = `
            <div class="quick-fix-dialog-overlay" id="quickFixDialog" data-original-button="${pokemonId}-${field}">
                <div class="quick-fix-dialog" role="dialog" aria-labelledby="dialogTitle" aria-describedby="dialogContent">
                    <div class="quick-fix-dialog-header">
                        <h3 id="dialogTitle">${dialogIcon} ${actionText}</h3>
                        <button class="dialog-close" aria-label="Close dialog" onclick="window.PokemonReport.closeQuickFixDialog()">&times;</button>
                    </div>
                    <div class="quick-fix-dialog-content" id="dialogContent">
                        <p>To ${actionText.toLowerCase()} for <strong>${pokemonName}</strong> field <strong>${field}</strong>, run this command in your terminal:</p>
                        <div class="command-container">
                            <code class="command-code">${command}</code>
                            <button class="copy-command-btn" title="Copy command to clipboard" onclick="window.PokemonReport.copyQuickFixCommand()">📋 Copy</button>
                        </div>
                        <div class="quick-fix-note">
                            <p><strong>Note:</strong> After running the command, regenerate the report to see the changes:</p>
                            <code>node scripts/validation-cli.js --generate-report --open</code>
                        </div>
                    </div>
                    <div class="quick-fix-dialog-actions">
                        <button class="dialog-btn dialog-btn-primary" onclick="window.PokemonReport.copyAndCloseQuickFixDialog()">Copy & Close</button>
                        <button class="dialog-btn dialog-btn-secondary" onclick="window.PokemonReport.closeQuickFixDialog()">Close</button>
                    </div>
                </div>
            </div>
        `;

        // Add dialog to page
        document.body.insertAdjacentHTML('beforeend', dialogHTML);

        // Focus the close button for accessibility
        setTimeout(() => {
            const closeBtn = document.querySelector('#quickFixDialog .dialog-btn-secondary');
            if (closeBtn) {
                closeBtn.focus();
            }
        }, 100);

        // Store original button reference for focus return
        const dialog = document.getElementById('quickFixDialog');
        if (dialog) {
            dialog.originalButton = buttonElement;
        }

        // Handle escape key
        const handleEscape = e => {
            if (e.key === 'Escape') {
                window.PokemonReport.closeQuickFixDialog();
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Store the escape handler so we can remove it later
        if (dialog) {
            dialog.escapeHandler = handleEscape;
        }
    }

    function setupQuickFixDialog(command, buttonElement) {
        const dialog = document.getElementById('quickFixDialog');

        if (!dialog) {
            console.error('Quick Fix dialog not found');
            return;
        }

        const closeBtn = dialog.querySelector('.dialog-close');
        const copyBtn = dialog.querySelector('.copy-command-btn');
        const copyAndCloseBtn = dialog.getElementById('copyAndClose');
        const closeOnlyBtn = dialog.getElementById('closeOnly');

        console.log('Dialog elements found:', {
            dialog: !!dialog,
            closeBtn: !!closeBtn,
            copyBtn: !!copyBtn,
            copyAndCloseBtn: !!copyAndCloseBtn,
            closeOnlyBtn: !!closeOnlyBtn,
        });

        // Focus the dialog for accessibility
        setTimeout(() => {
            if (closeOnlyBtn) {
                closeOnlyBtn.focus();
            }
        }, 100);

        // Close handlers
        const closeDialog = () => {
            console.log('Closing dialog');
            dialog.remove();
            showQuickFixFeedback(buttonElement, 'ready');
            buttonElement.focus(); // Return focus to button
        };

        // Add event listeners with error checking
        if (closeBtn) {
            closeBtn.addEventListener('click', e => {
                console.log('Close button clicked');
                e.preventDefault();
                e.stopPropagation();
                closeDialog();
            });
        }

        if (closeOnlyBtn) {
            closeOnlyBtn.addEventListener('click', e => {
                console.log('Close only button clicked');
                e.preventDefault();
                e.stopPropagation();
                closeDialog();
            });
        }

        // Copy command handlers
        const copyCommand = () => {
            console.log('Copy command function called');
            const commandCodeElement = dialog.querySelector('.command-code');
            if (!commandCodeElement) {
                console.error('Command code element not found');
                return;
            }

            const commandText = commandCodeElement.textContent;
            console.log('Copying command:', commandText);

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard
                    .writeText(commandText)
                    .then(() => {
                        console.log('Command copied successfully via clipboard API');
                        showQuickFixFeedback(copyBtn, 'copied');
                        announceToScreenReader('Command copied to clipboard');
                    })
                    .catch(err => {
                        console.error('Clipboard API failed:', err);
                        fallbackCopy(commandText);
                    });
            } else {
                console.log('Using fallback copy method');
                fallbackCopy(commandText);
            }
        };

        const fallbackCopy = text => {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    console.log('Fallback copy successful');
                    showQuickFixFeedback(copyBtn, 'copied');
                    announceToScreenReader('Command copied to clipboard');
                } else {
                    console.error('Fallback copy failed');
                }
            } catch (err) {
                console.error('Fallback copy error:', err);
            }

            document.body.removeChild(textArea);
        };

        if (copyBtn) {
            copyBtn.addEventListener('click', e => {
                console.log('Copy button clicked');
                e.preventDefault();
                e.stopPropagation();
                copyCommand();
            });
        }

        if (copyAndCloseBtn) {
            copyAndCloseBtn.addEventListener('click', e => {
                console.log('Copy and close button clicked');
                e.preventDefault();
                e.stopPropagation();
                copyCommand();
                setTimeout(closeDialog, 1000); // Increased delay to show feedback
            });
        }

        // Keyboard navigation
        dialog.addEventListener('keydown', e => {
            console.log('Dialog keydown:', e.key);
            if (e.key === 'Escape') {
                e.preventDefault();
                closeDialog();
            }
        });

        // Click outside to close
        dialog.addEventListener('click', e => {
            if (e.target === dialog) {
                console.log('Clicked outside dialog');
                closeDialog();
            }
        });
    }

    function showQuickFixFeedback(element, state) {
        if (!element) {
            console.error('showQuickFixFeedback: element is null');
            return;
        }

        element.classList.remove('qf-processing', 'qf-copied', 'qf-ready');

        switch (state) {
            case 'processing':
                element.classList.add('qf-processing');
                const originalProcessingText = element.textContent;
                element.textContent = '⏳ Processing...';
                element.dataset.originalText = originalProcessingText;
                break;
            case 'copied':
                element.classList.add('qf-copied');
                const originalCopyText = element.textContent;
                element.textContent = '✅ Copied!';
                setTimeout(() => {
                    if (element.dataset.originalText) {
                        element.textContent = element.dataset.originalText;
                    } else {
                        element.textContent = originalCopyText;
                    }
                    element.classList.remove('qf-copied');
                }, 2000);
                break;
            case 'ready':
                element.classList.add('qf-ready');
                if (element.dataset.originalText) {
                    element.textContent = element.dataset.originalText;
                    delete element.dataset.originalText;
                }
                break;
        }
    }

    function getPokemonNameById(pokemonId) {
        // Try to find Pokemon name from the page content
        const pokemonCard = document.querySelector(`[data-pokemon-id="${pokemonId}"]`);
        if (pokemonCard) {
            const nameElement = pokemonCard.querySelector('.pokemon-name');
            if (nameElement) {
                return nameElement.textContent.trim();
            }
        }
        return null;
    }

    /**
     * Initialize the report functionality
     */
    function initializeReport() {
        // Set up event listeners
        document.addEventListener('click', handleFilterClick);
        document.addEventListener('keydown', handleKeyboardNavigation);

        // Initialize features
        initializeDarkMode();
        initializeHistoricalData();
        initializeSearch();
        initializeAccessibility();
        initializeTooltips();
        initializeSmoothScrolling();
        initializeVirtualScrolling();
        initializeCharts();
        initializeQuickFix();
        handleResponsiveFeatures();

        // Apply initial filters
        updateFilters();

        // Generate progress summary and add change indicators
        setTimeout(() => {
            generateProgressSummary();
            addChangeIndicatorsToPokemonCards();

            // Add export history button listener
            const exportBtn = document.getElementById('export-history-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', exportHistoricalData);
            }
        }, 500);

        // Handle window resize for responsive features
        window.addEventListener('resize', handleResponsiveFeatures);

        // Announce that the report is ready
        setTimeout(() => {
            announceToScreenReader('Pokemon validation report loaded and ready for interaction');
        }, 1000);
    }

    /**
     * Charts Management
     */
    let chartsInstance = null;

    function initializeCharts() {
        // Check if chart data is available
        if (!window.chartData) {
            console.warn('Chart data not available');
            return;
        }

        // Render charts on page load
        renderAllCharts();
    }

    function renderAllCharts() {
        if (!window.chartData) return;

        renderCompletionChart();
        renderIssuesChart();
        renderLevelsChart();
        renderTrendChart();
    }

    function renderCompletionChart() {
        const canvas = document.getElementById('completion-chart');
        const legend = document.getElementById('completion-legend');
        if (!canvas || !legend) return;

        const ctx = canvas.getContext('2d');
        const data = window.chartData.completion;

        // Calculate percentages
        const total = data.total;
        const complete = data.complete;
        const high = data.highValidation;
        const low = data.lowValidation;

        // Donut chart data
        const chartData = [
            { label: '100% Validated', value: complete, color: '#48bb78' },
            { label: '75%+ Validated', value: high, color: '#ed8936' },
            { label: 'Below 75%', value: low, color: '#f56565' },
        ];

        renderDonutChart(ctx, chartData, canvas.width, canvas.height);
        renderLegend(legend, chartData, 'completion');
    }

    function renderIssuesChart() {
        const canvas = document.getElementById('issues-chart');
        const legend = document.getElementById('issues-legend');
        if (!canvas || !legend) return;

        const ctx = canvas.getContext('2d');
        const severityData = window.chartData.issues.severityCounts;

        // Bar chart data
        const chartData = [
            {
                label: 'Missing Attributes',
                value: severityData.missing_attribute || 0,
                color: '#f56565',
            },
            { label: 'Data Mismatches', value: severityData.inaccurate || 0, color: '#ed8936' },
            {
                label: 'Source Conflicts',
                value: severityData.source_conflict || 0,
                color: '#fbbf24',
            },
            { label: 'Partial Matches', value: severityData.partial_match || 0, color: '#4299e1' },
            { label: 'No Reference', value: severityData.no_reference || 0, color: '#9ca3af' },
        ].filter(item => item.value > 0); // Only show categories with issues

        renderBarChart(ctx, chartData, canvas.width, canvas.height);
        renderLegend(legend, chartData, 'issues');
    }

    function renderLevelsChart() {
        const canvas = document.getElementById('levels-chart');
        const legend = document.getElementById('levels-legend');
        if (!canvas || !legend) return;

        const ctx = canvas.getContext('2d');
        const data = window.chartData.levels;

        // Horizontal bar chart data
        const chartData = [
            { label: '100% Complete', value: data.complete, color: '#48bb78' },
            { label: '75%+ Validated', value: data.high, color: '#ed8936' },
            { label: 'Below 75%', value: data.low, color: '#f56565' },
        ];

        renderHorizontalBarChart(ctx, chartData, canvas.width, canvas.height);
        renderLegend(legend, chartData, 'levels');
    }

    function renderTrendChart() {
        const canvas = document.getElementById('trend-chart');
        const legend = document.getElementById('trend-legend');
        if (!canvas || !legend) return;

        const ctx = canvas.getContext('2d');
        const trendData = getHistoricalTrendData();

        if (trendData.length < 2) {
            drawNoDataMessage(
                ctx,
                canvas.width,
                canvas.height,
                'Need at least 2 reports to display trend'
            );
            legend.innerHTML =
                '<div class="legend-item"><span>Generate more reports to see trends</span></div>';
            return;
        }

        renderLineChart(ctx, trendData, canvas.width, canvas.height);

        // Create legend
        legend.innerHTML = `
            <div class="legend-item">
                <div class="legend-color" style="background-color: #4299e1; width: 20px; height: 3px; border-radius: 1px;"></div>
                <span>Average Completeness (%)</span>
            </div>
        `;
    }

    function renderDonutChart(ctx, data, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        const outerRadius = Math.min(centerX, centerY) - 20;
        const innerRadius = outerRadius * 0.6;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        const total = data.reduce((sum, item) => sum + item.value, 0);
        if (total === 0) {
            drawNoDataMessage(ctx, width, height, 'No data to display');
            return;
        }

        let currentAngle = -Math.PI / 2; // Start from top

        data.forEach(item => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;

            // Draw slice
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
            ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();

            // Draw border
            ctx.strokeStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--bg-card')
                .trim();
            ctx.lineWidth = 2;
            ctx.stroke();

            currentAngle += sliceAngle;
        });

        // Draw center text
        ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--text-primary')
            .trim();
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total.toString(), centerX, centerY - 8);
        ctx.font = '12px sans-serif';
        ctx.fillText('Pokemon', centerX, centerY + 8);
    }

    function renderBarChart(ctx, data, width, height) {
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (data.length === 0) {
            drawNoDataMessage(ctx, width, height, 'No issues found');
            return;
        }

        const maxValue = Math.max(...data.map(item => item.value));
        const barWidth = chartWidth / data.length;

        data.forEach((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = padding + index * barWidth + barWidth * 0.1;
            const y = height - padding - barHeight;
            const actualBarWidth = barWidth * 0.8;

            // Draw bar
            ctx.fillStyle = item.color;
            ctx.fillRect(x, y, actualBarWidth, barHeight);

            // Draw value on top
            ctx.fillStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-primary')
                .trim();
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.value.toString(), x + actualBarWidth / 2, y - 5);
        });
    }

    function renderHorizontalBarChart(ctx, data, width, height) {
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (data.length === 0 || data.every(item => item.value === 0)) {
            drawNoDataMessage(ctx, width, height, 'No data to display');
            return;
        }

        const maxValue = Math.max(...data.map(item => item.value));
        const barHeight = chartHeight / data.length;

        data.forEach((item, index) => {
            const barWidth = (item.value / maxValue) * chartWidth;
            const x = padding;
            const y = padding + index * barHeight + barHeight * 0.1;
            const actualBarHeight = barHeight * 0.8;

            // Draw bar
            ctx.fillStyle = item.color;
            ctx.fillRect(x, y, barWidth, actualBarHeight);

            // Draw value at end of bar
            ctx.fillStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--text-primary')
                .trim();
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.value.toString(), x + barWidth + 5, y + actualBarHeight / 2);
        });
    }

    function renderLineChart(ctx, data, width, height) {
        const padding = 60;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (data.length === 0) {
            drawNoDataMessage(ctx, width, height, 'No historical data available');
            return;
        }

        // Find min/max values for scaling
        const completenessValues = data.map(item => item.averageCompleteness);
        const minCompleteness = Math.max(0, Math.min(...completenessValues) - 5);
        const maxCompleteness = Math.min(100, Math.max(...completenessValues) + 5);

        // Calculate x-axis positions
        const xStep = chartWidth / (data.length - 1);

        // Draw grid lines
        ctx.strokeStyle =
            getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() ||
            '#e5e7eb';
        ctx.lineWidth = 1;

        // Horizontal grid lines (y-axis)
        for (let i = 0; i <= 4; i++) {
            const y = padding + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();

            // Y-axis labels
            const value = Math.round(
                maxCompleteness - (maxCompleteness - minCompleteness) * (i / 4)
            );
            ctx.fillStyle =
                getComputedStyle(document.documentElement)
                    .getPropertyValue('--text-muted')
                    .trim() || '#6b7280';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${value}%`, padding - 8, y);
        }

        // Draw the trend line
        ctx.strokeStyle = '#4299e1';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();

        data.forEach((point, index) => {
            const x = padding + xStep * index;
            const y =
                padding +
                chartHeight -
                ((point.averageCompleteness - minCompleteness) /
                    (maxCompleteness - minCompleteness)) *
                    chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw data points
        data.forEach((point, index) => {
            const x = padding + xStep * index;
            const y =
                padding +
                chartHeight -
                ((point.averageCompleteness - minCompleteness) /
                    (maxCompleteness - minCompleteness)) *
                    chartHeight;

            // Draw point
            ctx.fillStyle = '#4299e1';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();

            // Draw value label above point
            ctx.fillStyle =
                getComputedStyle(document.documentElement)
                    .getPropertyValue('--text-primary')
                    .trim() || '#1f2937';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`${point.averageCompleteness.toFixed(1)}%`, x, y - 8);
        });

        // Draw x-axis labels (dates)
        ctx.fillStyle =
            getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() ||
            '#6b7280';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        data.forEach((point, index) => {
            const x = padding + xStep * index;
            const date = new Date(point.timestamp);
            const dateLabel = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });

            // Rotate text for better fit
            ctx.save();
            ctx.translate(x, height - padding + 8);
            ctx.rotate(-Math.PI / 6);
            ctx.fillText(dateLabel, 0, 0);
            ctx.restore();
        });

        // Draw chart title
        ctx.fillStyle =
            getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() ||
            '#1f2937';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('Average Completeness Over Time', width / 2, 10);
    }

    function renderLegend(container, data, chartType) {
        container.innerHTML = '';

        data.forEach(item => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.setAttribute('role', 'listitem');
            legendItem.setAttribute('tabindex', '0');

            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = item.color;

            const label = document.createElement('span');
            label.textContent = `${item.label} (${item.value})`;

            legendItem.appendChild(colorBox);
            legendItem.appendChild(label);
            container.appendChild(legendItem);

            // Add keyboard support
            legendItem.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    legendItem.click();
                }
            });
        });
    }

    function drawNoDataMessage(ctx, width, height, message) {
        ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--text-muted')
            .trim();
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(message, width / 2, height / 2);
    }

    function refreshChartsWithCurrentData() {
        // This function will be called when filters change
        // For now, we'll keep the original data, but this is where
        // we'd update chart data based on current filters
        if (chartsInstance) {
            renderAllCharts();
        }
    }

    /**
     * Export functions for testing or external use
     */
    window.PokemonReport = {
        updateFilters,
        handleFilterClick,
        handleCardToggle,
        announceToScreenReader,
        refreshChartsWithCurrentData,
        closeQuickFixDialog: function () {
            console.log('closeQuickFixDialog called');
            const dialog = document.getElementById('quickFixDialog');
            if (dialog) {
                // Remove escape key handler
                if (dialog.escapeHandler) {
                    document.removeEventListener('keydown', dialog.escapeHandler);
                }

                // Return focus to original button
                if (dialog.originalButton) {
                    showQuickFixFeedback(dialog.originalButton, 'ready');
                    dialog.originalButton.focus();
                }

                dialog.remove();
            }
        },
        copyQuickFixCommand: function () {
            console.log('copyQuickFixCommand called');
            const dialog = document.getElementById('quickFixDialog');
            if (!dialog) {
                console.error('Dialog not found for copy operation');
                return;
            }

            const commandCodeElement = dialog.querySelector('.command-code');
            if (!commandCodeElement) {
                console.error('Command code element not found');
                return;
            }

            const commandText = commandCodeElement.textContent;
            const copyBtn = dialog.querySelector('.copy-command-btn');

            console.log('Copying command:', commandText);

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard
                    .writeText(commandText)
                    .then(() => {
                        console.log('Command copied successfully');
                        showCopyFeedback(copyBtn);
                        announceToScreenReader('Command copied to clipboard');
                    })
                    .catch(err => {
                        console.error('Clipboard API failed:', err);
                        fallbackCopy(commandText, copyBtn);
                    });
            } else {
                fallbackCopy(commandText, copyBtn);
            }
        },
        copyAndCloseQuickFixDialog: function () {
            console.log('copyAndCloseQuickFixDialog called');
            this.copyQuickFixCommand();
            setTimeout(() => {
                this.closeQuickFixDialog();
            }, 1000);
        },

        currentFilters: {
            get pokemon() {
                return currentPokemonFilter;
            },
            get attributes() {
                return currentAttributeFilter;
            },
        },
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeReport);
    } else {
        initializeReport();
    }
})();
