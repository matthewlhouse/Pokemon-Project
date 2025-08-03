/**
 * Security Patterns for Pokemon Walkthrough Project
 * Demonstrates input validation, sanitization, and content security
 */

// Input validation and sanitization
class SecurityManager {
  constructor() {
    this.validationSchemas = {
      stepData: {
        stepId: { type: 'string', pattern: /^[a-z0-9-]+$/, maxLength: 100 },
        completed: { type: 'boolean' },
        timestamp: { type: 'number', min: 0 },
        category: { 
          type: 'string', 
          enum: ['story', 'pokemon', 'trainer-battle', 'gym-battle', 'item', 'progression', 'choice', 'setup']
        },
        tags: { type: 'array', items: { type: 'string', maxLength: 50 } }
      },
      pokemonData: {
        name: { type: 'string', pattern: /^[a-zA-Z0-9\s-]+$/, maxLength: 50 },
        level: { type: 'number', min: 1, max: 100 },
        location: { type: 'string', pattern: /^[a-z0-9-]+$/, maxLength: 100 }
      },
      userData: {
        playerName: { type: 'string', pattern: /^[a-zA-Z0-9\s]+$/, maxLength: 20 },
        rivalName: { type: 'string', pattern: /^[a-zA-Z0-9\s]+$/, maxLength: 20 }
      }
    };
  }
  
  // Validate step data structure
  validateStepData(stepData) {
    return this.validateAgainstSchema(stepData, this.validationSchemas.stepData);
  }
  
  // Validate Pokemon data
  validatePokemonData(pokemonData) {
    return this.validateAgainstSchema(pokemonData, this.validationSchemas.pokemonData);
  }
  
  // Generic schema validation
  validateAgainstSchema(data, schema) {
    const errors = [];
    
    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Data must be an object'] };
    }
    
    Object.entries(schema).forEach(([field, rules]) => {
      const fieldErrors = this.validateField(data[field], field, rules);
      errors.push(...fieldErrors);
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  // Validate individual field to reduce complexity
  validateField(value, fieldName, rules) {
    const errors = [];
    
    // Check required fields
    if (value === undefined || value === null) {
      errors.push(`Field '${fieldName}' is required`);
      return errors;
    }
    
    // Type validation
    if (rules.type && !this.validateType(value, rules.type)) {
      errors.push(`Field '${fieldName}' must be of type ${rules.type}`);
      return errors;
    }
    
    // String validations
    if (rules.type === 'string') {
      errors.push(...this.validateStringField(value, fieldName, rules));
    }
    
    // Number validations
    if (rules.type === 'number') {
      errors.push(...this.validateNumberField(value, fieldName, rules));
    }
    
    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`Field '${fieldName}' must be one of: ${rules.enum.join(', ')}`);
    }
    
    // Array validation
    if (rules.type === 'array' && Array.isArray(value)) {
      errors.push(...this.validateArrayField(value, fieldName, rules));
    }
    
    return errors;
  }
  
  validateStringField(value, fieldName, rules) {
    const errors = [];
    
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`Field '${fieldName}' does not match required pattern`);
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`Field '${fieldName}' exceeds maximum length of ${rules.maxLength}`);
    }
    
    return errors;
  }
  
  validateNumberField(value, fieldName, rules) {
    const errors = [];
    
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`Field '${fieldName}' must be at least ${rules.min}`);
    }
    
    if (rules.max !== undefined && value > rules.max) {
      errors.push(`Field '${fieldName}' must be at most ${rules.max}`);
    }
    
    return errors;
  }
  
  validateArrayField(value, fieldName, rules) {
    const errors = [];
    
    if (rules.items) {
      value.forEach((item, index) => {
        if (!this.validateType(item, rules.items.type)) {
          errors.push(`Array item ${index} in '${fieldName}' must be of type ${rules.items.type}`);
        }
        if (rules.items.maxLength && item.length > rules.items.maxLength) {
          errors.push(`Array item ${index} in '${fieldName}' exceeds maximum length`);
        }
      });
    }
    
    return errors;
  }
  
  validateType(value, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return value !== null && typeof value === 'object' && !Array.isArray(value);
      default:
        return false;
    }
  }
  
  // Sanitize user input
  sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') return '';
    
    let sanitized = input;
    
    // Remove potential HTML/script tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    
    // Remove potential JavaScript
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    
    // Limit length
    const maxLength = options.maxLength || 1000;
    sanitized = sanitized.substring(0, maxLength);
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Encode special characters if requested
    if (options.encodeHTML) {
      sanitized = this.encodeHTML(sanitized);
    }
    
    return sanitized;
  }
  
  encodeHTML(str) {
    const htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;'
    };
    
    return str.replace(/[&<>"'/]/g, char => htmlEntities[char]);
  }
  
  // Validate localStorage data
  validateStorageData(data) {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Check data structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid data structure');
      }
      
      // Validate required properties
      const required = ['version'];
      for (const prop of required) {
        if (!(prop in parsed)) {
          throw new Error(`Missing required property: ${prop}`);
        }
      }
      
      // Validate version format
      if (!/^\d+\.\d+(\.\d+)?$/.test(parsed.version)) {
        throw new Error('Invalid version format');
      }
      
      // Validate data size (prevent storage abuse)
      const dataSize = JSON.stringify(parsed).length;
      const maxSize = 5 * 1024 * 1024; // 5MB limit
      
      if (dataSize > maxSize) {
        throw new Error('Data exceeds maximum size limit');
      }
      
      return { valid: true, data: parsed };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
  
  // Rate limiting for API-like operations
  createRateLimiter(maxRequests = 10, windowMs = 60000) {
    const requests = new Map();
    
    return (identifier) => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean old requests
      for (const [key, timestamps] of requests.entries()) {
        const filtered = timestamps.filter(time => time > windowStart);
        if (filtered.length === 0) {
          requests.delete(key);
        } else {
          requests.set(key, filtered);
        }
      }
      
      // Check current requests for identifier
      const userRequests = requests.get(identifier) || [];
      
      if (userRequests.length >= maxRequests) {
        return {
          allowed: false,
          resetTime: Math.max(...userRequests) + windowMs
        };
      }
      
      // Add current request
      userRequests.push(now);
      requests.set(identifier, userRequests);
      
      return {
        allowed: true,
        remaining: maxRequests - userRequests.length
      };
    };
  }
}

