/**
 * Module Interface Pattern for Pokemon Walkthrough Project
 * Demonstrates the standard module structure and inheritance pattern
 */

// Standard module interface pattern
class BaseManager {
  constructor() {
    this.initialized = false;
    this.eventBus = window.GameEvents;
  }
  
  // Standard initialization method
  async initialize() {
    if (this.initialized) return;
    
    await this.loadData();
    this.setupEventListeners();
    this.initialized = true;
    
    this.eventBus.emit('moduleInitialized', {
      module: this.constructor.name,
      timestamp: Date.now()
    });
  }
  
  // Abstract methods to be implemented by subclasses
  async loadData() {
    throw new Error('loadData must be implemented by subclass');
  }
  
  setupEventListeners() {
    throw new Error('setupEventListeners must be implemented by subclass');
  }
  
  // Standard cleanup method
  destroy() {
    this.removeEventListeners();
    this.initialized = false;
  }
  
  removeEventListeners() {
    // Base implementation - subclasses should override
    console.warn('removeEventListeners should be implemented by subclass');
  }
}

// Example implementation - ProgressManager
class ProgressManager extends BaseManager {
  constructor() {
    super();
    this.progress = {};
    this.storageKey = 'pokemon-walkthrough-progress';
  }
  
  async loadData() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      this.progress = stored ? JSON.parse(stored) : this.getDefaultProgress();
    } catch (error) {
      console.error('Failed to load progress data:', error);
      this.progress = this.getDefaultProgress();
    }
  }
  
  setupEventListeners() {
    // Listen for step updates from UI
    this.eventBus.on('stepToggled', this.handleStepToggle.bind(this));
    
    // Listen for data export requests
    this.eventBus.on('exportRequested', this.handleExportRequest.bind(this));
  }
  
  removeEventListeners() {
    this.eventBus.off('stepToggled', this.handleStepToggle);
    this.eventBus.off('exportRequested', this.handleExportRequest);
  }
  
  // Public API methods
  getStepProgress(stepId) {
    return this.progress.steps?.[stepId] || false;
  }
  
  updateStepProgress(stepId, completed) {
    if (!this.progress.steps) {
      this.progress.steps = {};
    }
    
    this.progress.steps[stepId] = completed;
    this.saveProgress();
    
    // Emit event for other modules
    this.eventBus.emit('stepProgressChanged', {
      stepId,
      completed,
      totalProgress: this.calculateTotalProgress()
    });
  }
  
  calculateTotalProgress() {
    const totalSteps = Object.keys(this.progress.steps || {}).length;
    const completedSteps = Object.values(this.progress.steps || {})
      .filter(Boolean).length;
    
    return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  }
  
  saveProgress() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }
  
  getDefaultProgress() {
    return {
      version: '1.0.0',
      steps: {},
      pokemon: {},
      choices: {},
      lastModified: new Date().toISOString()
    };
  }
  
  handleStepToggle(data) {
    this.updateStepProgress(data.stepId, data.completed);
  }
  
  handleExportRequest() {
    const exportData = {
      progress: this.progress,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    this.downloadJSON(exportData, 'pokemon-walkthrough-progress.json');
  }
  
  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], 
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Example implementation - UIManager
class UIManager extends BaseManager {
  constructor() {
    super();
    this.activeModals = [];
    this.focusHistory = [];
  }
  
  async loadData() {
    // UI Manager doesn't need to load external data
    return Promise.resolve();
  }
  
  setupEventListeners() {
    // Listen for progress changes
    this.eventBus.on('stepProgressChanged', this.handleProgressUpdate.bind(this));
    
    // Listen for modal events
    this.eventBus.on('modalOpened', this.handleModalOpened.bind(this));
    this.eventBus.on('modalClosed', this.handleModalClosed.bind(this));
    
    // DOM event listeners
    document.addEventListener('click', this.handleClick.bind(this));
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }
  
  removeEventListeners() {
    this.eventBus.off('stepProgressChanged', this.handleProgressUpdate);
    this.eventBus.off('modalOpened', this.handleModalOpened);
    this.eventBus.off('modalClosed', this.handleModalClosed);
    
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('keydown', this.handleKeydown);
  }
  
  handleProgressUpdate(data) {
    this.updateProgressBar(data.totalProgress);
    this.announceProgressChange(data);
  }
  
  updateProgressBar(percentage) {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.value = Math.round(percentage);
      progressBar.textContent = `${Math.round(percentage)}% Complete`;
    }
  }
  
  announceProgressChange(data) {
    const announcement = `Step ${data.stepId} ${data.completed ? 'completed' : 'unchecked'}. Progress: ${Math.round(data.totalProgress)}%`;
    this.announceToScreenReader(announcement);
  }
  
  announceToScreenReader(message) {
    const liveRegion = document.getElementById('progress-announcements');
    if (liveRegion) {
      liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }
  
  handleModalOpened(data) {
    this.activeModals.push(data.modalId);
    this.saveFocus();
  }
  
  handleModalClosed(data) {
    this.activeModals = this.activeModals.filter(id => id !== data.modalId);
    this.restoreFocus();
  }
  
  saveFocus() {
    this.focusHistory.push(document.activeElement);
  }
  
  restoreFocus() {
    const previousFocus = this.focusHistory.pop();
    previousFocus?.focus?.();
  }
  
  handleClick(event) {
    // Handle various click events
    if (event.target.matches('.step-checkbox')) {
      this.handleStepClick(event.target);
    }
  }
  
  handleKeydown(event) {
    // Handle keyboard shortcuts
    if (event.key === 'Escape' && this.activeModals.length > 0) {
      this.eventBus.emit('closeModal', { 
        modalId: this.activeModals[this.activeModals.length - 1] 
      });
    }
  }
  
  handleStepClick(checkbox) {
    const stepId = checkbox.id;
    const completed = checkbox.checked;
    
    this.eventBus.emit('stepToggled', { stepId, completed });
  }
}

export { BaseManager, ProgressManager, UIManager };
