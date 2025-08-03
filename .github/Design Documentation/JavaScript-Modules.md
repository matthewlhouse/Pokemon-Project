# JavaScript Modules

## Overview

This document defines the JavaScript module architecture, event system, and data structures for the Pokemon Walkthrough Project. The architecture supports both the current vanilla JavaScript implementation and future framework migration.

## Module Architecture Philosophy

- **Module-based architecture**: Separate concerns with focused, testable modules
- **Event-driven communication**: Custom events for loose coupling between modules
- **Progressive enhancement**: Add features based on browser capabilities
- **Performance optimization**: Lazy loading, efficient DOM manipulation, storage optimization

## Core Application Structure

```javascript
// Main application structure
const PokemonWalkthrough = {
  modules: {
    progress: null,
    filter: null,
    pokedex: null,
    items: null,
    battles: null,
    ui: null
  },
  
  async init() {
    // Initialize event bus
    this.eventBus = new EventEmitter();
    
    // Initialize all modules
    this.modules.progress = new ProgressManager(this.eventBus);
    this.modules.filter = new FilterManager(this.eventBus);
    this.modules.pokedex = new PokedexManager(this.eventBus);
    this.modules.items = new ItemsManager(this.eventBus);
    this.modules.battles = new BattlesManager(this.eventBus);
    this.modules.ui = new UIManager(this.eventBus);
    
    // Load user preferences and game data
    await this.loadGameData();
    this.setupGlobalEventListeners();
  },
  
  async loadGameData() {
    // Load base data
    const baseData = await Promise.all([
      fetch('/data/shared/pokemon-base.json').then(r => r.json()),
      fetch('/data/shared/items-base.json').then(r => r.json())
    ]);
    
    this.baseData = {
      pokemon: baseData[0],
      items: baseData[1]
    };
    
    // Emit data loaded event
    this.eventBus.emit('data:loaded', this.baseData);
  }
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  PokemonWalkthrough.init();
});
```

## Event System

### EventEmitter Implementation

```javascript
// Custom event system for module communication
class EventEmitter {
  constructor() {
    this.events = {};
    this.maxListeners = 10;
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    if (this.events[event].length >= this.maxListeners) {
      console.warn(`Maximum listeners (${this.maxListeners}) exceeded for event: ${event}`);
    }
    
    this.events[event].push(callback);
    return this; // Enable chaining
  }
  
  once(event, callback) {
    const onceWrapper = (...args) => {
      callback(...args);
      this.off(event, onceWrapper);
    };
    
    this.on(event, onceWrapper);
    return this;
  }
  
  off(event, callback) {
    if (!this.events[event]) return this;
    
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    
    if (this.events[event].length === 0) {
      delete this.events[event];
    }
    
    return this;
  }
  
  emit(event, data) {
    if (!this.events[event]) return false;
    
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
    
    return true;
  }
  
  listenerCount(event) {
    return this.events[event] ? this.events[event].length : 0;
  }
  
  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }
}
```

### Event Naming Conventions

```javascript
// Event naming pattern: module:action
const EVENT_NAMES = {
  // Progress events
  STEP_COMPLETED: 'progress:step-completed',
  STEP_UNCHECKED: 'progress:step-unchecked',
  PROGRESS_LOADED: 'progress:loaded',
  PROGRESS_SAVED: 'progress:saved',
  
  // Filter events
  FILTER_APPLIED: 'filter:applied',
  PRESET_CHANGED: 'filter:preset-changed',
  DISPLAY_MODE_CHANGED: 'filter:display-mode-changed',
  
  // Pokemon events
  POKEMON_CAUGHT: 'pokemon:caught',
  POKEMON_ENCOUNTERED: 'pokemon:encountered',
  POKEDEX_UPDATED: 'pokemon:pokedex-updated',
  
  // UI events
  SETTINGS_OPENED: 'ui:settings-opened',
  SETTINGS_CLOSED: 'ui:settings-closed',
  THEME_CHANGED: 'ui:theme-changed',
  
  // Data events
  DATA_LOADED: 'data:loaded',
  GAME_CHANGED: 'data:game-changed'
};

// Usage example:
eventBus.emit(EVENT_NAMES.STEP_COMPLETED, {
  stepId: 'catch-pidgey',
  pokemon: 'pidgey',
  level: 3,
  location: 'route-01'
});
```

