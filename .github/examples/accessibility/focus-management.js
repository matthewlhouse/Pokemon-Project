// Focus Management Implementation for Pokemon Walkthrough Project
// This file contains focus trap and restoration patterns referenced in Accessibility-Standards.md

class FocusManager {
    constructor() {
        this.focusHistory = [];
        this.activeFocusTrap = null;
        this.restoreTargets = new Map();
        this.setupFocusTracking();
    }

    setupFocusTracking() {
        // Track focus changes for restoration
        document.addEventListener('focusin', event => {
            this.recordFocus(event.target);
        });

        // Handle focus trap escaping
        document.addEventListener('keydown', event => {
            if (event.key === 'Tab' && this.activeFocusTrap) {
                this.handleTrapNavigation(event);
            }

            if (event.key === 'Escape' && this.activeFocusTrap) {
                this.releaseFocusTrap();
            }
        });
    }

    recordFocus(element) {
        // Only record focusable elements that aren't part of focus traps
        if (!element.closest('[data-focus-trap]')) {
            this.focusHistory.push({
                element,
                timestamp: Date.now(),
                selector: this.generateSelector(element),
            });

            // Keep history manageable (last 10 focus changes)
            if (this.focusHistory.length > 10) {
                this.focusHistory.shift();
            }
        }
    }

