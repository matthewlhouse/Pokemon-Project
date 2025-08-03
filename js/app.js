/**
 * Pokemon Walkthrough - Main Application Entry Point
 * Coordinates all modules and handles application initialization
 */

// Import utility modules
import { Storage } from './utils/storage.js';
import { EventEmitter } from './utils/events.js';
import { DOM } from './utils/dom.js';

// Import core modules
import { ProgressTracker } from './modules/progress.js';
import { FilterSystem } from './modules/filter.js';
import { UIController } from './modules/ui.js';
import { AccessibilityManager } from './modules/accessibility.js';

/**
 * Main Application Class
 * Orchestrates all modules and handles application lifecycle
 */
class PokemonWalkthroughApp {
    constructor() {
        // Create global event emitter for module communication
        this.eventEmitter = new EventEmitter();
        
        // Initialize modules
        this.storage = new Storage();
        this.progressTracker = new ProgressTracker(this.eventEmitter, this.storage);
        this.filterSystem = new FilterSystem(this.eventEmitter);
        this.uiController = new UIController(this.eventEmitter);
        this.accessibilityManager = new AccessibilityManager(this.eventEmitter);
        
        // Application state
        this.currentGame = null;
        this.isInitialized = false;
        
        // Bind methods
        this.handleGameSelection = this.handleGameSelection.bind(this);
        this.handleSettingsToggle = this.handleSettingsToggle.bind(this);
        this.handleKeyboardNavigation = this.handleKeyboardNavigation.bind(this);
    }
    