## Core Modules

### ProgressManager Module

```javascript
class ProgressManager extends EventEmitter {
  constructor(eventBus) {
    super();
    this.eventBus = eventBus;
    this.currentGame = null;
    this.gameProgress = {};
    this.globalProgress = {};
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.eventBus.on(EVENT_NAMES.DATA_LOADED, (data) => {
      this.initializeProgress();
    });
    
    this.eventBus.on(EVENT_NAMES.GAME_CHANGED, (gameId) => {
      this.loadGame(gameId);
    });
  }
  
  async loadGame(gameId) {
    this.currentGame = gameId;
    this.gameProgress = this.loadFromStorage(`game_${gameId}`) || this.getDefaultGameProgress(gameId);
    
    // Update UI with loaded progress
    this.applyProgressToDOM();
    
    this.eventBus.emit(EVENT_NAMES.PROGRESS_LOADED, {
      gameId,
      progress: this.gameProgress
    });
  }
  
  completeStep(stepId, stepData = {}) {
    const timestamp = new Date().toISOString();
    
    this.gameProgress.steps[stepId] = {
      completed: true,
      timestamp,
      ...stepData
    };
    
    // Handle special step types
    if (stepData.pokemon) {
      this.handlePokemonCaught(stepData.pokemon, stepData);
    }
    
    if (stepData.choice) {
      this.gameProgress.choices[stepData.choice] = stepData.value;
    }
    
    this.saveProgress();
    this.updateProgressIndicators();
    
    this.eventBus.emit(EVENT_NAMES.STEP_COMPLETED, {
      stepId,
      stepData,
      timestamp
    });
  }
  
  uncheckStep(stepId) {
    if (this.gameProgress.steps[stepId]) {
      this.gameProgress.steps[stepId].completed = false;
      this.gameProgress.steps[stepId].timestamp = new Date().toISOString();
      
      this.saveProgress();
      this.updateProgressIndicators();
      
      this.eventBus.emit(EVENT_NAMES.STEP_UNCHECKED, { stepId });
    }
  }
  
  handlePokemonCaught(pokemonName, stepData) {
    if (!this.gameProgress.pokemon[pokemonName]) {
      this.gameProgress.pokemon[pokemonName] = {
        totalEncounters: 0,
        encounters: [],
        catches: []
      };
    }
    
    const catchData = {
      location: stepData.location,
      level: stepData.level,
      timestamp: new Date().toISOString(),
      encountersBeforeCatch: stepData.encountersBeforeCatch || 1
    };
    
    this.gameProgress.pokemon[pokemonName].catches.push(catchData);
    
    // Set first caught location if this is the first catch
    if (!this.gameProgress.pokemon[pokemonName].firstCaught) {
      this.gameProgress.pokemon[pokemonName].firstCaught = stepData.location;
    }
    
    this.eventBus.emit(EVENT_NAMES.POKEMON_CAUGHT, {
      pokemon: pokemonName,
      catchData,
      totalCatches: this.gameProgress.pokemon[pokemonName].catches.length
    });
  }
  
  getCompletionPercentage() {
    const allSteps = document.querySelectorAll('.step[data-step-id]');
    const completedSteps = Object.values(this.gameProgress.steps || {})
      .filter(step => step.completed);
    
    return allSteps.length > 0 ? (completedSteps.length / allSteps.length) * 100 : 0;
  }
  
  updateProgressIndicators() {
    const percentage = this.getCompletionPercentage();
    
    // Update progress bar
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.setAttribute('aria-valuenow', Math.round(percentage));
      
      const progressFill = progressBar.querySelector('.progress-fill');
      const progressText = progressBar.querySelector('.progress-text');
      
      if (progressFill) {
        progressFill.style.width = `${percentage}%`;
      }
      
      if (progressText) {
        const completed = Object.values(this.gameProgress.steps || {}).filter(s => s.completed).length;
        const total = document.querySelectorAll('.step[data-step-id]').length;
        progressText.textContent = `${Math.round(percentage)}% Complete (${completed} of ${total} steps)`;
      }
    }
    
    // Update location counters
    this.updateLocationCounters();
  }
  
  updateLocationCounters() {
    const locations = document.querySelectorAll('.location-section');
    
    locations.forEach(location => {
      const locationId = location.dataset.locationId;
      const steps = location.querySelectorAll('.step[data-step-id]');
      const completedSteps = Array.from(steps).filter(step => {
        const stepId = step.dataset.stepId;
        return this.gameProgress.steps[stepId]?.completed;
      });
      
      const counter = location.querySelector('.step-counter .counter-number');
      const counterText = location.querySelector('.step-counter .counter-text');
      
      if (counter && counterText) {
        const remaining = steps.length - completedSteps.length;
        counter.textContent = remaining;
        
        if (remaining === 0) {
          counterText.textContent = 'steps - Complete!';
          location.setAttribute('data-completed', 'true');
        } else {
          counterText.textContent = remaining === 1 ? 'step remaining' : 'steps remaining';
          location.setAttribute('data-completed', 'false');
        }
      }
    });
  }
  
  applyProgressToDOM() {
    // Apply saved progress to checkboxes
    Object.entries(this.gameProgress.steps || {}).forEach(([stepId, stepData]) => {
      const checkbox = document.getElementById(stepId);
      if (checkbox) {
        checkbox.checked = stepData.completed;
        
        // Apply completion styling
        const stepElement = checkbox.closest('.step');
        if (stepElement) {
          stepElement.classList.toggle('completed', stepData.completed);
        }
      }
    });
    
    // Apply saved choices
    Object.entries(this.gameProgress.choices || {}).forEach(([choiceType, value]) => {
      const input = document.querySelector(`input[data-choice="${choiceType}"][value="${value}"]`);
      if (input) {
        input.checked = true;
      }
    });
    
    this.updateProgressIndicators();
  }
  
  saveProgress() {
    const key = `pokemon_walkthrough_game_${this.currentGame}`;
    const data = {
      ...this.gameProgress,
      version: '1.0',
      lastUpdated: new Date().toISOString()
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
      this.eventBus.emit(EVENT_NAMES.PROGRESS_SAVED, { gameId: this.currentGame });
    } catch (error) {
      console.error('Failed to save progress:', error);
      this.handleStorageError(error);
    }
  }
  
  loadFromStorage(key) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load progress:', error);
      return null;
    }
  }
  
  getDefaultGameProgress(gameId) {
    return {
      gameId,
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      steps: {},
      choices: {},
      pokemon: {},
      items: {},
      battles: {}
    };
  }
}
```

