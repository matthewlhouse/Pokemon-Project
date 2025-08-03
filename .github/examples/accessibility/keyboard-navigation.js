// Keyboard Navigation Implementation for Pokemon Walkthrough Project
// This file contains the complete keyboard handling implementation referenced in Accessibility-Standards.md

class KeyboardNavigationManager {
  constructor() {
    this.currentFocusIndex = 0;
    this.focusableElements = [];
    this.shortcuts = new Map();
    this.setupKeyboardHandlers();
    this.registerShortcuts();
  }

  setupKeyboardHandlers() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    
    // Update focusable elements when DOM changes
    const observer = new MutationObserver(() => {
      this.updateFocusableElements();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  handleKeyDown(event) {
    // Handle global shortcuts first
    if (this.handleShortcuts(event)) {
      return;
    }

    // Handle navigation keys
    switch (event.key) {
      case 'Tab':
        this.handleTabNavigation(event);
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        if (this.isInStepList(event.target)) {
          this.handleArrowNavigation(event);
        }
        break;
      case 'Enter':
      case ' ':
        this.handleActivation(event);
        break;
      case 'Escape':
        this.handleEscape(event);
        break;
    }
  }

  handleShortcuts(event) {
    const shortcutKey = `${event.ctrlKey ? 'Ctrl+' : ''}${event.altKey ? 'Alt+' : ''}${event.key}`;
    const handler = this.shortcuts.get(shortcutKey);
    
    if (handler) {
      event.preventDefault();
      handler(event);
      return true;
    }
    return false;
  }

  registerShortcuts() {
    this.shortcuts.set('Alt+s', () => this.toggleSettingsPanel());
    this.shortcuts.set('Alt+f', () => this.focusFilterControls());
    this.shortcuts.set('Alt+e', () => this.exportProgress());
    this.shortcuts.set('Ctrl+/', () => this.showHelp());
    this.shortcuts.set('F1', () => this.showHelp());
  }

  handleTabNavigation(event) {
    this.updateFocusableElements();
    
    if (event.shiftKey) {
      // Shift+Tab - previous element
      this.currentFocusIndex = Math.max(0, this.currentFocusIndex - 1);
    } else {
      // Tab - next element
      this.currentFocusIndex = Math.min(this.focusableElements.length - 1, this.currentFocusIndex + 1);
    }
  }

  handleArrowNavigation(event) {
    event.preventDefault();
    
    const stepElements = this.getStepElements();
    const currentStepIndex = stepElements.indexOf(event.target.closest('.step'));
    
    if (currentStepIndex === -1) return;
    
    let nextIndex;
    if (event.key === 'ArrowDown') {
      nextIndex = Math.min(stepElements.length - 1, currentStepIndex + 1);
    } else {
      nextIndex = Math.max(0, currentStepIndex - 1);
    }
    
    const nextStep = stepElements[nextIndex];
    const checkbox = nextStep.querySelector('.step-checkbox');
    if (checkbox) {
      checkbox.focus();
    }
  }

  handleActivation(event) {
    const target = event.target;
    
    // Handle summary elements (details/summary)
    if (target.matches('summary')) {
      // Let default behavior handle, but announce the change
      setTimeout(() => {
        const details = target.parentElement;
        const locationName = target.querySelector('.location-name')?.textContent || 'Section';
        const action = details.hasAttribute('open') ? 'expanded' : 'collapsed';
        this.announceToScreenReader(`${locationName} ${action}`);
      }, 100);
      return;
    }
    
    // Handle checkboxes
    if (target.matches('.step-checkbox')) {
      // Let default behavior handle the check/uncheck
      return;
    }
    
    // Handle buttons
    if (target.matches('button')) {
      // Let default behavior handle
      return;
    }
  }

  handleEscape(event) {
    // Close any open modals or panels
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel && settingsPanel.getAttribute('aria-hidden') === 'false') {
      this.closeSettingsPanel();
      event.preventDefault();
    }
    
    // Close any open details elements when focused
    const openDetails = event.target.closest('details[open]');
    if (openDetails) {
      openDetails.removeAttribute('open');
      event.preventDefault();
    }
  }

  updateFocusableElements() {
    this.focusableElements = Array.from(document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), summary'
    )).filter(el => {
      return !el.disabled && 
             !el.hasAttribute('aria-hidden') && 
             el.offsetParent !== null;
    });
  }

  isInStepList(element) {
    return element.closest('.steps-container') !== null;
  }

  getStepElements() {
    return Array.from(document.querySelectorAll('.step:not([style*="display: none"])'));
  }

  // Shortcut implementations
  toggleSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    const toggle = document.getElementById('settings-toggle');
    
    if (panel && toggle) {
      const isOpen = panel.getAttribute('aria-hidden') === 'false';
      
      if (isOpen) {
        this.closeSettingsPanel();
      } else {
        this.openSettingsPanel();
      }
    }
  }

  openSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    const toggle = document.getElementById('settings-toggle');
    
    panel.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    
    // Focus first focusable element in panel
    const firstFocusable = panel.querySelector('input, button, select');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  closeSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    const toggle = document.getElementById('settings-toggle');
    
    panel.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    
    // Return focus to toggle button
    toggle.focus();
  }

  focusFilterControls() {
    const filterSection = document.querySelector('.filter-section');
    const firstFilter = filterSection?.querySelector('input, button, select');
    if (firstFilter) {
      firstFilter.focus();
    }
  }

  exportProgress() {
    const exportButton = document.getElementById('export-progress');
    if (exportButton) {
      exportButton.click();
    }
  }

  showHelp() {
    // Implementation would show help overlay or navigate to help section
    console.log('Help requested - show keyboard shortcuts and usage guide');
  }

  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }
}

// Initialize keyboard navigation
document.addEventListener('DOMContentLoaded', () => {
  window.keyboardNav = new KeyboardNavigationManager();
});

export default KeyboardNavigationManager;
