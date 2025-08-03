/* Internationalization (i18n) System for Pokemon Walkthrough Project
   This file contains the i18n implementation referenced in Content-Guidelines.md */

// I18n utility structure for future implementation
class I18nManager {
  constructor(locale = 'en') {
    this.locale = locale;
    this.translations = {};
    this.fallbackLocale = 'en';
    this.translationsLoaded = false;
  }
  
  async loadTranslations() {
    try {
      const response = await fetch(`/locales/${this.locale}.json`);
      this.translations = await response.json();
      this.translationsLoaded = true;
    } catch (loadError) {
      console.warn(`Failed to load translations for ${this.locale}: ${loadError.message}, falling back to English`);
      try {
        const fallbackResponse = await fetch(`/locales/${this.fallbackLocale}.json`);
        this.translations = await fallbackResponse.json();
        this.translationsLoaded = true;
      } catch (fallbackError) {
        console.error('Failed to load fallback translations:', fallbackError);
        this.translations = {};
        this.translationsLoaded = false;
        // Use sample translations as last resort
        this.translations = sampleTranslations[this.locale] || sampleTranslations['en'] || {};
      }
    }
  }
  
  // Translate a key with optional variable substitution
  t(key, variables = {}) {
    const translation = this.getNestedValue(this.translations, key);
    
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key; // Return key as fallback
    }
    
    // Simple variable substitution using {{variable}} syntax
    return translation.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return variables[variable] || match;
    });
  }
  
  // Get nested value from translations object
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  // Set locale and reload translations
  async setLocale(locale) {
    if (this.locale !== locale) {
      this.locale = locale;
      await this.loadTranslations();
      this.updatePageContent();
    }
  }
  
  // Update all i18n elements on the page
  updatePageContent() {
    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const variables = this.extractVariables(element);
      element.textContent = this.t(key, variables);
    });
    
    // Update document language
    document.documentElement.lang = this.locale;
    
    // Dispatch event for other components to react to language change
    document.dispatchEvent(new CustomEvent('localeChanged', {
      detail: { locale: this.locale }
    }));
  }
  
  // Extract variables from data attributes
  extractVariables(element) {
    const variables = {};
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-i18n-')) {
        const variableName = attr.name.replace('data-i18n-', '');
        variables[variableName] = attr.value;
      }
    });
    return variables;
  }
  
  // Get current locale
  getCurrentLocale() {
    return this.locale;
  }
  
  // Get available locales (would be populated from server/config)
  getAvailableLocales() {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'ja', name: '日本語', flag: '🇯🇵' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'pt', name: 'Português', flag: '🇵🇹' }
    ];
  }
}

// Sample translation data structure
const sampleTranslations = {
  "en": {
    "pallet": {
      "oak-lab": {
        "starter-choice": "Choose your starter Pokemon from Professor Oak",
        "starter-bulbasaur": "Bulbasaur (Grass/Poison) - Good against first two gyms",
        "starter-charmander": "Charmander (Fire) - Challenging early game",
        "starter-squirtle": "Squirtle (Water) - Balanced throughout"
      }
    },
    "ui": {
      "progress": "{{completed}} of {{total}} steps completed",
      "location": {
        "enter": "Enter {{location}}",
        "steps-remaining": "{{count}} steps remaining"
      }
    },
    "pokemon": {
      "names": {
        "pikachu": "Pikachu",
        "bulbasaur": "Bulbasaur",
        "charmander": "Charmander",
        "squirtle": "Squirtle"
      },
      "types": {
        "fire": "Fire",
        "water": "Water",
        "grass": "Grass",
        "electric": "Electric"
      }
    }
  },
  "es": {
    "pallet": {
      "oak-lab": {
        "starter-choice": "Elige tu Pokémon inicial del Profesor Oak",
        "starter-bulbasaur": "Bulbasaur (Planta/Veneno) - Bueno contra los primeros dos gimnasios",
        "starter-charmander": "Charmander (Fuego) - Juego temprano desafiante", 
        "starter-squirtle": "Squirtle (Agua) - Equilibrado en todo momento"
      }
    },
    "ui": {
      "progress": "{{completed}} de {{total}} pasos completados",
      "location": {
        "enter": "Entrar a {{location}}",
        "steps-remaining": "{{count}} pasos restantes"
      }
    },
    "pokemon": {
      "names": {
        "pikachu": "Pikachu",
        "bulbasaur": "Bulbasaur",
        "charmander": "Charmander",
        "squirtle": "Squirtle"
      },
      "types": {
        "fire": "Fuego",
        "water": "Agua",
        "grass": "Planta",
        "electric": "Eléctrico"
      }
    }
  },
  "fr": {
    "pallet": {
      "oak-lab": {
        "starter-choice": "Choisissez votre Pokémon de départ du Professeur Oak",
        "starter-bulbasaur": "Bulbizarre (Plante/Poison) - Bon contre les deux premiers arènes",
        "starter-charmander": "Salamèche (Feu) - Début de jeu difficile",
        "starter-squirtle": "Carapuce (Eau) - Équilibré tout au long"
      }
    },
    "ui": {
      "progress": "{{completed}} sur {{total}} étapes terminées",
      "location": {
        "enter": "Entrer dans {{location}}",
        "steps-remaining": "{{count}} étapes restantes"
      }
    },
    "pokemon": {
      "names": {
        "pikachu": "Pikachu",
        "bulbasaur": "Bulbizarre",
        "charmander": "Salamèche",
        "squirtle": "Carapuce"
      },
      "types": {
        "fire": "Feu",
        "water": "Eau",
        "grass": "Plante",
        "electric": "Électrik"
      }
    }
  }
};

