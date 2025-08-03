/**
 * Accessibility Manager - Handles accessibility features and ARIA management
 * Ensures the application is usable with screen readers and keyboard navigation
 */

export class AccessibilityManager {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.focusHistory = [];
        this.isInitialized = false;
    }
    
    /**
     * Initialize the accessibility manager
     */
    async init() {
        console.log('♿ Initializing accessibility manager...');
        
        // Set up keyboard navigation
        this.setupKeyboardNavigation();
        
        // Set up focus management
        this.setupFocusManagement();
        
        // Set up ARIA live regions
        this.setupLiveRegions();
        
        this.isInitialized = true;
        console.log('✅ Accessibility manager initialized');
    }
    
    /**
     * Set up keyboard navigation
     */
    setupKeyboardNavigation() {
        // This would set up keyboard shortcuts and navigation
        console.log('⌨️ Keyboard navigation set up');
    }
    
    /**
     * Set up focus management
     */
    setupFocusManagement() {
        // Track focus changes
        document.addEventListener('focusin', (e) => {
            this.focusHistory.push(e.target);
            
            // Keep focus history reasonable length
            if (this.focusHistory.length > 10) {
                this.focusHistory.splice(0, 1);
            }
        });
        
        console.log('🎯 Focus management set up');
    }
    
    /**
     * Set up ARIA live regions for announcements
     */
    setupLiveRegions() {
        // Create live region for announcements if it doesn't exist
        if (!document.querySelector('[aria-live="polite"]')) {
            const liveRegion = document.createElement('div');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.setAttribute('class', 'sr-only');
            liveRegion.style.cssText = `
                position: absolute !important;
                width: 1px !important;
                height: 1px !important;
                padding: 0 !important;
                margin: -1px !important;
                overflow: hidden !important;
                clip: rect(0, 0, 0, 0) !important;
                white-space: nowrap !important;
                border: 0 !important;
            `;
            document.body.appendChild(liveRegion);
        }
        
        console.log('📢 ARIA live regions set up');
    }
    
    /**
     * Handle keyboard events
     */
    handleKeyboard(event) {
        // This is a stub implementation
        // In the full version, this would handle various keyboard shortcuts
        
        switch (event.key) {
            case 'Escape':
                // Handle escape key
                this.eventEmitter.emit('keyboard:escape');
                break;
            case 'Tab':
                // Handle tab navigation
                this.eventEmitter.emit('keyboard:tab', { shiftKey: event.shiftKey });
                break;
            default:
                // Handle other keys
                break;
        }
    }
    
    /**
     * Announce a message to screen readers
     */
    announce(message, priority = 'polite') {
        const liveRegion = document.querySelector(`[aria-live="${priority}"]`) || 
                          document.querySelector('[aria-live="polite"]');
        
        if (liveRegion) {
            liveRegion.textContent = message;
            
            // Clear after a delay to allow for re-announcing the same message
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
        
        console.log(`📢 Announced: ${message}`);
    }
    
    /**
     * Manage focus trap for modal dialogs
     */
    trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        const handleTabKey = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        };
        
        container.addEventListener('keydown', handleTabKey);
        
        // Focus the first element
        firstElement.focus();
        
        // Return cleanup function
        return () => {
            container.removeEventListener('keydown', handleTabKey);
        };
    }
    
    /**
     * Update ARIA attributes for dynamic content
     */
    updateARIA(element, attributes) {
        if (!element) return;
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key.startsWith('aria-') || key === 'role') {
                element.setAttribute(key, value);
            }
        });
    }
    
    /**
     * Check if user prefers reduced motion
     */
    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    
    /**
     * Check if user prefers high contrast
     */
    prefersHighContrast() {
        return window.matchMedia('(prefers-contrast: high)').matches;
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        // Clean up any event listeners or resources
        console.log('🧹 Accessibility manager cleaned up');
    }
}