### FilterManager Module

```javascript
class FilterManager extends EventEmitter {
  constructor(eventBus) {
    super();
    this.eventBus = eventBus;
    this.activeFilters = new Set();
    this.hiddenTags = new Set();
    this.displayMode = 'rich';
    this.presets = {
      all: { include: [], exclude: [] },
      story: { include: ['story', 'required'], exclude: ['optional'] },
      completionist: { include: [], exclude: [] },
      pokemon: { include: ['pokemon'], exclude: [] },
      battles: { include: ['trainer-battle', 'gym-battle'], exclude: [] },
      spoiler_free: { include: [], exclude: ['spoiler'] }
    };
    
    this.setupEventListeners();
    this.initializeUI();
  }
  
  setupEventListeners() {
    // Listen for settings panel interactions
    document.addEventListener('change', (event) => {
      if (event.target.matches('.preset-btn')) {
        this.applyPreset(event.target.dataset.preset);
      }
      
      if (event.target.matches('input[name="display-mode"]')) {
        this.setDisplayMode(event.target.value);
      }
      
      if (event.target.matches('.filter-group input[type="checkbox"]')) {
        this.toggleFilter(event.target);
      }
    });
  }
  
  initializeUI() {
    // Set up preset buttons
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.applyPreset(button.dataset.preset);
      });
    });
    
    // Set up display mode toggle
    const displayModeInputs = document.querySelectorAll('input[name="display-mode"]');
    displayModeInputs.forEach(input => {
      input.addEventListener('change', () => {
        if (input.checked) {
          this.setDisplayMode(input.value);
        }
      });
    });
  }
  
  applyPreset(presetName) {
    const preset = this.presets[presetName];
    if (!preset) {
      console.warn(`Unknown preset: ${presetName}`);
      return;
    }
    
    // Clear current filters
    this.activeFilters.clear();
    this.hiddenTags.clear();
    
    // Apply preset filters
    preset.include.forEach(tag => this.activeFilters.add(tag));
    preset.exclude.forEach(tag => this.hiddenTags.add(tag));
    
    this.applyFilters();
    this.updatePresetUI(presetName);
    
    this.eventBus.emit(EVENT_NAMES.PRESET_CHANGED, {
      preset: presetName,
      includeTags: Array.from(this.activeFilters),
      excludeTags: Array.from(this.hiddenTags)
    });
  }
  
  toggleFilter(filterCheckbox) {
    const filterId = filterCheckbox.id;
    const isChecked = filterCheckbox.checked;
    
    // Map checkbox IDs to filter logic
    const filterMappings = {
      'show-optional': { tag: 'optional', type: 'show' },
      'show-completed': { tag: 'completed', type: 'show' },
      'show-pokemon': { tag: 'pokemon', type: 'show' },
      'show-battles': { tag: 'battle', type: 'show' },
      'hide-spoilers': { tag: 'spoiler', type: 'hide' }
    };
    
    const mapping = filterMappings[filterId];
    if (!mapping) return;
    
    if (mapping.type === 'show') {
      if (isChecked) {
        this.activeFilters.add(mapping.tag);
      } else {
        this.activeFilters.delete(mapping.tag);
      }
    } else if (mapping.type === 'hide') {
      if (isChecked) {
        this.hiddenTags.add(mapping.tag);
      } else {
        this.hiddenTags.delete(mapping.tag);
      }
    }
    
    this.applyFilters();
  }
  
  applyFilters() {
    const steps = document.querySelectorAll('.step[data-tags]');
    let visibleCount = 0;
    
    steps.forEach(step => {
      const stepTags = step.dataset.tags.split(',').map(tag => tag.trim());
      const isCompleted = step.classList.contains('completed');
      
      let shouldShow = true;
      
      // Check include filters (if any are active, step must have at least one)
      if (this.activeFilters.size > 0) {
        shouldShow = stepTags.some(tag => this.activeFilters.has(tag));
      }
      
      // Check exclude filters (if step has any excluded tag, hide it)
      if (shouldShow && this.hiddenTags.size > 0) {
        shouldShow = !stepTags.some(tag => this.hiddenTags.has(tag));
      }
      
      // Handle completed step visibility
      const showCompletedCheckbox = document.getElementById('show-completed');
      if (showCompletedCheckbox && !showCompletedCheckbox.checked && isCompleted) {
        shouldShow = false;
      }
      
      // Apply visibility
      step.style.display = shouldShow ? '' : 'none';
      
      if (shouldShow) {
        visibleCount++;
      }
    });
    
    // Update location counters after filtering
    this.updateLocationVisibility();
    
    this.eventBus.emit(EVENT_NAMES.FILTER_APPLIED, {
      visibleSteps: visibleCount,
      totalSteps: steps.length,
      activeFilters: Array.from(this.activeFilters),
      hiddenTags: Array.from(this.hiddenTags)
    });
  }
  
  updateLocationVisibility() {
    const locations = document.querySelectorAll('.location-section');
    
    locations.forEach(location => {
      const visibleSteps = location.querySelectorAll('.step:not([style*="display: none"])');
      
      // Hide location if no steps are visible
      if (visibleSteps.length === 0) {
        location.style.display = 'none';
      } else {
        location.style.display = '';
        
        // Update counter to reflect visible steps
        const counter = location.querySelector('.step-counter .counter-number');
        if (counter) {
          const completedVisible = Array.from(visibleSteps).filter(step => 
            step.classList.contains('completed')
          ).length;
          counter.textContent = visibleSteps.length - completedVisible;
        }
      }
    });
  }
  
  setDisplayMode(mode) {
    if (mode === this.displayMode) return;
    
    this.displayMode = mode;
    
    // Update body class
    document.body.classList.remove('simple-mode', 'rich-mode');
    document.body.classList.add(`${mode}-mode`);
    
    // Update UI state
    const modeInput = document.getElementById(`${mode}-mode`);
    if (modeInput) {
      modeInput.checked = true;
    }
    
    this.eventBus.emit(EVENT_NAMES.DISPLAY_MODE_CHANGED, { mode });
  }
  
  updatePresetUI(activePreset) {
    // Update preset button states
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.preset === activePreset);
    });
  }
  
  getFilterState() {
    return {
      displayMode: this.displayMode,
      activeFilters: Array.from(this.activeFilters),
      hiddenTags: Array.from(this.hiddenTags)
    };
  }
  
  restoreFilterState(state) {
    this.displayMode = state.displayMode || 'rich';
    this.activeFilters = new Set(state.activeFilters || []);
    this.hiddenTags = new Set(state.hiddenTags || []);
    
    this.setDisplayMode(this.displayMode);
    this.applyFilters();
  }
}
```

