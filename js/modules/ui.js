/**
 * UI Controller - Manages user interface interactions and state
 * Handles UI updates, animations, and user interactions
 */

export class UIController {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.settingsOpen = false;
        this.isInitialized = false;
    }
    
    /**
     * Initialize the UI controller
     */
    async init() {
        console.log('🎨 Initializing UI controller...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize theme
        this.initializeTheme();
        
        this.isInitialized = true;
        console.log('✅ UI controller initialized');
    }
    
    /**
     * Initialize theme system
     */
    initializeTheme() {
        // Get stored theme preference or default to 'auto'
        const storedTheme = localStorage.getItem('theme-preference') || 'auto';
        this.setTheme(storedTheme);
        
        // Set up theme toggle button
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }
    
    /**
     * Toggle between light/dark/auto themes
     */
    toggleTheme() {
        const currentTheme = localStorage.getItem('theme-preference') || 'auto';
        let newTheme;
        
        switch (currentTheme) {
            case 'light':
                newTheme = 'dark';
                break;
            case 'dark':
                newTheme = 'auto';
                break;
            default:
                newTheme = 'light';
        }
        
        this.setTheme(newTheme);
    }
    
    /**
     * Set the theme
     */
    setTheme(theme) {
        // Store preference
        localStorage.setItem('theme-preference', theme);
        
        // Apply theme to document
        const body = document.body;
        if (theme === 'auto') {
            body.removeAttribute('data-theme');
        } else {
            body.setAttribute('data-theme', theme);
        }
        
        // Update theme toggle button
        this.updateThemeToggleButton(theme);
        
        // Emit theme change event
        this.eventEmitter.emit('theme:changed', { theme });
        
        console.log(`🎨 Theme set to: ${theme}`);
    }
    
    /**
     * Update theme toggle button appearance
     */
    updateThemeToggleButton(theme) {
        const themeToggle = document.querySelector('.theme-toggle');
        const themeIcon = document.querySelector('.theme-icon');
        
        if (themeToggle && themeIcon) {
            // Update icon and aria-label based on current theme
            switch (theme) {
                case 'light':
                    themeIcon.textContent = '🌙';
                    themeToggle.setAttribute('aria-label', 'Switch to dark theme');
                    themeToggle.setAttribute('title', 'Switch to dark theme');
                    break;
                case 'dark':
                    themeIcon.textContent = '🌓';
                    themeToggle.setAttribute('aria-label', 'Switch to auto theme');
                    themeToggle.setAttribute('title', 'Switch to auto theme (follow system)');
                    break;
                default: // auto
                    themeIcon.textContent = '☀️';
                    themeToggle.setAttribute('aria-label', 'Switch to light theme');
                    themeToggle.setAttribute('title', 'Switch to light theme');
            }
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for progress updates to update UI
        this.eventEmitter.on('progress:stepCompleted', (data) => {
            this.updateProgressDisplay();
        });
        
        this.eventEmitter.on('progress:stepUncompleted', (data) => {
            this.updateProgressDisplay();
        });
        
        // Listen for theme changes
        this.eventEmitter.on('theme:changed', (data) => {
            this.handleThemeChange(data.theme);
        });
    }
    
    /**
     * Toggle settings panel visibility
     */
    toggleSettings() {
        if (this.settingsOpen) {
            this.hideSettings();
        } else {
            this.showSettings();
        }
    }
    
    /**
     * Show settings panel
     */
    showSettings() {
        const settingsPanel = document.querySelector('.settings-panel');
        if (settingsPanel) {
            settingsPanel.classList.add('open');
            settingsPanel.setAttribute('aria-hidden', 'false');
            this.settingsOpen = true;
            
            // Focus the first focusable element in the panel
            const firstFocusable = settingsPanel.querySelector('button, input, select, textarea, [tabindex]');
            if (firstFocusable) {
                firstFocusable.focus();
            }
            
            this.eventEmitter.emit('ui:settingsOpened');
        }
    }
    
    /**
     * Hide settings panel
     */
    hideSettings() {
        const settingsPanel = document.querySelector('.settings-panel');
        if (settingsPanel) {
            settingsPanel.classList.remove('open');
            settingsPanel.setAttribute('aria-hidden', 'true');
            this.settingsOpen = false;
            
            // Return focus to settings toggle button
            const settingsToggle = document.querySelector('.settings-toggle');
            if (settingsToggle) {
                settingsToggle.focus();
            }
            
            this.eventEmitter.emit('ui:settingsClosed');
        }
    }
    
    /**
     * Check if settings panel is open
     */
    isSettingsOpen() {
        return this.settingsOpen;
    }
    
    /**
     * Update progress display in the UI
     */
    updateProgressDisplay() {
        // This would update the progress bars and counters
        // For now, just emit an event
        this.eventEmitter.emit('ui:progressUpdated');
        console.log('🎨 Progress display updated');
    }
    
    /**
     * Handle theme change
     */
    handleThemeChange(theme) {
        console.log(`🎨 Theme changed to: ${theme}`);
        
        // Update any theme-specific UI elements
        const body = document.body;
        if (body) {
            body.setAttribute('data-theme', theme);
        }
    }
    
    /**
     * Show a notification message
     */
    showNotification(message, type = 'info', duration = 3000) {
        // This is a stub implementation
        // In the full version, this would show a toast notification
        console.log(`🔔 ${type.toUpperCase()}: ${message}`);
        
        this.eventEmitter.emit('ui:notification', {
            message,
            type,
            duration
        });
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        if (this.settingsOpen) {
            this.hideSettings();
        }
        
        console.log('🧹 UI controller cleaned up');
    }
}
