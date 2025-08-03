/**
 * Storage Utility - Handles localStorage operations with error handling and validation
 * Provides a reliable interface for storing and retrieving application data
 */

export class Storage {
    constructor() {
        this.prefix = 'pokemon_walkthrough_';
        this.isAvailable = this.checkStorageAvailability();
        this.fallbackData = new Map(); // Fallback for when localStorage isn't available
    }
    
    /**
     * Initialize the storage system
     */
    async init() {
        console.log('💾 Initializing storage system...');
        
        if (!this.isAvailable) {
            console.warn('⚠️ localStorage not available, using in-memory fallback');
        }
        
        // Check storage quota
        if (this.isAvailable) {
            await this.checkStorageQuota();
        }
        
        console.log('✅ Storage system initialized');
    }
    
    /**
     * Check if localStorage is available
     */
    checkStorageAvailability() {
        try {
            const testKey = `${this.prefix}test`;
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn('localStorage not available:', e);
            return false;
        }
    }
    
    /**
     * Check storage quota and usage
     */
    async checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
                const quotaMB = (estimate.quota / (1024 * 1024)).toFixed(2);
                
                console.log(`Storage usage: ${usedMB}MB / ${quotaMB}MB`);
                
                // Warn if usage is high
                if (estimate.usage / estimate.quota > 0.8) {
                    console.warn('⚠️ Storage quota usage is high');
                }
            } catch (error) {
                console.warn('Could not estimate storage quota:', error);
            }
        }
    }
    
    /**
     * Set an item in storage
     */
    setItem(key, value) {
        const fullKey = this.prefix + key;
        
        try {
            if (this.isAvailable) {
                const serializedValue = JSON.stringify({
                    value,
                    timestamp: Date.now(),
                    version: '1.0'
                });
                
                localStorage.setItem(fullKey, serializedValue);
            } else {
                // Use fallback storage
                this.fallbackData.set(fullKey, value);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to set storage item:', error);
            
            // If localStorage failed, try fallback
            if (this.isAvailable) {
                this.fallbackData.set(fullKey, value);
            }
            
            return false;
        }
    }
    
    /**
     * Get an item from storage
     */
    getItem(key, defaultValue = null) {
        const fullKey = this.prefix + key;
        
        try {
            if (this.isAvailable) {
                const item = localStorage.getItem(fullKey);
                if (item === null) return defaultValue;
                
                const parsed = JSON.parse(item);
                
                // Handle legacy data format
                if (typeof parsed === 'object' && 'value' in parsed) {
                    return parsed.value;
                } else {
                    // Legacy format, migrate it
                    this.setItem(key, parsed);
                    return parsed;
                }
            } else {
                // Use fallback storage
                return this.fallbackData.get(fullKey) ?? defaultValue;
            }
        } catch (error) {
            console.error('Failed to get storage item:', error);
            
            // Try fallback if available
            return this.fallbackData.get(fullKey) ?? defaultValue;
        }
    }
    
    /**
     * Remove an item from storage
     */
    removeItem(key) {
        const fullKey = this.prefix + key;
        
        try {
            if (this.isAvailable) {
                localStorage.removeItem(fullKey);
            }
            
            this.fallbackData.delete(fullKey);
            return true;
        } catch (error) {
            console.error('Failed to remove storage item:', error);
            return false;
        }
    }
    
    /**
     * Clear all app data from storage
     */
    clear() {
        try {
            if (this.isAvailable) {
                // Only remove items with our prefix
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key?.startsWith(this.prefix)) {
                        keysToRemove.push(key);
                    }
                }
                
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }
            
            // Clear fallback data
            this.fallbackData.clear();
            
            return true;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return false;
        }
    }
    
    /**
     * Get all stored keys (without prefix)
     */
    getAllKeys() {
        const keys = [];
        
        try {
            if (this.isAvailable) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key?.startsWith(this.prefix)) {
                        keys.push(key.substring(this.prefix.length));
                    }
                }
            }
            
            // Add fallback keys
            for (const key of this.fallbackData.keys()) {
                if (key.startsWith(this.prefix)) {
                    const shortKey = key.substring(this.prefix.length);
                    if (!keys.includes(shortKey)) {
                        keys.push(shortKey);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to get storage keys:', error);
        }
        
        return keys;
    }
    
    /**
     * Get storage usage statistics
     */
    getStorageStats() {
        const stats = {
            available: this.isAvailable,
            itemCount: 0,
            estimatedSize: 0,
            keys: []
        };
        
        try {
            const keys = this.getAllKeys();
            stats.itemCount = keys.length;
            stats.keys = keys;
            
            // Estimate storage size
            if (this.isAvailable) {
                keys.forEach(key => {
                    const fullKey = this.prefix + key;
                    const item = localStorage.getItem(fullKey);
                    if (item) {
                        stats.estimatedSize += item.length * 2; // Rough estimate (UTF-16)
                    }
                });
            }
        } catch (error) {
            console.error('Failed to get storage stats:', error);
        }
        
        return stats;
    }
    
    /**
     * Export all app data
     */
    exportData() {
        const data = {};
        
        try {
            const keys = this.getAllKeys();
            keys.forEach(key => {
                data[key] = this.getItem(key);
            });
        } catch (error) {
            console.error('Failed to export data:', error);
        }
        
        return {
            version: '1.0',
            timestamp: Date.now(),
            data
        };
    }
    
    /**
     * Import data from export
     */
    importData(exportedData) {
        try {
            if (!exportedData?.data) {
                throw new Error('Invalid export data format');
            }
            
            // Clear existing data
            this.clear();
            
            // Import new data
            Object.entries(exportedData.data).forEach(([key, value]) => {
                this.setItem(key, value);
            });
            
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }
    
    /**
     * Validate data integrity
     */
    validateData() {
        const issues = [];
        
        try {
            const keys = this.getAllKeys();
            
            keys.forEach(key => {
                try {
                    const value = this.getItem(key);
                    if (value === null) {
                        issues.push(`Key '${key}' returned null`);
                    }
                } catch (error) {
                    issues.push(`Failed to read key '${key}': ${error.message}`);
                }
            });
        } catch (error) {
            issues.push(`Failed to validate data: ${error.message}`);
        }
        
        return {
            isValid: issues.length === 0,
            issues
        };
    }
    
    /**
     * Handle storage quota exceeded error
     */
    handleQuotaExceeded(key, value) {
        console.warn('Storage quota exceeded, attempting cleanup...');
        
        // Try to free up space by removing old temporary data
        const keys = this.getAllKeys();
        const tempKeys = keys.filter(k => k.startsWith('temp_') || k.startsWith('cache_'));
        
        tempKeys.forEach(tempKey => {
            this.removeItem(tempKey);
        });
        
        // Try setting the item again
        try {
            if (this.isAvailable) {
                localStorage.setItem(this.prefix + key, JSON.stringify({
                    value,
                    timestamp: Date.now(),
                    version: '1.0'
                }));
                return true;
            }
        } catch (error) {
            console.error('Still unable to save after cleanup:', error);
        }
        
        // Fall back to in-memory storage
        this.fallbackData.set(this.prefix + key, value);
        return false;
    }
    
    /**
     * Backup critical data to a separate key
     */
    backupCriticalData(data, backupKey = 'critical_backup') {
        try {
            const backup = {
                timestamp: Date.now(),
                data: data,
                version: '1.0'
            };
            
            this.setItem(backupKey, backup);
            return true;
        } catch (error) {
            console.error('Failed to create backup:', error);
            return false;
        }
    }
    
    /**
     * Restore from backup
     */
    restoreFromBackup(backupKey = 'critical_backup') {
        try {
            const backup = this.getItem(backupKey);
            if (!backup) {
                throw new Error('No backup found');
            }
            
            return backup.data;
        } catch (error) {
            console.error('Failed to restore from backup:', error);
            return null;
        }
    }
}