### UIManager Module

```javascript
class UIManager extends EventEmitter {
  constructor(eventBus) {
    super();
    this.eventBus = eventBus;
    this.settingsPanelOpen = false;
    this.currentTheme = 'gen1';
    
    this.setupEventListeners();
    this.initializeUI();
  }
  
  setupEventListeners() {
    // Settings panel toggle
    document.addEventListener('click', (event) => {
      if (event.target.matches('#settings-toggle')) {
        this.toggleSettingsPanel();
      }
      
      if (event.target.matches('.settings-close')) {
        this.closeSettingsPanel();
      }
      
      if (event.target.matches('#export-progress')) {
        this.handleExportProgress();
      }
      
      if (event.target.matches('#import-progress')) {
        this.handleImportProgress();
      }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (event) => {
      this.handleKeyboardNavigation(event);
    });
    
    // Theme changes
    this.eventBus.on(EVENT_NAMES.GAME_CHANGED, (gameId) => {
      this.updateTheme(this.getThemeForGame(gameId));
    });
  }
  
  initializeUI() {
    // Initialize settings panel
    this.setupSettingsPanel();
    
    // Initialize step interactions
    this.setupStepInteractions();
    
    // Initialize progress indicators
    this.setupProgressIndicators();
  }
  
  setupStepInteractions() {
    document.addEventListener('change', (event) => {
      if (event.target.matches('.step-checkbox')) {
        this.handleStepToggle(event.target);
      }
      
      if (event.target.matches('input[data-field]')) {
        this.handleFieldInput(event.target);
      }
    });
    
    // Encounter tracking buttons
    document.addEventListener('click', (event) => {
      if (event.target.matches('.encounter-tracker')) {
        this.handleEncounterTracking(event.target);
      }
    });
  }
  
  handleStepToggle(checkbox) {
    const stepElement = checkbox.closest('.step');
    const stepId = checkbox.id;
    const isCompleted = checkbox.checked;
    
    // Gather step data
    const stepData = {
      stepId,
      completed: isCompleted,
      category: stepElement.dataset.category,
      tags: stepElement.dataset.tags?.split(',') || [],
      location: stepElement.dataset.location
    };
    
    // Gather additional data based on step type
    if (stepElement.dataset.pokemon) {
      const levelInput = stepElement.querySelector('[data-field="level"]');
      const encountersInput = stepElement.querySelector('[data-field="encountersBeforeCatch"]');
      
      stepData.pokemon = {
        name: stepElement.dataset.pokemon,
        level: levelInput?.value ? parseInt(levelInput.value) : null,
        location: stepElement.dataset.location,
        encountersBeforeCatch: encountersInput?.value ? parseInt(encountersInput.value) : 1
      };
    }
    
    if (stepElement.dataset.choice) {
      stepData.choice = {
        type: stepElement.dataset.choice,
        value: checkbox.value
      };
    }
    
    // Update visual state
    stepElement.classList.toggle('completed', isCompleted);
    
    // Emit event for progress manager
    if (isCompleted) {
      this.eventBus.emit(EVENT_NAMES.STEP_COMPLETED, stepData);
    } else {
      this.eventBus.emit(EVENT_NAMES.STEP_UNCHECKED, stepData);
    }
    
    // Show completion animation
    this.showStepCompletionFeedback(stepElement, isCompleted);
  }
  
  showStepCompletionFeedback(stepElement, completed) {
    // Simple visual feedback
    stepElement.style.transform = 'scale(1.02)';
    stepElement.style.transition = 'transform 0.2s ease';
    
    setTimeout(() => {
      stepElement.style.transform = '';
    }, 200);
    
    // Announce to screen readers
    const stepText = stepElement.querySelector('.step-text')?.textContent || 'Step';
    const status = completed ? 'completed' : 'unchecked';
    this.announceToScreenReader(`${stepText} ${status}`);
  }
  
  toggleSettingsPanel() {
    this.settingsPanelOpen = !this.settingsPanelOpen;
    
    const panel = document.getElementById('settings-panel');
    const toggle = document.getElementById('settings-toggle');
    
    if (panel && toggle) {
      panel.setAttribute('aria-hidden', !this.settingsPanelOpen);
      toggle.setAttribute('aria-expanded', this.settingsPanelOpen);
      
      if (this.settingsPanelOpen) {
        this.openSettingsPanel();
      } else {
        this.closeSettingsPanel();
      }
    }
  }
  
  openSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    panel.style.display = 'block';
    
    // Focus first focusable element
    const firstFocusable = panel.querySelector('input, button, select');
    if (firstFocusable) {
      firstFocusable.focus();
    }
    
    this.eventBus.emit(EVENT_NAMES.SETTINGS_OPENED);
  }
  
  closeSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    const toggle = document.getElementById('settings-toggle');
    
    panel.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    this.settingsPanelOpen = false;
    
    // Return focus to settings toggle
    toggle.focus();
    
    this.eventBus.emit(EVENT_NAMES.SETTINGS_CLOSED);
  }
  
  handleKeyboardNavigation(event) {
    switch(event.key) {
      case 'Escape':
        if (this.settingsPanelOpen) {
          this.closeSettingsPanel();
        }
        break;
      
      case 'Enter':
      case ' ':
        if (event.target.matches('summary')) {
          // Let default behavior handle details/summary
          this.announceRegionToggle(event.target);
        }
        break;
    }
  }
  
  announceRegionToggle(summary) {
    const details = summary.parentElement;
    const locationName = summary.querySelector('.location-name')?.textContent || 'Section';
    const willExpand = !details.hasAttribute('open');
    const action = willExpand ? 'expanded' : 'collapsed';
    
    setTimeout(() => {
      this.announceToScreenReader(`${locationName} ${action}`);
    }, 100);
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
  
  updateTheme(themeName) {
    if (themeName === this.currentTheme) return;
    
    // Remove old theme
    document.body.classList.remove(`${this.currentTheme}-theme`);
    
    // Add new theme
    this.currentTheme = themeName;
    document.body.classList.add(`${themeName}-theme`);
    
    // Update theme selector
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.value = themeName;
    }
    
    this.eventBus.emit(EVENT_NAMES.THEME_CHANGED, { theme: themeName });
  }
  
  getThemeForGame(gameId) {
    const gameThemes = {
      'red': 'gen1',
      'blue': 'gen1',
      'yellow': 'gen1',
      'gold': 'gen2',
      'silver': 'gen2',
      'crystal': 'gen2'
    };
    
    return gameThemes[gameId] || 'gen1';
  }
}
```

