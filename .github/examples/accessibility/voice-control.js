// Voice Control Implementation for Pokemon Walkthrough Project
// This file contains speech recognition integration referenced in Accessibility-Standards.md

class VoiceControlManager {
  constructor() {
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    this.isActive = false;
    this.recognition = null;
    this.commands = new Map();
    this.contextualCommands = new Map();
    
    if (this.isSupported) {
      this.setupSpeechRecognition();
      this.registerCommands();
      this.setupVoiceControls();
    }
  }

  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3;

    this.recognition.onstart = () => {
      this.isActive = true;
      this.announceToUser('Voice control activated. Listening...');
      this.showVoiceIndicator(true);
    };

    this.recognition.onend = () => {
      this.isActive = false;
      this.showVoiceIndicator(false);
    };

    this.recognition.onresult = (event) => {
      const results = Array.from(event.results[0]);
      const commands = results.map(result => result.transcript.toLowerCase().trim());
      
      // Try each alternative result until we find a match
      for (const command of commands) {
        if (this.processCommand(command)) {
          break;
        }
      }
    };

    this.recognition.onerror = (event) => {
      this.handleSpeechError(event.error);
    };
  }

  registerCommands() {
    // Navigation commands
    this.commands.set('next step', () => this.navigateToNextStep());
    this.commands.set('previous step', () => this.navigateToPreviousStep());
    this.commands.set('next location', () => this.navigateToNextLocation());
    this.commands.set('previous location', () => this.navigateToPreviousLocation());
    this.commands.set('go to top', () => this.scrollToTop());
    this.commands.set('go to bottom', () => this.scrollToBottom());

    // Action commands
    this.commands.set('complete step', () => this.completeCurrentStep());
    this.commands.set('uncomplete step', () => this.uncompleteCurrentStep());
    this.commands.set('toggle step', () => this.toggleCurrentStep());
    this.commands.set('complete this', () => this.completeCurrentStep());
    this.commands.set('mark done', () => this.completeCurrentStep());

    // UI commands
    this.commands.set('open settings', () => this.openSettings());
    this.commands.set('close settings', () => this.closeSettings());
    this.commands.set('show settings', () => this.openSettings());
    this.commands.set('hide settings', () => this.closeSettings());
    this.commands.set('toggle settings', () => this.toggleSettings());

    // Filter commands
    this.commands.set('show all steps', () => this.applyFilter('all'));
    this.commands.set('show story only', () => this.applyFilter('story'));
    this.commands.set('show pokemon only', () => this.applyFilter('pokemon'));
    this.commands.set('show battles only', () => this.applyFilter('battles'));
    this.commands.set('show completed steps', () => this.toggleCompletedSteps(true));
    this.commands.set('hide completed steps', () => this.toggleCompletedSteps(false));

    // Content commands
    this.commands.set('read current step', () => this.readCurrentStep());
    this.commands.set('read current location', () => this.readCurrentLocation());
    this.commands.set('read progress', () => this.readProgress());
    this.commands.set('what is this', () => this.readCurrentContext());

    // Export/Import commands
    this.commands.set('export progress', () => this.exportProgress());
    this.commands.set('save progress', () => this.exportProgress());

    // Help commands
    this.commands.set('help', () => this.showHelp());
    this.commands.set('voice commands', () => this.showVoiceCommands());
    this.commands.set('what can I say', () => this.showVoiceCommands());

    // Control commands
    this.commands.set('stop listening', () => this.stopVoiceControl());
    this.commands.set('voice off', () => this.stopVoiceControl());
  }

  setupVoiceControls() {
    // Add voice control button to UI
    const voiceButton = document.createElement('button');
    voiceButton.id = 'voice-control-toggle';
    voiceButton.className = 'voice-control-button';
    voiceButton.innerHTML = '🎤';
    voiceButton.setAttribute('aria-label', 'Toggle voice control');
    voiceButton.title = 'Click to activate voice control, or say "help" for commands';
    
    voiceButton.addEventListener('click', () => {
      if (this.isActive) {
        this.stopVoiceControl();
      } else {
        this.startVoiceControl();
      }
    });

    // Add to header or settings area
    const header = document.querySelector('.site-header') || document.body;
    header.appendChild(voiceButton);

    // Create voice indicator
    const indicator = document.createElement('div');
    indicator.id = 'voice-indicator';
    indicator.className = 'voice-indicator hidden';
    indicator.innerHTML = '🎤 Listening...';
    indicator.setAttribute('aria-live', 'polite');
    document.body.appendChild(indicator);

    // Global keyboard shortcut (Alt+V)
    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.key === 'v') {
        event.preventDefault();
        this.toggleVoiceControl();
      }
    });
  }

  // Voice control lifecycle
  startVoiceControl() {
    if (!this.isSupported) {
      this.announceToUser('Voice control is not supported in this browser.');
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      this.announceToUser('Voice control could not be started. Please try again.');
    }
  }

  stopVoiceControl() {
    if (this.recognition && this.isActive) {
      this.recognition.stop();
    }
  }

  toggleVoiceControl() {
    if (this.isActive) {
      this.stopVoiceControl();
    } else {
      this.startVoiceControl();
    }
  }

  // Command processing
  processCommand(command) {
    // Remove common filler words
    const cleanCommand = this.cleanCommand(command);
    
    // Try exact match first
    if (this.commands.has(cleanCommand)) {
      this.executeCommand(cleanCommand);
      return true;
    }

    // Try fuzzy matching for similar commands
    const fuzzyMatch = this.findFuzzyMatch(cleanCommand);
    if (fuzzyMatch) {
      this.executeCommand(fuzzyMatch);
      return true;
    }

    // Try contextual commands
    const contextualMatch = this.findContextualMatch(cleanCommand);
    if (contextualMatch) {
      this.executeCommand(contextualMatch);
      return true;
    }

    // Command not recognized
    this.announceToUser(`Command not recognized: "${command}". Say "help" for available commands.`);
    return false;
  }

  cleanCommand(command) {
    // Remove filler words and normalize
    const fillerWords = ['please', 'can you', 'could you', 'would you', 'now', 'the'];
    const words = command.toLowerCase().split(' ');
    const cleanedWords = words.filter(word => !fillerWords.includes(word));
    return cleanedWords.join(' ').trim();
  }

  findFuzzyMatch(command) {
    let bestMatch = null;
    let bestScore = 0;

    for (const [registeredCommand] of this.commands) {
      const score = this.calculateSimilarity(command, registeredCommand);
      if (score > 0.7 && score > bestScore) {
        bestMatch = registeredCommand;
        bestScore = score;
      }
    }

    return bestMatch;
  }

  calculateSimilarity(str1, str2) {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    return intersection.length / union.length;
  }

  findContextualMatch(command) {
    const currentContext = this.getCurrentContext();
    const contextCommands = this.contextualCommands.get(currentContext);
    
    if (contextCommands?.has(command)) {
      return contextCommands.get(command);
    }

    return null;
  }

  getCurrentContext() {
    // Determine current UI context
    if (document.getElementById('settings-panel')?.getAttribute('aria-hidden') === 'false') {
      return 'settings';
    }

    const focusedStep = document.activeElement?.closest('.step');
    if (focusedStep) {
      return 'step';
    }

    return 'main';
  }

  executeCommand(command) {
    const handler = this.commands.get(command);
    if (handler) {
      try {
        handler();
        this.announceToUser(`Executed: ${command}`);
      } catch (error) {
        console.error('Command execution failed:', error);
        this.announceToUser(`Failed to execute: ${command}`);
      }
    }
  }

  // Command implementations
  navigateToNextStep() {
    const currentStep = document.activeElement?.closest('.step');
    if (window.focusManager) {
      window.focusManager.focusNextStep(currentStep);
    }
  }

  navigateToPreviousStep() {
    const currentStep = document.activeElement?.closest('.step');
    if (window.focusManager) {
      window.focusManager.focusPreviousStep(currentStep);
    }
  }

  navigateToNextLocation() {
    const locations = document.querySelectorAll('.location-section');
    const currentLocation = document.activeElement?.closest('.location-section');
    
    if (currentLocation) {
      const currentIndex = Array.from(locations).indexOf(currentLocation);
      const nextLocation = locations[currentIndex + 1];
      if (nextLocation) {
        const summary = nextLocation.querySelector('summary');
        if (summary) summary.focus();
      }
    } else if (locations.length > 0) {
      const firstSummary = locations[0].querySelector('summary');
      if (firstSummary) firstSummary.focus();
    }
  }

  navigateToPreviousLocation() {
    const locations = document.querySelectorAll('.location-section');
    const currentLocation = document.activeElement?.closest('.location-section');
    
    if (currentLocation) {
      const currentIndex = Array.from(locations).indexOf(currentLocation);
      const previousLocation = locations[currentIndex - 1];
      if (previousLocation) {
        const summary = previousLocation.querySelector('summary');
        if (summary) summary.focus();
      }
    }
  }

  completeCurrentStep() {
    const currentStep = document.activeElement?.closest('.step');
    const checkbox = currentStep?.querySelector('.step-checkbox');
    
    if (checkbox && !checkbox.checked) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  uncompleteCurrentStep() {
    const currentStep = document.activeElement?.closest('.step');
    const checkbox = currentStep?.querySelector('.step-checkbox');
    
    if (checkbox?.checked) {
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  toggleCurrentStep() {
    const currentStep = document.activeElement?.closest('.step');
    const checkbox = currentStep?.querySelector('.step-checkbox');
    
    if (checkbox) {
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  openSettings() {
    const settingsToggle = document.getElementById('settings-toggle');
    if (settingsToggle) {
      settingsToggle.click();
    }
  }

  closeSettings() {
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel && settingsPanel.getAttribute('aria-hidden') === 'false') {
      const closeButton = settingsPanel.querySelector('.settings-close');
      if (closeButton) {
        closeButton.click();
      } else {
        // Fallback to escape key
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }
    }
  }

  toggleSettings() {
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel) {
      const isOpen = settingsPanel.getAttribute('aria-hidden') === 'false';
      if (isOpen) {
        this.closeSettings();
      } else {
        this.openSettings();
      }
    }
  }

  applyFilter(filterType) {
    const presetButton = document.querySelector(`[data-preset="${filterType}"]`);
    if (presetButton) {
      presetButton.click();
    }
  }

  readCurrentStep() {
    const currentStep = document.activeElement?.closest('.step');
    const stepText = currentStep?.querySelector('.step-text')?.textContent;
    
    if (stepText) {
      this.announceToUser(`Current step: ${stepText}`);
    } else {
      this.announceToUser('No step currently focused.');
    }
  }

  readCurrentLocation() {
    const currentLocation = document.activeElement?.closest('.location-section');
    const locationName = currentLocation?.querySelector('.location-name')?.textContent;
    
    if (locationName) {
      this.announceToUser(`Current location: ${locationName}`);
    } else {
      this.announceToUser('No location currently focused.');
    }
  }

  readProgress() {
    const progressBar = document.querySelector('.progress-bar');
    const progressText = progressBar?.querySelector('.progress-text')?.textContent;
    
    if (progressText) {
      this.announceToUser(`Progress: ${progressText}`);
    } else {
      this.announceToUser('Unable to read progress.');
    }
  }

  exportProgress() {
    const exportButton = document.getElementById('export-progress');
    if (exportButton) {
      exportButton.click();
    }
  }

  showHelp() {
    const helpMessage = `
      Voice control is active. Available commands include:
      Navigation: "next step", "previous step", "next location", "previous location"
      Actions: "complete step", "toggle step", "mark done"
      UI: "open settings", "close settings", "toggle settings"
      Filters: "show all steps", "show story only", "show pokemon only"
      Reading: "read current step", "read progress"
      Control: "stop listening", "voice off"
      Say "voice commands" for a complete list.
    `;
    this.announceToUser(helpMessage);
  }

  showVoiceCommands() {
    const commands = Array.from(this.commands.keys()).join(', ');
    this.announceToUser(`Available voice commands: ${commands}`);
  }

  // Utility methods
  showVoiceIndicator(show) {
    const indicator = document.getElementById('voice-indicator');
    if (indicator) {
      indicator.classList.toggle('hidden', !show);
    }
  }

  announceToUser(message) {
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
      }, 3000);
    }
  }

  handleSpeechError(error) {
    let message;
    switch (error) {
      case 'no-speech':
        message = 'No speech detected. Please try again.';
        break;
      case 'audio-capture':
        message = 'Microphone access denied. Please check permissions.';
        break;
      case 'not-allowed':
        message = 'Speech recognition not allowed. Please check permissions.';
        break;
      case 'network':
        message = 'Network error. Please check your connection.';
        break;
      default:
        message = 'Speech recognition error. Please try again.';
    }
    
    this.announceToUser(message);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  toggleCompletedSteps(show) {
    const checkbox = document.getElementById('show-completed');
    if (checkbox) {
      checkbox.checked = show;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  readCurrentContext() {
    const context = this.getCurrentContext();
    let message = '';
    
    switch (context) {
      case 'settings':
        message = 'You are in the settings panel. Available options include filters, display mode, and export functions.';
        break;
      case 'step': {
        const stepElement = document.activeElement?.closest('.step');
        const stepText = stepElement?.querySelector('.step-text')?.textContent;
        const isCompleted = stepElement?.classList?.contains('completed');
        message = `You are focused on a step: ${stepText}. Status: ${isCompleted ? 'completed' : 'not completed'}.`;
        break;
      }
      default:
        message = 'You are in the main walkthrough view. Use navigation commands to move between steps and locations.';
    }
    
    this.announceToUser(message);
  }
}

// Initialize voice control if supported
document.addEventListener('DOMContentLoaded', () => {
  window.voiceControl = new VoiceControlManager();
  
  if (!window.voiceControl.isSupported) {
    console.info('Voice control not supported in this browser');
  }
});

export default VoiceControlManager;