    /**
     * Start the application initialization process
     */
    async start() {
        await this.init();
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing Pokemon Walkthrough App...');
            
            // Show loading indicator
            this.showLoading('Initializing application...');
            
            // Initialize modules in order
            await this.initializeModules();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load user preferences and progress
            await this.loadUserData();
            
            // Update UI with current state
            this.updateUI();
            
            // Hide loading indicator
            this.hideLoading();
            
            this.isInitialized = true;
            console.log('✅ Application initialized successfully');
            
            // Emit initialization complete event
            this.eventEmitter.emit('app:initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * Initialize all modules
     */
    async initializeModules() {
        console.log('📦 Initializing modules...');
        
        // Initialize accessibility manager first
        await this.accessibilityManager.init();
        
        // Initialize storage and load data
        await this.storage.init();
        
        // Initialize progress tracker
        await this.progressTracker.init();
        
        // Initialize filter system
        await this.filterSystem.init();
        
        // Initialize UI controller
        await this.uiController.init();
        
        console.log('✅ All modules initialized');
    }
    
    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        console.log('🎧 Setting up event listeners...');
        
        // Game selection buttons
        const gameButtons = DOM.queryAll('.game-button');
        gameButtons.forEach(button => {
            button.addEventListener('click', this.handleGameSelection);
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleGameSelection(e);
                }
            });
        });
        
        // Settings toggle
        const settingsToggle = DOM.query('.settings-toggle');
        if (settingsToggle) {
            settingsToggle.addEventListener('click', this.handleSettingsToggle);
        }
        
        // Settings panel close button
        const settingsClose = DOM.query('.settings-close');
        if (settingsClose) {
            settingsClose.addEventListener('click', () => {
                this.uiController.hideSettings();
            });
        }
        
        // Global keyboard navigation
        document.addEventListener('keydown', this.handleKeyboardNavigation);
        
        // Settings form elements
        this.setupSettingsListeners();
        
        // Window events
        window.addEventListener('beforeunload', () => {
            this.progressTracker.saveProgress();
        });
        
        // Handle browser back/forward navigation
        window.addEventListener('popstate', (e) => {
            if (e.state?.game) {
                this.loadGame(e.state.game);
            }
        });
        
        console.log('✅ Event listeners set up');
    }
    
    /**
     * Set up settings panel event listeners
     */
    setupSettingsListeners() {
        // Content filter checkboxes
        const filterCheckboxes = DOM.queryAll('.settings-panel input[type="checkbox"]');
        filterCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const filterId = e.target.id;
                const isChecked = e.target.checked;
                
                // Handle different types of settings
                if (filterId.startsWith('show-')) {
                    this.filterSystem.updateFilter(filterId.replace('show-', ''), isChecked);
                } else {
                    this.handleDisplayPreference(filterId, isChecked);
                }
            });
        });
        
        // Action buttons
        const exportButton = DOM.query('#export-progress');
        if (exportButton) {
            exportButton.addEventListener('click', () => this.exportProgress());
        }
        
        const importButton = DOM.query('#import-progress');
        if (importButton) {
            importButton.addEventListener('click', () => this.importProgress());
        }
        
        const resetButton = DOM.query('#reset-progress');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetProgress());
        }
    }
    
    /**
     * Handle game selection
     */
    async handleGameSelection(event) {
        const gameId = event.currentTarget.dataset.game;
        if (!gameId) return;
        
        console.log(`🎮 Loading game: ${gameId}`);
        
        try {
            await this.loadGame(gameId);
            
            // Update browser history
            history.pushState({ game: gameId }, '', `#${gameId}`);
            
        } catch (error) {
            console.error(`❌ Failed to load game ${gameId}:`, error);
            this.showError(`Failed to load Pokemon ${gameId.charAt(0).toUpperCase() + gameId.slice(1)}`);
        }
    }
    
    /**
     * Load a specific game
     */
    async loadGame(gameId) {
        this.showLoading(`Loading Pokemon ${gameId.charAt(0).toUpperCase() + gameId.slice(1)}...`);
        
        try {
            // Set current game
            this.currentGame = gameId;
            
            // Load game data
            await this.loadGameData(gameId);
            
            // Update progress tracker
            this.progressTracker.setCurrentGame(gameId);
            
            // Update UI
            this.updateGameUI(gameId);
            
            // Emit game loaded event
            this.eventEmitter.emit('game:loaded', { gameId });
            
            console.log(`✅ Game ${gameId} loaded successfully`);
            
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * Load game-specific data
     * NOTE: Currently simulated - will load from JSON files when data structure is finalized
     */
    async loadGameData(gameId) {
        // This will be implemented when we create the data loading system
        // For now, just simulate loading
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // FUTURE: Load actual game data from JSON files in data/games/{gameId}/
        console.log(`📊 Loading data for ${gameId}...`);
    }
    
    /**
     * Update UI for selected game
     */
    updateGameUI(gameId) {
        // Update game selection visual state
        const gameButtons = DOM.queryAll('.game-button');
        gameButtons.forEach(button => {
            if (button.dataset.game === gameId) {
                button.classList.add('selected');
                button.setAttribute('aria-pressed', 'true');
            } else {
                button.classList.remove('selected');
                button.setAttribute('aria-pressed', 'false');
            }
        });
        
        // Update walkthrough title
        const walkthroughTitle = DOM.query('#walkthrough-title');
        if (walkthroughTitle) {
            const gameName = gameId.charAt(0).toUpperCase() + gameId.slice(1);
            walkthroughTitle.textContent = `Pokemon ${gameName} Walkthrough`;
        }
        
        // Show sample walkthrough content for testing
        const walkthroughSection = DOM.query('#pallet-town');
        if (walkthroughSection) {
            walkthroughSection.classList.remove('hidden');
            this.setupStepListeners();
        }
        
        // Update page title
        document.title = `Pokemon ${gameId.charAt(0).toUpperCase() + gameId.slice(1)} Walkthrough`;
    }
    
    /**
     * Set up step checkbox listeners for progress tracking
     */
    setupStepListeners() {
        const stepCheckboxes = DOM.queryAll('.step-checkbox');
        stepCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const step = e.target.closest('.step');
                const stepId = step?.dataset.stepId;
                
                if (stepId) {
                    if (e.target.checked) {
                        this.progressTracker.completeStep(stepId);
                        step.classList.add('completed');
                    } else {
                        this.progressTracker.uncompleteStep(stepId);
                        step.classList.remove('completed');
                    }
                    
                    this.updateProgressDisplay();
                }
            });
        });
    }
    
    /**
     * Handle settings panel toggle
     */
    handleSettingsToggle() {
        this.uiController.toggleSettings();
    }
    
    /**
     * Handle display preferences
     */
    handleDisplayPreference(preferenceId, isEnabled) {
        const bodyClass = `pref-${preferenceId.replace('-', '_')}`;
        
        if (isEnabled) {
            document.body.classList.add(bodyClass);
        } else {
            document.body.classList.remove(bodyClass);
        }
        
        // Save preference
        this.storage.setItem(`preference_${preferenceId}`, isEnabled);
        
        // Emit preference change event
        this.eventEmitter.emit('preference:changed', { 
            preference: preferenceId, 
            enabled: isEnabled 
        });
    }
    
    /**
     * Handle global keyboard navigation
     */
    handleKeyboardNavigation(event) {
        // Escape key handling
        if (event.key === 'Escape') {
            // Close settings panel if open
            if (this.uiController.isSettingsOpen()) {
                this.uiController.hideSettings();
                return;
            }
        }
        
        // Delegate to accessibility manager
        this.accessibilityManager.handleKeyboard(event);
    }
    
    /**
     * Load user preferences and progress
     */
    async loadUserData() {
        console.log('👤 Loading user data...');
        
        // Load display preferences
        const preferences = ['high-contrast', 'reduce-motion', 'large-text'];
        preferences.forEach(pref => {
            const isEnabled = this.storage.getItem(`preference_${pref}`) === true;
            const checkbox = DOM.query(`#${pref}`);
            if (checkbox) {
                checkbox.checked = isEnabled;
                this.handleDisplayPreference(pref, isEnabled);
            }
        });
        
        // Load filter preferences
        const filters = ['story', 'optional', 'pokemon', 'battles'];
        filters.forEach(filter => {
            const isEnabled = this.storage.getItem(`filter_${filter}`) !== false; // Default to true
            const checkbox = DOM.query(`#show-${filter}`);
            if (checkbox) {
                checkbox.checked = isEnabled;
            }
        });
        
        // Load progress data
        await this.progressTracker.loadProgress();
        
        console.log('✅ User data loaded');
    }
    
    /**
     * Update UI with current application state
     */
    updateUI() {
        // Update progress statistics
        this.updateProgressDisplay();
        
        // Apply current filters
        this.filterSystem.applyFilters();
    }
    
    /**
     * Update progress display
     */
    updateProgressDisplay() {
        const progress = this.progressTracker.getOverallProgress();
        
        // Update step counters
        const stepsCompleted = DOM.query('#steps-completed');
        const totalSteps = DOM.query('#total-steps');
        const pokemonCaught = DOM.query('#pokemon-caught');
        const completionPercentage = DOM.query('#completion-percentage');
        
        if (stepsCompleted) stepsCompleted.textContent = progress.stepsCompleted;
        if (totalSteps) totalSteps.textContent = progress.totalSteps;
        if (pokemonCaught) pokemonCaught.textContent = progress.pokemonCaught;
        if (completionPercentage) completionPercentage.textContent = `${progress.completionPercent}%`;
        
        // Update progress bar
        const progressBar = DOM.query('.progress-bar');
        const progressFill = DOM.query('.progress-fill');
        if (progressBar && progressFill) {
            progressBar.setAttribute('aria-valuenow', progress.completionPercent);
            progressFill.style.width = `${progress.completionPercent}%`;
        }
    }
    
    /**
     * Export user progress
     */
    async exportProgress() {
        try {
            const progressData = await this.progressTracker.exportProgress();
            const dataStr = JSON.stringify(progressData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pokemon-walkthrough-progress-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showSuccess('Progress exported successfully!');
            
        } catch (error) {
            console.error('Failed to export progress:', error);
            this.showError('Failed to export progress');
        }
    }
    
    /**
     * Import user progress
     */
    async importProgress() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                try {
                    const text = await file.text();
                    const progressData = JSON.parse(text);
                    
                    await this.progressTracker.importProgress(progressData);
                    this.updateUI();
                    
                    this.showSuccess('Progress imported successfully!');
                    
                } catch (error) {
                    console.error('Failed to import progress:', error);
                    this.showError('Failed to import progress. Please check the file format.');
                }
            };
            
            input.click();
            
        } catch (error) {
            console.error('Failed to import progress:', error);
            this.showError('Failed to import progress');
        }
    }
    
    /**
     * Reset all progress
     */
    async resetProgress() {
        const confirmed = confirm('Are you sure you want to reset ALL progress? This cannot be undone.');
        if (!confirmed) return;
        
        try {
            await this.progressTracker.resetProgress();
            this.updateUI();
            
            this.showSuccess('All progress has been reset');
            
        } catch (error) {
            console.error('Failed to reset progress:', error);
            this.showError('Failed to reset progress');
        }
    }
    
    /**
     * Show loading indicator
     */
    showLoading(message = 'Loading...') {
        const loadingIndicator = DOM.query('#loading-indicator');
        const loadingText = DOM.query('.loading-text');
        
        if (loadingIndicator) {
            loadingIndicator.setAttribute('aria-hidden', 'false');
            if (loadingText) loadingText.textContent = message;
        }
    }
    
    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loadingIndicator = DOM.query('#loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.setAttribute('aria-hidden', 'true');
        }
    }
    
    /**
     * Show success message
     */
    showSuccess(message) {
        console.log('✅ Success:', message);
        
        // Create temporary notification element
        const notification = document.createElement('div');
        notification.className = 'notification notification-success';
        notification.textContent = message;
        notification.setAttribute('role', 'status');
        notification.setAttribute('aria-live', 'polite');
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
        
        // Emit success event
        this.eventEmitter.emit('notification:success', { message });
    }
    
    /**
     * Show error message
     */
    showError(message) {
        console.error('❌ Error:', message);
        
        // Create temporary notification element
        const notification = document.createElement('div');
        notification.className = 'notification notification-error';
        notification.textContent = `Error: ${message}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds (longer for errors)
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Emit error event
        this.eventEmitter.emit('notification:error', { message });
    }
    
    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        this.hideLoading();
        
        const errorMessage = `
            <div class="initialization-error">
                <h2>Initialization Error</h2>
                <p>The Pokemon Walkthrough app failed to initialize properly.</p>
                <p>Please try refreshing the page. If the problem persists, check the browser console for more details.</p>
                <button onclick="window.location.reload()">Refresh Page</button>
            </div>
        `;
        
        document.body.innerHTML = errorMessage;
    }
    
    /**
     * Clean up resources when the app is destroyed
     */
    destroy() {
        console.log('🧹 Cleaning up application...');
        
        // Save any pending progress
        if (this.progressTracker) {
            this.progressTracker.saveProgress();
        }
        
        // Clean up event listeners
        document.removeEventListener('keydown', this.handleKeyboardNavigation);
        window.removeEventListener('beforeunload', this.destroy);
        
        // Destroy modules
        if (this.accessibilityManager) this.accessibilityManager.destroy();
        if (this.uiController) this.uiController.destroy();
        if (this.filterSystem) this.filterSystem.destroy();
        if (this.progressTracker) this.progressTracker.destroy();
        if (this.eventEmitter) this.eventEmitter.removeAllListeners();
        
        console.log('✅ Application cleaned up');
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Create global app instance
    window.PokemonApp = new PokemonWalkthroughApp();
    
    // Start the application
    await window.PokemonApp.start();
});

// Clean up when page is unloaded
window.addEventListener('beforeunload', () => {
    if (window.PokemonApp) {
        window.PokemonApp.destroy();
    }
});

// Export for testing
export { PokemonWalkthroughApp };