## Data Structures

### Progress Data Structure

```javascript
// Individual game progress
const gameProgressStructure = {
  gameId: "red",
  version: "1.0",
  lastUpdated: "2025-08-01T12:00:00Z",
  
  // Step completion tracking
  steps: {
    "step-001": {
      completed: true,
      timestamp: "2025-08-01T10:00:00Z",
      tags: ["story", "required"],
      category: "progression"
    },
    "catch-pidgey": {
      completed: true,
      timestamp: "2025-08-01T11:00:00Z",
      pokemon: {
        name: "pidgey",
        level: 3,
        location: "route-01",
        encountersBeforeCatch: 2
      },
      tags: ["pokemon", "optional"],
      category: "pokemon"
    }
  },
  
  // User choices tracking
  choices: {
    starter: "charmander",
    playerName: "ASH",
    rivalName: "BLUE"
  },
  
  // Pokemon tracking
  pokemon: {
    "pidgey": {
      firstCaught: "route-01",
      totalEncounters: 8,
      catches: [
        {
          location: "route-01",
          level: 3,
          timestamp: "2025-08-01T11:00:00Z",
          encountersBeforeCatch: 2
        }
      ],
      encounters: [
        {
          location: "route-01",
          type: "wild",
          timestamp: "2025-08-01T10:30:00Z"
        }
      ]
    }
  },
  
  // Item tracking
  items: {
    "potion": {
      collected: ["pallet-town", "route-01"],
      count: 2
    }
  },
  
  // Battle tracking
  battles: {
    "rival-1": {
      completed: true,
      location: "oak-lab",
      playerTeam: ["charmander"],
      result: "victory",
      timestamp: "2025-08-01T12:00:00Z"
    }
  }
};
```

