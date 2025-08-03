/**
 * DOM Utility - Helper functions for DOM manipulation and queries
 * Provides consistent and safe DOM operations across the application
 */

export class DOM {
    /**
     * Query a single element
     */
    static query(selector, context = document) {
        try {
            return context.querySelector(selector);
        } catch (error) {
            console.error(`Invalid selector: ${selector}`, error);
            return null;
        }
    }
    
    /**
     * Query multiple elements
     */
    static queryAll(selector, context = document) {
        try {
            return Array.from(context.querySelectorAll(selector));
        } catch (error) {
            console.error(`Invalid selector: ${selector}`, error);
            return [];
        }
    }
    
    /**
     * Create an element with attributes and content
     */
    static create(tagName, attributes = {}, content = '') {
        const element = document.createElement(tagName);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else if (key === 'textContent') {
                    element.textContent = value;
                } else if (key.startsWith('data-')) {
                    element.setAttribute(key, value);
                } else if (key.startsWith('aria-')) {
                    element.setAttribute(key, value);
                } else if (key === 'style' && typeof value === 'object') {
                    Object.assign(element.style, value);
                } else {
                    element[key] = value;
                }
            }
        });
        
        // Set content
        if (content) {
            if (typeof content === 'string') {
                element.textContent = content;
            } else if (content instanceof Node) {
                element.appendChild(content);
            } else if (Array.isArray(content)) {
                content.forEach(child => {
                    if (typeof child === 'string') {
                        element.appendChild(document.createTextNode(child));
                    } else if (child instanceof Node) {
                        element.appendChild(child);
                    }
                });
            }
        }
        
        return element;
    }
    
    /**
     * Safely remove an element from the DOM
     */
    static remove(element) {
        if (element?.parentNode) {
            element.parentNode.removeChild(element);
            return true;
        }
        return false;
    }
    
    /**
     * Add class(es) to an element
     */
    static addClass(element, ...classes) {
        if (element?.classList) {
            element.classList.add(...classes);
            return true;
        }
        return false;
    }
    
    /**
     * Remove class(es) from an element
     */
    static removeClass(element, ...classes) {
        if (element?.classList) {
            element.classList.remove(...classes);
            return true;
        }
        return false;
    }
    
    /**
     * Toggle class(es) on an element
     */
    static toggleClass(element, className, force = undefined) {
        if (element?.classList) {
            return element.classList.toggle(className, force);
        }
        return false;
    }
    
    /**
     * Check if element has class
     */
    static hasClass(element, className) {
        return element?.classList?.contains(className) ?? false;
    }
    
    /**
     * Set multiple attributes on an element
     */
    static setAttributes(element, attributes) {
        if (!element) return false;
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                element.setAttribute(key, value);
            } else {
                element.removeAttribute(key);
            }
        });
        
        return true;
    }
    
    /**
     * Get element data attribute
     */
    static getData(element, key) {
        if (!element?.dataset) return null;
        return element.dataset[key] || null;
    }
    
    /**
     * Set element data attribute
     */
    static setData(element, key, value) {
        if (!element?.dataset) return false;
        element.dataset[key] = value;
        return true;
    }
    
    /**
     * Check if element is visible
     */
    static isVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               element.offsetWidth > 0 && 
               element.offsetHeight > 0;
    }
    
    /**
     * Get element position relative to viewport
     */
    static getPosition(element) {
        if (!element) return null;
        
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
            centerX: rect.left + rect.width / 2,
            centerY: rect.top + rect.height / 2
        };
    }
    
    /**
     * Scroll element into view with smooth animation
     */
    static scrollIntoView(element, options = {}) {
        if (!element) return false;
        
        const defaultOptions = {
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        };
        
        element.scrollIntoView({ ...defaultOptions, ...options });
        return true;
    }
    
    /**
     * Find the closest parent element matching a selector
     */
    static closest(element, selector) {
        if (!element || typeof element.closest !== 'function') return null;
        
        try {
            return element.closest(selector);
        } catch (error) {
            console.error(`Invalid selector: ${selector}`, error);
            return null;
        }
    }
    
    /**
     * Get all sibling elements
     */
    static getSiblings(element) {
        if (!element?.parentNode) return [];
        
        return Array.from(element.parentNode.children).filter(child => child !== element);
    }
    
    /**
     * Insert element after another element
     */
    static insertAfter(newElement, targetElement) {
        if (!newElement || !targetElement?.parentNode) return false;
        
        targetElement.parentNode.insertBefore(newElement, targetElement.nextSibling);
        return true;
    }
    
    /**
     * Insert element before another element
     */
    static insertBefore(newElement, targetElement) {
        if (!newElement || !targetElement?.parentNode) return false;
        
        targetElement.parentNode.insertBefore(newElement, targetElement);
        return true;
    }
    
    /**
     * Replace an element with another element
     */
    static replace(oldElement, newElement) {
        if (!oldElement || !newElement || !oldElement.parentNode) return false;
        
        oldElement.parentNode.replaceChild(newElement, oldElement);
        return true;
    }
    
    /**
     * Clear all children from an element
     */
    static empty(element) {
        if (!element) return false;
        
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        return true;
    }
    
    /**
     * Set element text content safely
     */
    static setText(element, text) {
        if (!element) return false;
        element.textContent = text || '';
        return true;
    }
    
    /**
     * Set element HTML content safely (sanitized)
     */
    static setHTML(element, html) {
        if (!element) return false;
        
        // Basic HTML sanitization - remove script tags and event handlers
        const sanitized = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/\s*on\w+\s*=\s*"[^"]*"/gi, '')
            .replace(/\s*on\w+\s*=\s*'[^']*'/gi, '');
        
        element.innerHTML = sanitized;
        return true;
    }
    
    /**
     * Add event listener with automatic cleanup
     */
    static addEventListener(element, event, handler, options = {}) {
        if (!element || typeof handler !== 'function') return null;
        
        element.addEventListener(event, handler, options);
        
        // Return cleanup function
        return () => {
            element.removeEventListener(event, handler, options);
        };
    }
    
    /**
     * Delegate event handling to parent element
     */
    static delegate(parent, selector, event, handler) {
        if (!parent || typeof handler !== 'function') return null;
        
        const delegatedHandler = (e) => {
            const target = e.target.closest(selector);
            if (target && parent.contains(target)) {
                handler.call(target, e);
            }
        };
        
        return this.addEventListener(parent, event, delegatedHandler);
    }
    
    /**
     * Wait for DOM content to be ready
     */
    static ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }
    
    /**
     * Create a document fragment with multiple elements
     */
    static createFragment(elements) {
        const fragment = document.createDocumentFragment();
        
        elements.forEach(element => {
            if (typeof element === 'string') {
                fragment.appendChild(document.createTextNode(element));
            } else if (element instanceof Node) {
                fragment.appendChild(element);
            }
        });
        
        return fragment;
    }
    
    /**
     * Measure element dimensions including margins
     */
    static getFullSize(element) {
        if (!element) return null;
        
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return {
            width: rect.width,
            height: rect.height,
            outerWidth: rect.width + 
                       parseFloat(style.marginLeft) + 
                       parseFloat(style.marginRight),
            outerHeight: rect.height + 
                        parseFloat(style.marginTop) + 
                        parseFloat(style.marginBottom)
        };
    }
    
    /**
     * Check if element is in viewport
     */
    static isInViewport(element, threshold = 0) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        return rect.top >= -threshold &&
               rect.left >= -threshold &&
               rect.bottom <= windowHeight + threshold &&
               rect.right <= windowWidth + threshold;
    }
    
    /**
     * Animate element with CSS transitions
     */
    static animate(element, properties, duration = 300, easing = 'ease') {
        if (!element) return Promise.reject(new Error('Element not found'));
        
        return new Promise((resolve) => {
            const originalTransition = element.style.transition;
            
            element.style.transition = `all ${duration}ms ${easing}`;
            
            Object.entries(properties).forEach(([property, value]) => {
                element.style[property] = value;
            });
            
            const cleanup = () => {
                element.style.transition = originalTransition;
                element.removeEventListener('transitionend', cleanup);
                resolve();
            };
            
            element.addEventListener('transitionend', cleanup);
            
            // Fallback timeout in case transitionend doesn't fire
            setTimeout(cleanup, duration + 50);
        });
    }
    
    /**
     * Focus element with accessibility considerations
     */
    static focus(element, options = {}) {
        if (!element) return false;
        
        const defaultOptions = {
            preventScroll: false
        };
        
        element.focus({ ...defaultOptions, ...options });
        
        // Ensure focus is visible
        if (!this.hasClass(element, 'focus-visible')) {
            this.addClass(element, 'focus-visible');
        }
        
        return true;
    }
    
    /**
     * Create a safe HTML string from template literals
     */
    static html(strings, ...values) {
        let result = '';
        
        for (let i = 0; i < strings.length; i++) {
            result += strings[i];
            
            if (i < values.length) {
                const value = values[i];
                
                // Basic XSS protection - escape HTML entities
                if (typeof value === 'string') {
                    result += value
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;');
                } else {
                    result += value;
                }
            }
        }
        
        return result;
    }
}