// Content Security and Safe DOM manipulation
class ContentSecurity {
  constructor() {
    this.allowedTags = ['p', 'span', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    this.allowedAttributes = ['class', 'id', 'aria-label', 'aria-describedby', 'data-step-id', 'data-category'];
  }
  
  // Safe DOM insertion
  safeInsertHTML(element, content) {
    // Create document fragment to parse safely
    const template = document.createElement('template');
    template.innerHTML = this.sanitizeHTML(content);
    
    // Clear existing content
    element.innerHTML = '';
    
    // Append sanitized content
    element.appendChild(template.content);
  }
  
  sanitizeHTML(html) {
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Recursively clean elements
    this.cleanElement(temp);
    
    return temp.innerHTML;
  }
  
  cleanElement(element) {
    // Remove script tags completely
    const scripts = element.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // Process all elements
    const allElements = element.querySelectorAll('*');
    
    allElements.forEach(el => {
      // Remove disallowed tags
      if (!this.allowedTags.includes(el.tagName.toLowerCase())) {
        // Move children up before removing
        while (el.firstChild) {
          el.parentNode.insertBefore(el.firstChild, el);
        }
        el.remove();
        return;
      }
      
      // Clean attributes
      const attributes = Array.from(el.attributes);
      attributes.forEach(attr => {
        if (!this.isAllowedAttribute(attr.name, attr.value)) {
          el.removeAttribute(attr.name);
        }
      });
    });
  }
  
  isAllowedAttribute(name, value) {
    // Check against whitelist
    if (this.allowedAttributes.includes(name)) {
      return true;
    }
    
    // Allow data attributes that match our patterns
    if (name.startsWith('data-') && /^data-[a-z-]+$/.test(name)) {
      return true;
    }
    
    // Block dangerous attributes
    const dangerous = ['onclick', 'onload', 'onerror', 'javascript:', 'vbscript:', 'data:'];
    return !dangerous.some(pattern => name.includes(pattern) || value.includes(pattern));
  }
  
  // Validate external URLs
  isValidURL(url) {
    try {
      const parsedURL = new URL(url);
      
      // Only allow HTTP/HTTPS
      if (!['https:', 'http:'].includes(parsedURL.protocol)) {
        return false;
      }
      
      // Block potentially dangerous domains
      const dangerousDomains = ['javascript', 'data', 'blob'];
      return !dangerousDomains.some(domain => parsedURL.hostname.includes(domain));
    } catch {
      return false;
    }
  }
  
  // Create safe event handlers
  createSafeEventHandler(handler, context = null) {
    return function safeHandler(event) {
      try {
        // Bind context if provided
        const boundHandler = context ? handler.bind(context) : handler;
        return boundHandler(event);
      } catch (error) {
        console.error('Event handler error:', error);
        
        // Prevent error from bubbling up
        event.preventDefault();
        event.stopPropagation();
        
        // Optionally report error
        if (window.errorReporting) {
          window.errorReporting.reportError(error, 'event-handler');
        }
      }
    };
  }
  
  // Content Security Policy helper
  generateCSPHeader() {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Note: unsafe-inline should be avoided in production
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https:",
      "connect-src 'self' https:",
      "media-src 'none'",
      "object-src 'none'",
      "frame-src 'none'"
    ];
    
    return cspDirectives.join('; ');
  }
}

export { SecurityManager, ContentSecurity };
