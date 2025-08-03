// Form Accessibility Implementation for Pokemon Walkthrough Project
// This file contains comprehensive form accessibility referenced in Accessibility-Standards.md

class FormAccessibilityManager {
  constructor() {
    this.errorMessages = new Map();
    this.validationRules = new Map();
    this.setupFormHandlers();
    this.setupValidationRules();
  }

  setupFormHandlers() {
    // Handle all form inputs in the application
    document.addEventListener('blur', (event) => {
      if (event.target.matches('input, select, textarea')) {
        this.validateField(event.target);
      }
    }, true);

    document.addEventListener('input', (event) => {
      if (event.target.matches('input, select, textarea')) {
        // Clear errors on input to provide immediate feedback
        if (event.target.getAttribute('aria-invalid') === 'true') {
          this.clearFieldError(event.target);
        }
      }
    });

    document.addEventListener('submit', (event) => {
      if (event.target.matches('form')) {
        this.handleFormSubmission(event);
      }
    });
  }

  setupValidationRules() {
    // Common validation rules
    this.validationRules.set('required', {
      validate: (value) => value && value.trim().length > 0,
      message: 'This field is required and cannot be empty.'
    });

    this.validationRules.set('pokemon-level', {
      validate: (value) => {
        const num = parseInt(value);
        return !isNaN(num) && num >= 1 && num <= 100;
      },
      message: 'Pokemon level must be between 1 and 100.'
    });

    this.validationRules.set('player-name', {
      validate: (value) => {
        return value && value.length <= 7 && /^[A-Za-z0-9\s]*$/.test(value);
      },
      message: 'Player name must be 7 characters or less and contain only letters and numbers.'
    });

    this.validationRules.set('encounter-count', {
      validate: (value) => {
        const num = parseInt(value);
        return !isNaN(num) && num >= 1 && num <= 999;
      },
      message: 'Encounter count must be between 1 and 999.'
    });
  }

  validateField(field) {
    const validationAttr = field.getAttribute('data-validation');
    const fieldValue = field.value;
    
    // Skip validation if no rules specified
    if (!validationAttr) return true;
    
    const rules = validationAttr.split(',').map(rule => rule.trim());
    let isValid = true;
    let errorMessage = '';

    // Apply each validation rule
    for (const ruleName of rules) {
      const rule = this.validationRules.get(ruleName);
      if (rule && !rule.validate(fieldValue)) {
        isValid = false;
        errorMessage = rule.message;
        break; // Stop at first error
      }
    }

    if (isValid) {
      this.clearFieldError(field);
    } else {
      this.setFieldError(field, errorMessage);
    }

    return isValid;
  }

  setFieldError(field, message) {
    const fieldId = field.id;
    const errorId = `${fieldId}-error`;
    
    // Mark field as invalid
    field.setAttribute('aria-invalid', 'true');
    
    // Create or update error message element
    let errorElement = document.getElementById(errorId);
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = errorId;
      errorElement.className = 'input-error';
      errorElement.setAttribute('role', 'alert');
      errorElement.setAttribute('aria-live', 'polite');
      
      // Insert after the field
      field.parentNode.insertBefore(errorElement, field.nextSibling);
      
      // Update aria-describedby
      const describedBy = field.getAttribute('aria-describedby') || '';
      const newDescribedBy = describedBy ? `${describedBy} ${errorId}` : errorId;
      field.setAttribute('aria-describedby', newDescribedBy);
    }
    
    errorElement.textContent = message;
    this.errorMessages.set(fieldId, message);
    
    // Add visual error styling
    field.classList.add('has-error');
    
