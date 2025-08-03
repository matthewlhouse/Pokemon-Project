/**
 * Event Emitter - Simple event system for module communication
 * Provides a clean interface for modules to communicate without tight coupling
 */

export class EventEmitter {
    constructor() {
        this.events = new Map();
        this.maxListeners = 10; // Prevent memory leaks
    }
    
    /**
     * Add an event listener
     */
    on(eventName, listener) {
        if (typeof listener !== 'function') {
            throw new TypeError('Listener must be a function');
        }
        
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        
        const listeners = this.events.get(eventName);
        
        // Check for max listeners to prevent memory leaks
        if (listeners.length >= this.maxListeners) {
            console.warn(`Maximum listeners (${this.maxListeners}) exceeded for event '${eventName}'`);
        }
        
        listeners.push(listener);
        
        // Return a function to remove this listener
        return () => this.off(eventName, listener);
    }
    
    /**
     * Add a one-time event listener
     */
    once(eventName, listener) {
        const onceWrapper = (...args) => {
            this.off(eventName, onceWrapper);
            listener.apply(this, args);
        };
        
        return this.on(eventName, onceWrapper);
    }
    
    /**
     * Remove an event listener
     */
    off(eventName, listener) {
        const listeners = this.events.get(eventName);
        if (!listeners) return false;
        
        const index = listeners.indexOf(listener);
        if (index === -1) return false;
        
        listeners.splice(index, 1);
        
        // Clean up empty event arrays
        if (listeners.length === 0) {
            this.events.delete(eventName);
        }
        
        return true;
    }
    
    /**
     * Remove all listeners for an event
     */
    removeAllListeners(eventName) {
        if (eventName) {
            this.events.delete(eventName);
        } else {
            this.events.clear();
        }
    }
    
    /**
     * Emit an event to all listeners
     */
    emit(eventName, ...args) {
        const listeners = this.events.get(eventName);
        if (!listeners || listeners.length === 0) {
            return false;
        }
        
        // Create a copy of listeners to avoid issues if listeners are modified during emission
        const listenersCopy = [...listeners];
        
        listenersCopy.forEach(listener => {
            try {
                listener.apply(this, args);
            } catch (error) {
                console.error(`Error in event listener for '${eventName}':`, error);
                
                // Emit error event (but don't let it cause infinite loops)
                if (eventName !== 'error') {
                    this.emit('error', error, eventName);
                }
            }
        });
        
        return true;
    }
    
    /**
     * Get the number of listeners for an event
     */
    listenerCount(eventName) {
        const listeners = this.events.get(eventName);
        return listeners ? listeners.length : 0;
    }
    
    /**
     * Get all event names that have listeners
     */
    eventNames() {
        return Array.from(this.events.keys());
    }
    
    /**
     * Set the maximum number of listeners per event
     */
    setMaxListeners(max) {
        if (typeof max !== 'number' || max < 0) {
            throw new TypeError('Max listeners must be a non-negative number');
        }
        this.maxListeners = max;
    }
    
    /**
     * Get the maximum number of listeners per event
     */
    getMaxListeners() {
        return this.maxListeners;
    }
    
    /**
     * Get all listeners for an event
     */
    listeners(eventName) {
        const listeners = this.events.get(eventName);
        return listeners ? [...listeners] : [];
    }
    
    /**
     * Add multiple event listeners at once
     */
    addListeners(eventMap) {
        const removeListeners = [];
        
        Object.entries(eventMap).forEach(([eventName, listener]) => {
            const removeListener = this.on(eventName, listener);
            removeListeners.push(removeListener);
        });
        
        // Return function to remove all added listeners
        return () => {
            removeListeners.forEach(remove => remove());
        };
    }
    
    /**
     * Create a promise that resolves when an event is emitted
     */
    waitFor(eventName, timeout = null) {
        return new Promise((resolve, reject) => {
            let timeoutId = null;
            
            const cleanup = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            };
            
            const onceListener = (...args) => {
                cleanup();
                resolve(args.length <= 1 ? args[0] : args);
            };
            
            this.once(eventName, onceListener);
            
            if (timeout) {
                timeoutId = setTimeout(() => {
                    this.off(eventName, onceListener);
                    reject(new Error(`Timeout waiting for event '${eventName}'`));
                }, timeout);
            }
        });
    }
    
    /**
     * Create a filtered event listener
     */
    filter(eventName, filterFn, listener) {
        const filteredListener = (...args) => {
            if (filterFn(...args)) {
                listener(...args);
            }
        };
        
        return this.on(eventName, filteredListener);
    }
    
    /**
     * Create a mapped event listener
     */
    map(eventName, mapFn, listener) {
        const mappedListener = (...args) => {
            const mappedArgs = mapFn(...args);
            listener(...(Array.isArray(mappedArgs) ? mappedArgs : [mappedArgs]));
        };
        
        return this.on(eventName, mappedListener);
    }
    
    /**
     * Pipe events from one emitter to another
     */
    pipe(targetEmitter, eventMap = null) {
        const removeListeners = [];
        
        if (eventMap) {
            // Pipe specific events with mapping
            Object.entries(eventMap).forEach(([sourceEvent, targetEvent]) => {
                const removeListener = this.on(sourceEvent, (...args) => {
                    targetEmitter.emit(targetEvent, ...args);
                });
                removeListeners.push(removeListener);
            });
        } else {
            // Pipe all events
            const allEvents = this.eventNames();
            allEvents.forEach(eventName => {
                const removeListener = this.on(eventName, (...args) => {
                    targetEmitter.emit(eventName, ...args);
                });
                removeListeners.push(removeListener);
            });
        }
        
        // Return function to remove all piped listeners
        return () => {
            removeListeners.forEach(remove => remove());
        };
    }
    
    /**
     * Throttle event emissions
     */
    throttle(eventName, listener, delay = 100) {
        let lastCall = 0;
        let timeoutId = null;
        
        const throttledListener = (...args) => {
            const now = Date.now();
            
            if (now - lastCall >= delay) {
                lastCall = now;
                listener(...args);
            } else {
                // Clear existing timeout and set a new one
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                
                timeoutId = setTimeout(() => {
                    lastCall = Date.now();
                    listener(...args);
                    timeoutId = null;
                }, delay - (now - lastCall));
            }
        };
        
        return this.on(eventName, throttledListener);
    }
    
    /**
     * Debounce event emissions
     */
    debounce(eventName, listener, delay = 100) {
        let timeoutId = null;
        
        const debouncedListener = (...args) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            timeoutId = setTimeout(() => {
                listener(...args);
                timeoutId = null;
            }, delay);
        };
        
        return this.on(eventName, debouncedListener);
    }
    
    /**
     * Get debug information about the event emitter
     */
    getDebugInfo() {
        const info = {
            totalEvents: this.events.size,
            totalListeners: 0,
            events: {}
        };
        
        this.events.forEach((listeners, eventName) => {
            info.totalListeners += listeners.length;
            info.events[eventName] = listeners.length;
        });
        
        return info;
    }
    
    /**
     * Clean up all resources
     */
    destroy() {
        this.removeAllListeners();
        this.events.clear();
    }
}
