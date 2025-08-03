/**
 * Event-driven architecture with custom EventEmitter
 * Demonstrates the module communication pattern used throughout the application
 */

// Custom EventEmitter implementation for module communication
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}

// Global event bus for module communication
window.GameEvents = new EventEmitter();

// Example usage in modules
class ProgressManager {
  updateStepProgress(stepId, completed) {
    // Update internal state
    this.progress[stepId] = completed;
    
    // Emit event for other modules
    GameEvents.emit('stepProgressChanged', {
      stepId,
      completed,
      totalProgress: this.calculateTotalProgress()
    });
  }
}

class UIManager {
  constructor() {
    // Listen for progress changes
    GameEvents.on('stepProgressChanged', this.handleProgressUpdate.bind(this));
  }
  
  handleProgressUpdate(data) {
    this.updateProgressBar(data.totalProgress);
    this.announceProgressChange(data);
  }
}

// Export for use in other modules
export { EventEmitter, ProgressManager, UIManager };