## Module Communication Examples

```javascript
// Example: Step completion flow
document.getElementById('catch-pidgey').addEventListener('change', (event) => {
  if (event.target.checked) {
    // UI Manager handles the interaction
    uiManager.handleStepToggle(event.target);
    
    // This triggers events that other modules listen for:
    // 1. ProgressManager saves the step completion
    // 2. FilterManager may need to update visibility
    // 3. PokedexManager updates Pokemon data
  }
});

// Example: Cross-module communication
eventBus.on(EVENT_NAMES.POKEMON_CAUGHT, (data) => {
  // Multiple modules can respond to this event
  console.log(`Pokemon caught: ${data.pokemon}`);
  
  // ProgressManager might auto-complete related steps
  // PokedexManager updates the living Pokedex
  // UIManager shows completion animation
});
```

This modular architecture ensures loose coupling between components while maintaining clear communication channels, supporting both current vanilla JavaScript needs and future framework migration.

## Module Testing Patterns

### Unit Testing Structure

```javascript
// test/modules/progress.test.js
import { ProgressManager } from '../../js/modules/progress.js';
import { EventEmitter } from '../../js/utils/EventEmitter.js';

describe('ProgressManager', () => {
  let progressManager;
  let mockEventBus;
  
  beforeEach(() => {
    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    
    // Create mock event bus
    mockEventBus = new EventEmitter();
    progressManager = new ProgressManager(mockEventBus);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Step Management', () => {
    test('should complete step and emit event', () => {
      const stepId = 'test-step';
      const stepData = { category: 'story', location: 'pallet-town' };
      const eventSpy = jest.fn();
      
      mockEventBus.on('progress:step-completed', eventSpy);
      
      progressManager.completeStep(stepId, stepData);
      
      expect(progressManager.getStepProgress(stepId)).toBe(true);
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        stepId,
        stepData
      }));
    });
    
    test('should handle invalid step data gracefully', () => {
      expect(() => {
        progressManager.completeStep(null);
      }).not.toThrow();
      
      expect(() => {
        progressManager.completeStep('');
      }).not.toThrow();
    });
  });
  
  describe('Cross-Game Integration', () => {
    test('should aggregate Pokemon data across games', () => {
      const pokemonData = {
        name: 'pikachu',
        level: 5,
        location: 'viridian-forest'
      };
      
      progressManager.handlePokemonCaught('pikachu', pokemonData);
      
      const globalProgress = progressManager.getGlobalProgress();
      expect(globalProgress.pokemon.pikachu).toBeDefined();
      expect(globalProgress.pokemon.pikachu.catches).toHaveLength(1);
    });
  });
  
  describe('Data Persistence', () => {
    test('should save progress to localStorage', () => {
      const stepId = 'test-step';
      
      progressManager.completeStep(stepId);
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('pokemon_walkthrough'),
        expect.any(String)
      );
    });
    
    test('should handle localStorage errors gracefully', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        progressManager.completeStep('test-step');
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
```