    // Announce error to screen readers
    this.announceError(message);
  }

  clearFieldError(field) {
    const fieldId = field.id;
    const errorId = `${fieldId}-error`;
    
    // Mark field as valid
    field.setAttribute('aria-invalid', 'false');
    
    // Remove error message element
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
      errorElement.remove();
      
      // Update aria-describedby
      const describedBy = field.getAttribute('aria-describedby') || '';
      const newDescribedBy = describedBy.replace(errorId, '').trim();
      if (newDescribedBy) {
        field.setAttribute('aria-describedby', newDescribedBy);
      } else {
        field.removeAttribute('aria-describedby');
      }
    }
    
    // Remove visual error styling
    field.classList.remove('has-error');
    this.errorMessages.delete(fieldId);
  }

  handleFormSubmission(event) {
    const form = event.target;
    const fields = form.querySelectorAll('input[data-validation], select[data-validation], textarea[data-validation]');
    
    let hasErrors = false;
    let firstErrorField = null;

    // Validate all fields
    fields.forEach(field => {
      if (!this.validateField(field)) {
        hasErrors = true;
        if (!firstErrorField) {
          firstErrorField = field;
        }
      }
    });

    if (hasErrors) {
      event.preventDefault();
      
      // Focus first error field
      if (firstErrorField) {
        firstErrorField.focus();
        
        // Announce form errors
        const errorCount = this.errorMessages.size;
        this.announceError(`Form contains ${errorCount} error${errorCount === 1 ? '' : 's'}. Please review and correct the highlighted fields.`);
      }
    }
  }

  // Enhanced input association methods
  associateLabel(input, labelText, isRequired = false) {
    const inputId = input.id || this.generateId('input');
    input.id = inputId;
    
    const labelId = `${inputId}-label`;
    let label = document.getElementById(labelId);
    
    if (!label) {
      label = document.createElement('label');
      label.id = labelId;
      label.setAttribute('for', inputId);
      input.parentNode.insertBefore(label, input);
    }
    
    // Set label text with required indicator
    label.innerHTML = `${labelText}${isRequired ? ' <span class="required-indicator" aria-label="required">*</span>' : ''}`;
    
    return label;
  }

  associateDescription(input, descriptionText) {
    const inputId = input.id || this.generateId('input');
    input.id = inputId;
    
    const descId = `${inputId}-desc`;
    let description = document.getElementById(descId);
    
    if (!description) {
      description = document.createElement('div');
      description.id = descId;
      description.className = 'input-description';
      input.parentNode.insertBefore(description, input.nextSibling);
    }
    
    description.textContent = descriptionText;
    
    // Update aria-describedby
    const describedBy = input.getAttribute('aria-describedby') || '';
    const newDescribedBy = describedBy ? `${describedBy} ${descId}` : descId;
    input.setAttribute('aria-describedby', newDescribedBy);
    
    return description;
  }

  createFieldset(legend, inputs) {
    const fieldset = document.createElement('fieldset');
    const legendElement = document.createElement('legend');
    
    legendElement.textContent = legend;
    fieldset.appendChild(legendElement);
    
    inputs.forEach(input => {
      fieldset.appendChild(input);
    });
    
    return fieldset;
  }

  // Pokemon-specific form helpers
  createPokemonLevelInput(pokemonName, currentLevel = '') {
    const container = document.createElement('div');
    container.className = 'input-group';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.id = `${pokemonName}-level`;
    input.className = 'level-input';
    input.min = '1';
    input.max = '100';
    input.value = currentLevel;
    input.setAttribute('data-validation', 'pokemon-level');
    input.setAttribute('data-field', 'level');
    
    const label = this.associateLabel(input, `Level caught:`, false);
    const description = this.associateDescription(input, 'Enter the level at which you caught this Pokemon (1-100)');
    
    container.appendChild(label);
    container.appendChild(input);
    container.appendChild(description);
    
    return container;
  }

  createEncounterCountInput(pokemonName, currentCount = '1') {
    const container = document.createElement('div');
    container.className = 'input-group';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.id = `${pokemonName}-encounters`;
    input.className = 'encounters-input';
    input.min = '1';
    input.max = '999';
    input.value = currentCount;
    input.setAttribute('data-validation', 'encounter-count');
    input.setAttribute('data-field', 'encountersBeforeCatch');
    
    const label = this.associateLabel(input, 'Encounters before catch:', false);
    const description = this.associateDescription(input, 'How many times did you encounter this Pokemon before catching it?');
    
    container.appendChild(label);
    container.appendChild(input);
    container.appendChild(description);
    
    return container;
  }

  createPlayerNameInput(currentName = '') {
    const container = document.createElement('div');
    container.className = 'input-group';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'player-name-input';
    input.className = 'name-input';
    input.maxLength = '7';
    input.value = currentName;
    input.placeholder = 'ASH';
    input.setAttribute('data-validation', 'required,player-name');
    input.setAttribute('data-field', 'playerName');
    
    const label = this.associateLabel(input, 'Enter your player name:', true);
    const description = this.associateDescription(input, 'This will personalize the walkthrough (max 7 characters)');
    
    container.appendChild(label);
    container.appendChild(input);
    container.appendChild(description);
    
    return container;
  }

  // Choice/Radio button helpers
  createChoiceGroup(groupName, legend, choices) {
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'choice-group';
    
    const legendElement = document.createElement('legend');
    legendElement.className = 'choice-legend';
    legendElement.textContent = legend;
    fieldset.appendChild(legendElement);
    
    choices.forEach((choice, index) => {
      const choiceContainer = document.createElement('div');
      choiceContainer.className = 'choice-option';
      
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = groupName;
      input.id = `${groupName}-${choice.value}`;
      input.value = choice.value;
      input.setAttribute('data-choice', choice.value);
      
      const label = document.createElement('label');
      label.setAttribute('for', input.id);
      label.className = 'choice-label';
      label.innerHTML = choice.label;
      
      choiceContainer.appendChild(input);
      choiceContainer.appendChild(label);
      fieldset.appendChild(choiceContainer);
    });
    
    return fieldset;
  }

  // Utility methods
  generateId(prefix = 'field') {
    return `${prefix}-${Math.random().toString(36).slice(2, 11)}`;
  }

  announceError(message) {
    // Use the screen reader manager if available
    if (window.screenReaderManager) {
      window.screenReaderManager.announceAssertively(`Error: ${message}`);
    } else {
      // Fallback announcement method
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'assertive');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Error: ${message}`;
      
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);
    }
  }

  announceSuccess(message) {
    if (window.screenReaderManager) {
      window.screenReaderManager.announcePolitely(`Success: ${message}`);
    }
  }

  // Get all current form errors
  getFormErrors() {
    return Array.from(this.errorMessages.entries()).map(([fieldId, message]) => ({
      fieldId,
      message,
      field: document.getElementById(fieldId)
    }));
  }

  // Clear all form errors
  clearAllErrors() {
    const fieldsWithErrors = document.querySelectorAll('[aria-invalid="true"]');
    fieldsWithErrors.forEach(field => this.clearFieldError(field));
  }
}

// Initialize form accessibility
document.addEventListener('DOMContentLoaded', () => {
  window.formAccessibility = new FormAccessibilityManager();
});

export default FormAccessibilityManager;