// Locale detection utility
class LocaleDetector {
  static detectUserLocale() {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const urlLocale = urlParams.get('lang');
    if (urlLocale) {
      return urlLocale;
    }
    
    // Check localStorage
    const savedLocale = localStorage.getItem('pokemon-walkthrough-locale');
    if (savedLocale) {
      return savedLocale;
    }
    
    // Check browser language
    const browserLocale = navigator.language || navigator.userLanguage;
    const shortLocale = browserLocale.split('-')[0]; // 'en-US' -> 'en'
    
    // Check if we support this locale
    const supportedLocales = ['en', 'es', 'fr', 'de', 'ja', 'it', 'pt'];
    if (supportedLocales.includes(shortLocale)) {
      return shortLocale;
    }
    
    // Default to English
    return 'en';
  }
  
  static saveLocalePreference(locale) {
    localStorage.setItem('pokemon-walkthrough-locale', locale);
  }
}

// Content Translation Priorities Manager
class TranslationPriorityManager {
  constructor() {
    this.priorities = {
      phase1: [
        'ui.progress',
        'ui.location',
        'ui.settings',
        'ui.navigation'
      ],
      phase2: [
        'pokemon.names',
        'pokemon.types',
        'items.names',
        'moves.names'
      ],
      phase3: [
        'locations',
        'trainers',
        'descriptions'
      ],
      phase4: [
        'advanced-features',
        'optional-content',
        'flavor-text'
      ]
    };
  }
  
  getTranslationPhase(key) {
    for (const [phase, keys] of Object.entries(this.priorities)) {
      if (keys.some(priorityKey => key.startsWith(priorityKey))) {
        return phase;
      }
    }
    return 'phase4'; // Default to lowest priority
  }
  
  getMissingTranslations(locale, referenceLocale = 'en') {
    const missing = {};
    const reference = sampleTranslations[referenceLocale] || {};
    const target = sampleTranslations[locale] || {};
    
    this.findMissingKeys(reference, target, '', missing);
    
    return missing;
  }
  
  findMissingKeys(reference, target, prefix, missing) {
    for (const [key, value] of Object.entries(reference)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        if (!target[key] || typeof target[key] !== 'object') {
          missing[fullKey] = value;
        } else {
          this.findMissingKeys(value, target[key], fullKey, missing);
        }
      } else if (!target.hasOwnProperty(key)) {
        missing[fullKey] = value;
      }
    }
  }
}

// Pluralization utility
class PluralizationManager {
  constructor(locale) {
    this.locale = locale;
    this.rules = this.getPluralRules(locale);
  }
  
  getPluralRules(locale) {
    // Simplified pluralization rules
    const rules = {
      'en': (n) => n === 1 ? 'one' : 'other',
      'es': (n) => n === 1 ? 'one' : 'other',
      'fr': (n) => n <= 1 ? 'one' : 'other',
      'de': (n) => n === 1 ? 'one' : 'other',
      'ja': () => 'other', // Japanese doesn't have plural forms
      'it': (n) => n === 1 ? 'one' : 'other',
      'pt': (n) => n === 1 ? 'one' : 'other'
    };
    
    return rules[locale] || rules['en'];
  }
  
  pluralize(key, count, translations) {
    const pluralForm = this.rules(count);
    const pluralKey = `${key}.${pluralForm}`;
    
    if (translations[pluralKey]) {
      return translations[pluralKey].replace('{{count}}', count);
    }
    
    // Fallback to the base key
    return translations[key]?.replace('{{count}}', count) || key;
  }
}

// Usage examples and initialization
async function initializeI18n() {
  // Detect user's preferred locale
  const userLocale = LocaleDetector.detectUserLocale();
  
  // Initialize i18n manager
  const i18n = new I18nManager(userLocale);
  
  // Load translations before using
  await i18n.loadTranslations();
  
  // Usage in step content
  const stepText = i18n.t('pallet.oak-lab.starter-choice');
  const pokemonName = i18n.t('pokemon.names.pikachu');
  const progressText = i18n.t('ui.progress', { completed: 25, total: 100 });
  
  console.log('Initialized i18n with locale:', userLocale);
  console.log('Sample translations:', { stepText, pokemonName, progressText });
  
  return i18n;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    I18nManager,
    LocaleDetector,
    TranslationPriorityManager,
    PluralizationManager,
    sampleTranslations,
    initializeI18n
  };
}

// Global access for browser usage
if (typeof window !== 'undefined') {
  window.PokemonWalkthrough = window.PokemonWalkthrough || {};
  window.PokemonWalkthrough.I18n = {
    I18nManager,
    LocaleDetector,
    TranslationPriorityManager,
    PluralizationManager,
    sampleTranslations,
    initializeI18n
  };
}