    generateSelector(element) {
        // Generate a selector that can be used to re-find the element
        if (element.id) {
            return `#${element.id}`;
        }

        if (element.className) {
            const classes = element.className.split(' ').filter(c => c.trim());
            if (classes.length > 0) {
                return `.${classes.join('.')}`;
            }
        }

        // Fallback to tag name with position
        const siblings = Array.from(element.parentNode?.children || []);
        const index = siblings.indexOf(element);
        return `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
    }

    // Focus trap functionality
    createFocusTrap(container, autoActivate = true) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }

        if (!container) {
            console.warn('Focus trap container not found');
            return null;
        }

        // Mark container as focus trap
        container.setAttribute('data-focus-trap', 'true');

        const trap = {
            container,
            previousFocus: document.activeElement,
            focusableElements: this.getFocusableElements(container),
            activate: () => this.activateFocusTrap(trap),
            deactivate: () => this.deactivateFocusTrap(trap),
            updateFocusableElements: () => {
                trap.focusableElements = this.getFocusableElements(container);
            },
        };

        if (autoActivate) {
            trap.activate();
        }

        return trap;
    }

    activateFocusTrap(trap) {
        // Deactivate any existing trap
        if (this.activeFocusTrap) {
            this.deactivateFocusTrap(this.activeFocusTrap);
        }

        this.activeFocusTrap = trap;

        // Focus first focusable element
        const firstFocusable = trap.focusableElements[0];
        if (firstFocusable) {
            firstFocusable.focus();
        }

        // Announce trap activation to screen readers
        this.announceToScreenReader('Dialog opened. Press Escape to close.');
    }

    deactivateFocusTrap(trap) {
        if (this.activeFocusTrap === trap) {
            this.activeFocusTrap = null;
        }

        // Remove focus trap marker
        trap.container.removeAttribute('data-focus-trap');

        // Restore focus to previous element
        if (trap.previousFocus && document.contains(trap.previousFocus)) {
            trap.previousFocus.focus();
        } else {
            // Fallback to a logical default
            this.restoreFocusToDefault();
        }

        this.announceToScreenReader('Dialog closed.');
    }

    handleTrapNavigation(event) {
        const trap = this.activeFocusTrap;
        if (!trap || trap.focusableElements.length === 0) return;

        const currentIndex = trap.focusableElements.indexOf(document.activeElement);

        // Handle Shift+Tab (backwards navigation)
        if (event.shiftKey && currentIndex <= 0) {
            // Wrap to last element
            event.preventDefault();
            trap.focusableElements[trap.focusableElements.length - 1].focus();
            return;
        }

        // Handle Tab (forwards navigation)
        if (!event.shiftKey && currentIndex >= trap.focusableElements.length - 1) {
            // Wrap to first element
            event.preventDefault();
            trap.focusableElements[0].focus();
        }
    }

    releaseFocusTrap() {
        if (this.activeFocusTrap) {
            this.deactivateFocusTrap(this.activeFocusTrap);
        }
    }

    getFocusableElements(container) {
        const focusableSelectors = [
            'button:not([disabled])',
            '[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            'summary',
        ].join(', ');

        return Array.from(container.querySelectorAll(focusableSelectors)).filter(element => {
            return (
                element.offsetParent !== null && // Element is visible
                !element.hasAttribute('aria-hidden') &&
                window.getComputedStyle(element).visibility !== 'hidden'
            );
        });
    }

    // Focus restoration functionality
    saveFocusTarget(key, element) {
        this.restoreTargets.set(key, {
            element,
            selector: this.generateSelector(element),
            timestamp: Date.now(),
        });

        // Also save to sessionStorage for persistence across page reloads
        try {
            const focusData = {
                selector: this.generateSelector(element),
                timestamp: Date.now(),
            };
            sessionStorage.setItem(`focus-target-${key}`, JSON.stringify(focusData));
        } catch (error) {
            console.warn('Could not save focus target to sessionStorage:', error);
        }
    }

    restoreFocusTarget(key, fallbackElement = null) {
        let target = this.restoreTargets.get(key);

        // Try to restore from sessionStorage if not in memory
        if (!target) {
            try {
                const stored = sessionStorage.getItem(`focus-target-${key}`);
                if (stored) {
                    const focusData = JSON.parse(stored);
                    target = {
                        element: document.querySelector(focusData.selector),
                        selector: focusData.selector,
                        timestamp: focusData.timestamp,
                    };
                }
            } catch (error) {
                console.warn('Could not restore focus target from sessionStorage:', error);
            }
        }

        // Try to focus the saved element
        if (target?.element && document.contains(target.element)) {
            target.element.focus();
            return true;
        }

        // Try to find element by selector if the element reference is stale
        if (target?.selector) {
            const element = document.querySelector(target.selector);
            if (element) {
                element.focus();
                return true;
            }
        }

        // Use fallback element
        if (fallbackElement && document.contains(fallbackElement)) {
            fallbackElement.focus();
            return true;
        }

        // Final fallback to focus history
        return this.restoreFocusFromHistory();
    }

    restoreFocusFromHistory() {
        // Try to restore focus from recent history
        for (let i = this.focusHistory.length - 1; i >= 0; i--) {
            const record = this.focusHistory[i];

            // Try direct element reference first
            if (record.element && document.contains(record.element)) {
                record.element.focus();
                return true;
            }

            // Try selector
            const element = document.querySelector(record.selector);
            if (element) {
                element.focus();
                return true;
            }
        }

        return false;
    }

    restoreFocusToDefault() {
        // Default focus restoration order
        const defaultTargets = [
            '#main-content', // Skip to main content
            '.step-checkbox', // First step
            'button', // Any button
            '[href]', // Any link
            'input', // Any input
        ];

        for (const selector of defaultTargets) {
            const element = document.querySelector(selector);
            if (element) {
                element.focus();
                return true;
            }
        }

        // Ultimate fallback - focus body
        document.body.focus();
        return false;
    }

    // Settings panel focus management
    handleSettingsPanelOpen() {
        const panel = document.getElementById('settings-panel');
        const toggle = document.getElementById('settings-toggle');

        if (panel && toggle) {
            // Save current focus
            this.saveFocusTarget('settings-panel', document.activeElement);

            // Create focus trap for settings panel
            const trap = this.createFocusTrap(panel, false);

            // Focus first element in panel
            const firstFocusable = panel.querySelector('input, button, select');
            if (firstFocusable) {
                firstFocusable.focus();
            }

            return trap;
        }

        return null;
    }

    handleSettingsPanelClose() {
        // Release any active focus trap
        this.releaseFocusTrap();

        // Restore focus to settings toggle
        const toggle = document.getElementById('settings-toggle');
        if (toggle) {
            toggle.focus();
        } else {
            // Fallback restoration
            this.restoreFocusTarget('settings-panel', document.getElementById('settings-toggle'));
        }
    }

    // Location section focus management
    handleLocationToggle(detailsElement, isOpening) {
        if (isOpening) {
            // Save focus on the summary element
            const summary = detailsElement.querySelector('summary');
            if (summary) {
                this.saveFocusTarget(`location-${detailsElement.dataset.locationId}`, summary);
            }
        } else {
            // Restore focus to summary when closing
            const summary = detailsElement.querySelector('summary');
            if (summary) {
                summary.focus();
            }
        }
    }

    // Step navigation focus management
    focusNextStep(currentStep) {
        const allSteps = this.getVisibleSteps();
        const currentIndex = allSteps.indexOf(currentStep);

        if (currentIndex < allSteps.length - 1) {
            const nextStep = allSteps[currentIndex + 1];
            const checkbox = nextStep.querySelector('.step-checkbox');
            if (checkbox) {
                checkbox.focus();
                return true;
            }
        }

        return false;
    }

    focusPreviousStep(currentStep) {
        const allSteps = this.getVisibleSteps();
        const currentIndex = allSteps.indexOf(currentStep);

        if (currentIndex > 0) {
            const previousStep = allSteps[currentIndex - 1];
            const checkbox = previousStep.querySelector('.step-checkbox');
            if (checkbox) {
                checkbox.focus();
                return true;
            }
        }

        return false;
    }

    getVisibleSteps() {
        return Array.from(document.querySelectorAll('.step:not([style*="display: none"])'));
    }

    // Utility methods
    announceToScreenReader(message) {
        if (window.screenReaderManager) {
            window.screenReaderManager.announcePolitely(message);
        } else {
            // Fallback announcement
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', 'polite');
            announcement.setAttribute('aria-atomic', 'true');
            announcement.className = 'sr-only';
            announcement.textContent = message;

            document.body.appendChild(announcement);

            setTimeout(() => {
                if (document.body.contains(announcement)) {
                    document.body.removeChild(announcement);
                }
            }, 1000);
        }
    }

    // Clean up old restore targets
    cleanupOldTargets() {
        const now = Date.now();
        const maxAge = 30 * 60 * 1000; // 30 minutes
        let cleanupErrors = 0;

        for (const [key, target] of this.restoreTargets.entries()) {
            if (now - target.timestamp > maxAge) {
                this.restoreTargets.delete(key);

                // Also clean up sessionStorage
                try {
                    sessionStorage.removeItem(`focus-target-${key}`);
                } catch (error) {
                    cleanupErrors++;
                    // Log specific storage errors for debugging, but don't throw
                    console.warn(`Failed to cleanup sessionStorage for key ${key}:`, error.name);

                    // For SecurityError or InvalidAccessError, we might want to stop trying
                    if (error.name === 'SecurityError' || error.name === 'InvalidAccessError') {
                        console.warn('SessionStorage cleanup disabled due to browser restrictions');
                        break; // Stop trying to clean sessionStorage for remaining items
                    }
                }
            }
        }

        // Report cleanup summary if there were issues
        if (cleanupErrors > 0) {
            console.info(`Focus target cleanup completed with ${cleanupErrors} storage errors`);
        }
    }
}

// Initialize focus management
document.addEventListener('DOMContentLoaded', () => {
    window.focusManager = new FocusManager();

    // Clean up old targets periodically
    setInterval(
        () => {
            window.focusManager.cleanupOldTargets();
        },
        5 * 60 * 1000
    ); // Every 5 minutes
});

export default FocusManager;