### Integration Testing

```javascript
// test/integration/progress-ui.test.js
import { ProgressManager } from '../../js/modules/progress.js';
import { UIManager } from '../../js/modules/ui.js';
import { EventEmitter } from '../../js/utils/EventEmitter.js';

describe('Progress and UI Integration', () => {
  let progressManager;
  let uiManager;
  let eventBus;
  let container;
  
  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    container.innerHTML = `
      <div class="step" data-step-id="test-step">
        <input type="checkbox" id="test-step" class="step-checkbox">
        <label for="test-step">Test Step</label>
      </div>
      <div aria-live="polite" id="progress-announcements"></div>
    `;
    document.body.appendChild(container);
    
    // Setup modules
    eventBus = new EventEmitter();
    progressManager = new ProgressManager(eventBus);
    uiManager = new UIManager(eventBus);
  });
  
  afterEach(() => {
    document.body.removeChild(container);
  });
  
  test('should update UI when step is completed', () => {
    const checkbox = container.querySelector('#test-step');
    const stepElement = container.querySelector('.step');
    
    // Simulate user clicking checkbox
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Check that step is marked as completed
    expect(stepElement.classList.contains('completed')).toBe(true);
    
    // Check that progress was saved
    expect(progressManager.getStepProgress('test-step')).toBe(true);
  });
  
  test('should announce step completion to screen readers', (done) => {
    const liveRegion = container.querySelector('#progress-announcements');
    const checkbox = container.querySelector('#test-step');
    
    // Listen for aria-live region updates
    const observer = new MutationObserver((mutations) => {
      const textContent = mutations[0].target.textContent;
      if (textContent.includes('Test Step completed')) {
        observer.disconnect();
        done();
      }
    });
    
    observer.observe(liveRegion, { childList: true, characterData: true });
    
    // Trigger step completion
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  });
});
```

### Testing Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/js/$1'
  },
  collectCoverageFrom: [
    'js/modules/**/*.js',
    'js/utils/**/*.js',
    '!js/modules/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};

// test/setup.js
import { createLocalStorageMock } from './mocks/localStorage.js';

// Setup global mocks
global.localStorage = createLocalStorageMock();

// Mock IntersectionObserver for lazy loading tests
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```
