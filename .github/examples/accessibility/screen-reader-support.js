// Screen Reader Support Implementation for Pokemon Walkthrough Project
// This file contains ARIA and announcement patterns referenced in Accessibility-Standards.md

class ScreenReaderManager {
  constructor() {
    this.lastAnnouncement = '';
    this.lastAnnouncementTime = 0;
    this.announcementQueue = [];
    this.isProcessingQueue = false;
    this.setupLiveRegions();
    this.setupEventListeners();
  }

  setupLiveRegions() {
    // Create dedicated live regions for different types of announcements
    this.createLiveRegion('aria-live-polite', 'polite');
    this.createLiveRegion('aria-live-assertive', 'assertive');
    this.createLiveRegion('aria-live-status', 'polite', 'status');
  }

  createLiveRegion(id, politeness, role = null) {
    if (document.getElementById(id)) return; // Already exists
    
    const region = document.createElement('div');
    region.id = id;
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    if (role) region.setAttribute('role', role);
    region.className = 'sr-only';
    region.textContent = ''; // Start empty
    
    document.body.appendChild(region);
  }

  setupEventListeners() {
    // Listen for step completion events
    document.addEventListener('change', (event) => {
      if (event.target.matches('.step-checkbox')) {
        this.handleStepToggle(event.target);
      }
    });

    // Listen for filter changes
    document.addEventListener('filter-applied', (event) => {
      this.announceFilterChange(event.detail);
    });

    // Listen for progress updates
    document.addEventListener('progress-updated', (event) => {
      this.announceProgressUpdate(event.detail);
    });
  }

  handleStepToggle(checkbox) {
    const stepElement = checkbox.closest('.step');
    const stepText = stepElement.querySelector('.step-text')?.textContent || 'Step';
    const location = stepElement.dataset.location || '';
    const category = stepElement.dataset.category || '';
    const isCompleted = checkbox.checked;
    
    let announcement = '';
    
    if (isCompleted) {
      // Provide context-aware completion message
      if (category === 'pokemon') {
        announcement = `Pokemon catching step completed: ${stepText}`;
      } else if (category === 'gym-battle') {
        announcement = `Gym battle completed: ${stepText}`;
      } else if (location) {
        announcement = `${this.formatLocation(location)} step completed: ${stepText}`;
      } else {
        announcement = `Step completed: ${stepText}`;
      }
    } else {
      announcement = `Step unchecked: ${stepText}`;
    }
    
    this.announcePolitely(announcement);
  }

  announceFilterChange(filterData) {
    const { visibleSteps, totalSteps, activeFilters } = filterData;
    
    let announcement = `Filter applied. Showing ${visibleSteps} of ${totalSteps} steps`;
    
    if (activeFilters.length > 0) {
      announcement += `. Active filters: ${activeFilters.join(', ')}`;
    }
    
    this.announcePolitely(announcement);
  }

  announceProgressUpdate(progressData) {
    const { completedSteps, totalSteps, percentage } = progressData;
    const announcement = `Progress updated: ${completedSteps} of ${totalSteps} steps completed, ${Math.round(percentage)}% complete`;
    
    this.announcePolitely(announcement);
  }

  announcePolitely(message, force = false) {
    this.announce(message, 'polite', force);
  }

  announceAssertively(message, force = false) {
    this.announce(message, 'assertive', force);
  }

  announceStatus(message, force = false) {
    this.announce(message, 'status', force);
  }

  announce(message, type = 'polite', force = false) {
    const now = Date.now();
    
    // Prevent duplicate announcements within 2 seconds unless forced
    if (!force && this.lastAnnouncement === message && (now - this.lastAnnouncementTime) < 2000) {
      return;
    }
    
    this.lastAnnouncement = message;
    this.lastAnnouncementTime = now;
    
    // Add to queue for processing
    this.announcementQueue.push({ message, type, timestamp: now });
    this.processAnnouncementQueue();
  }

  async processAnnouncementQueue() {
    if (this.isProcessingQueue || this.announcementQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    while (this.announcementQueue.length > 0) {
      const { message, type } = this.announcementQueue.shift();
      
      // Select appropriate live region
      let regionId;
      switch (type) {
        case 'assertive':
          regionId = 'aria-live-assertive';
          break;
        case 'status':
          regionId = 'aria-live-status';
          break;
        default:
          regionId = 'aria-live-polite';
      }
      
      const region = document.getElementById(regionId);
      if (region) {
        // Clear the region first, then set the message
        region.textContent = '';
        
        // Small delay to ensure screen readers notice the change
        await this.delay(50);
        region.textContent = message;
      }
      
      // Wait between announcements to avoid overwhelming users
      await this.delay(300);
    }
    
    this.isProcessingQueue = false;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  formatLocation(locationId) {
    // Convert kebab-case location IDs to readable names
    return locationId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Utility methods for common ARIA patterns

  setExpanded(element, isExpanded) {
    element.setAttribute('aria-expanded', isExpanded);
    
    // Announce the state change
    const elementName = element.textContent || element.getAttribute('aria-label') || 'Element';
    const state = isExpanded ? 'expanded' : 'collapsed';
    this.announcePolitely(`${elementName} ${state}`);
  }

  setPressed(element, isPressed) {
    element.setAttribute('aria-pressed', isPressed);
    
    // Announce the state change
    const elementName = element.textContent || element.getAttribute('aria-label') || 'Button';
    const state = isPressed ? 'pressed' : 'not pressed';
    this.announcePolitely(`${elementName} ${state}`);
  }

  setSelected(element, isSelected) {
    element.setAttribute('aria-selected', isSelected);
    
    if (isSelected) {
      const elementName = element.textContent || element.getAttribute('aria-label') || 'Item';
      this.announcePolitely(`${elementName} selected`);
    }
  }

  updateProgressBar(progressBar, value, max = 100) {
    progressBar.setAttribute('aria-valuenow', value);
    progressBar.setAttribute('aria-valuemax', max);
    
    const percentage = Math.round((value / max) * 100);
    const progressText = `${percentage}% complete`;
    
    // Update visible text if present
    const progressTextElement = progressBar.querySelector('.progress-text');
    if (progressTextElement) {
      progressTextElement.textContent = progressText;
    }
    
    // Set aria-valuetext for more descriptive announcements
    progressBar.setAttribute('aria-valuetext', progressText);
  }

  announceError(message) {
    this.announceAssertively(`Error: ${message}`);
  }

  announceSuccess(message) {
    this.announcePolitely(`Success: ${message}`);
  }

  announceLoading(isLoading, context = '') {
    let message;
    
    if (isLoading) {
      message = context ? `Loading ${context}...` : 'Loading...';
    } else {
      message = context ? `Loading complete for ${context}` : 'Loading complete';
    }
    
    this.announcePolitely(message);
  }
}

// Initialize screen reader support
document.addEventListener('DOMContentLoaded', () => {
  window.screenReaderManager = new ScreenReaderManager();
});

export default ScreenReaderManager;
