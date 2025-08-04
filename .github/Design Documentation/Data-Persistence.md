# Data Persistence Strategy

## Overview

This document defines the data storage, backup, migration, and synchronization strategies for the Pokemon Walkthrough Project. The system uses localStorage as the primary storage mechanism with comprehensive backup and export capabilities.

## Storage Architecture

### Primary Storage: localStorage

**Rationale**: Client-side persistence with JSON serialization provides:

- No server dependencies or costs
- Instant data access and updates
- Offline functionality
- Cross-session persistence
- Easy backup and export capabilities

### Storage Key Structure

```javascript
const STORAGE_KEYS = {
    // Individual game progress
    GAME_PROGRESS: gameId => `pokemon_walkthrough_game_${gameId}`,

    // Cross-game aggregated data
    GLOBAL_PROGRESS: 'pokemon_walkthrough_global',

    // User preferences and settings
    USER_PREFERENCES: 'pokemon_walkthrough_preferences',

    // Temporary data (encounter tracking, etc.)
    TEMP_DATA: 'pokemon_walkthrough_temp',

    // Backup timestamps
    LAST_BACKUP: 'pokemon_walkthrough_last_backup',

    // Data version for migration handling
    DATA_VERSION: 'pokemon_walkthrough_version',
};
```

## Core Storage Manager

```javascript
class DataPersistenceManager {
    constructor() {
        this.currentVersion = '1.0';
        this.maxBackups = 5;
        this.compressionEnabled = true;
        this.storageQuota = 5 * 1024 * 1024; // 5MB typical localStorage limit
    }

    // Core storage operations
    save(key, data) {
        try {
            const serializedData = this.compressionEnabled
                ? this.compress(JSON.stringify(data))
                : JSON.stringify(data);

            localStorage.setItem(key, serializedData);

            // Update last modified timestamp
            localStorage.setItem(`${key}_timestamp`, new Date().toISOString());

            return true;
        } catch (error) {
            console.error('Failed to save data:', error);
            return this.handleStorageError(error, key, data);
        }
    }

    load(key, defaultValue = null) {
        try {
            const stored = localStorage.getItem(key);
            if (!stored) return defaultValue;

            const data = this.compressionEnabled
                ? this.decompress(stored)
                : stored;

            return JSON.parse(data);
        } catch (error) {
            console.error('Failed to load data:', error);
            return defaultValue;
        }
    }

    // Game-specific progress management
    saveGameProgress(gameId, progressData) {
        const key = STORAGE_KEYS.GAME_PROGRESS(gameId);

        // Add metadata
        const enrichedData = {
            ...progressData,
            gameId,
            version: this.currentVersion,
            lastUpdated: new Date().toISOString(),
            totalSteps: this.calculateTotalSteps(progressData),
            completedSteps: this.calculateCompletedSteps(progressData),
        };

        // Create backup before saving
        this.createBackup(key);

        return this.save(key, enrichedData);
    }

    loadGameProgress(gameId) {
        const key = STORAGE_KEYS.GAME_PROGRESS(gameId);
        const data = this.load(key, this.getDefaultGameProgress(gameId));

        // Handle version migration if needed
        return this.migrateDataIfNeeded(data);
    }

    calculateTotalSteps(progressData) {
        return Object.keys(progressData.steps || {}).length;
    }

    calculateCompletedSteps(progressData) {
        return Object.values(progressData.steps || {}).filter(
            step => step.completed
        ).length;
    }

    getDefaultGameProgress(gameId) {
        return {
            gameId,
            version: this.currentVersion,
            lastUpdated: new Date().toISOString(),
            steps: {},
            choices: {},
            pokemon: {},
            items: {},
            battles: {},
        };
    }
}
```

## Global Progress Aggregation

```javascript
class GlobalProgressManager extends DataPersistenceManager {
    // Aggregate data across all games
    updateGlobalProgress() {
        const allGames = ['red', 'blue', 'yellow', 'gold', 'silver', 'crystal'];
        const globalData = {
            version: this.currentVersion,
            lastUpdated: new Date().toISOString(),
            totalGames: allGames.length,
            completedGames: 0,
            pokedex: {},
            stats: {
                totalPokemonCaught: 0,
                totalItemsCollected: 0,
                totalBattlesWon: 0,
                playtimeHours: 0,
            },
        };

        // Aggregate data from all games
        allGames.forEach(gameId => {
            const gameProgress = this.loadGameProgress(gameId);
            if (
                gameProgress &&
                Object.keys(gameProgress.steps || {}).length > 0
            ) {
                this.aggregateGameData(globalData, gameProgress, gameId);
            }
        });

        return this.save(STORAGE_KEYS.GLOBAL_PROGRESS, globalData);
    }

    aggregateGameData(globalData, gameProgress, gameId) {
        // Count completed games
        const completionPercentage =
            this.calculateCompletionPercentage(gameProgress);
        if (completionPercentage >= 100) {
            globalData.completedGames++;
        }

        // Aggregate Pokemon data for Living Pokedex
        if (gameProgress.pokemon) {
            Object.entries(gameProgress.pokemon).forEach(
                ([pokemonName, pokemonData]) => {
                    if (!globalData.pokedex[pokemonName]) {
                        globalData.pokedex[pokemonName] = {
                            name: pokemonName,
                            caught: [],
                            firstGame: gameId,
                            timesEncountered: 0,
                            locations: new Set(),
                        };
                    }

                    // Track which games this Pokemon was caught in
                    if (pokemonData.catches && pokemonData.catches.length > 0) {
                        globalData.pokedex[pokemonName].caught.push(gameId);
                        globalData.stats.totalPokemonCaught++;

                        // Track all locations where this Pokemon was caught
                        pokemonData.catches.forEach(catchData => {
                            globalData.pokedex[pokemonName].locations.add(
                                catchData.location
                            );
                        });
                    }

                    globalData.pokedex[pokemonName].timesEncountered +=
                        pokemonData.totalEncounters || 0;
                }
            );
        }

        // Aggregate other statistics
        globalData.stats.totalItemsCollected += Object.keys(
            gameProgress.items || {}
        ).length;
        globalData.stats.totalBattlesWon += Object.keys(
            gameProgress.battles || {}
        ).length;
    }

    calculateCompletionPercentage(gameProgress) {
        const total = gameProgress.totalSteps || 0;
        const completed = gameProgress.completedSteps || 0;
        return total > 0 ? (completed / total) * 100 : 0;
    }

    getLivingPokedexStatus() {
        const globalData = this.load(STORAGE_KEYS.GLOBAL_PROGRESS, {});
        const pokedex = globalData.pokedex || {};

        const caughtPokemon = Object.values(pokedex).filter(
            pokemon => pokemon.caught && pokemon.caught.length > 0
        );

        return {
            totalCaught: caughtPokemon.length,
            totalPossible: 151, // Gen 1 + 2 would be 251
            completionPercentage: (caughtPokemon.length / 151) * 100,
            missingPokemon: this.getMissingPokemon(pokedex),
        };
    }

    getMissingPokemon(pokedex) {
        // This would need to be populated with complete Pokemon data
        const allPokemon = [
            'bulbasaur',
            'ivysaur',
            'venusaur',
            'charmander',
            'charmeleon',
            'charizard',
            'squirtle',
            'wartortle',
            'blastoise',
            'caterpie',
            'metapod',
            'butterfree',
            // ... complete list
        ];

        return allPokemon.filter(
            pokemon =>
                !pokedex[pokemon] ||
                !pokedex[pokemon].caught ||
                pokedex[pokemon].caught.length === 0
        );
    }
}
```

## Backup and Recovery System

```javascript
class BackupManager extends GlobalProgressManager {
    createBackup(dataKey) {
        try {
            const currentData = this.load(dataKey);
            if (!currentData) return false;

            const backupKey = `${dataKey}_backup_${Date.now()}`;
            const backupData = {
                originalKey: dataKey,
                timestamp: new Date().toISOString(),
                dataVersion: this.currentVersion,
                data: currentData,
            };

            this.save(backupKey, backupData);
            this.cleanupOldBackups(dataKey);

            return true;
        } catch (error) {
            console.error('Backup creation failed:', error);
            return false;
        }
    }

    cleanupOldBackups(dataKey) {
        const backupKeys = this.getBackupKeys(dataKey);

        if (backupKeys.length > this.maxBackups) {
            // Sort by timestamp and remove oldest
            const sortedKeys = backupKeys
                .map(key => ({
                    key,
                    timestamp: this.load(key)?.timestamp || 0,
                }))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Remove excess backups
            sortedKeys.slice(this.maxBackups).forEach(backup => {
                localStorage.removeItem(backup.key);
            });
        }
    }

    getBackupKeys(dataKey) {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`${dataKey}_backup_`)) {
                keys.push(key);
            }
        }
        return keys;
    }

    restoreFromBackup(dataKey, backupTimestamp = null) {
        try {
            const backupKeys = this.getBackupKeys(dataKey);

            let targetBackup;
            if (backupTimestamp) {
                targetBackup = backupKeys.find(key =>
                    key.includes(backupTimestamp)
                );
            } else {
                // Get most recent backup
                const backups = backupKeys
                    .map(key => ({ key, data: this.load(key) }))
                    .filter(backup => backup.data)
                    .sort(
                        (a, b) =>
                            new Date(b.data.timestamp) -
                            new Date(a.data.timestamp)
                    );

                targetBackup = backups[0]?.key;
            }

            if (!targetBackup) {
                throw new Error('No suitable backup found');
            }

            const backupData = this.load(targetBackup);
            if (backupData && backupData.data) {
                this.save(dataKey, backupData.data);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Backup restoration failed:', error);
            return false;
        }
    }

    listAvailableBackups(dataKey) {
        const backupKeys = this.getBackupKeys(dataKey);

        return backupKeys
            .map(key => {
                const backup = this.load(key);
                return {
                    key,
                    timestamp: backup?.timestamp,
                    dataVersion: backup?.dataVersion,
                    size: new Blob([localStorage.getItem(key)]).size,
                };
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
}
```

## Export/Import System

```javascript
class DataExportImportManager extends BackupManager {
    // Export user's complete progress
    exportAllData() {
        try {
            const exportData = {
                exportVersion: this.currentVersion,
                exportTimestamp: new Date().toISOString(),
                exportType: 'complete',

                // Game progress
                games: {},

                // Global data
                global: this.load(STORAGE_KEYS.GLOBAL_PROGRESS),

                // User preferences
                preferences: this.load(STORAGE_KEYS.USER_PREFERENCES),

                // Metadata
                metadata: {
                    totalGames: 0,
                    totalSteps: 0,
                    completedSteps: 0,
                    exportSize: 0,
                },
            };

            // Export all game data
            const allGames = [
                'red',
                'blue',
                'yellow',
                'gold',
                'silver',
                'crystal',
            ];
            allGames.forEach(gameId => {
                const gameData = this.loadGameProgress(gameId);
                if (gameData && Object.keys(gameData.steps || {}).length > 0) {
                    exportData.games[gameId] = gameData;
                    exportData.metadata.totalGames++;
                    exportData.metadata.totalSteps += gameData.totalSteps || 0;
                    exportData.metadata.completedSteps +=
                        gameData.completedSteps || 0;
                }
            });

            // Calculate export size
            const jsonString = JSON.stringify(exportData, null, 2);
            exportData.metadata.exportSize = new Blob([jsonString]).size;

            return this.generateExportFile(exportData);
        } catch (error) {
            console.error('Export failed:', error);
            throw new Error('Failed to export data');
        }
    }

    // Export single game progress
    exportGameData(gameId) {
        try {
            const gameData = this.loadGameProgress(gameId);
            const exportData = {
                exportVersion: this.currentVersion,
                exportTimestamp: new Date().toISOString(),
                exportType: 'single-game',
                gameId: gameId,
                data: gameData,
                metadata: {
                    totalSteps: gameData.totalSteps || 0,
                    completedSteps: gameData.completedSteps || 0,
                    completionPercentage:
                        this.calculateCompletionPercentage(gameData),
                },
            };

            return this.generateExportFile(
                exportData,
                `pokemon-walkthrough-${gameId}`
            );
        } catch (error) {
            console.error(`Export failed for game ${gameId}:`, error);
            throw new Error(`Failed to export ${gameId} data`);
        }
    }

    generateExportFile(data, filename = 'pokemon-walkthrough-complete') {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.json`;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return true;
    }

    // Import data with validation
    async importData(file) {
        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            // Validate import data
            if (!this.validateImportData(importData)) {
                throw new Error('Invalid import file format');
            }

            // Create full backup before import
            this.createFullBackup();

            // Import based on type
            if (importData.exportType === 'complete') {
                return this.importCompleteData(importData);
            } else if (importData.exportType === 'single-game') {
                return this.importGameData(importData);
            } else {
                throw new Error('Unknown export type');
            }
        } catch (error) {
            console.error('Import failed:', error);
            throw new Error(`Import failed: ${error.message}`);
        }
    }

    validateImportData(data) {
        // Check required fields
        const requiredFields = [
            'exportVersion',
            'exportTimestamp',
            'exportType',
        ];
        if (!requiredFields.every(field => data.hasOwnProperty(field))) {
            return false;
        }

        // Validate export type
        if (!['complete', 'single-game'].includes(data.exportType)) {
            return false;
        }

        // Type-specific validation
        if (data.exportType === 'complete') {
            return (
                data.hasOwnProperty('games') && typeof data.games === 'object'
            );
        } else if (data.exportType === 'single-game') {
            return data.hasOwnProperty('gameId') && data.hasOwnProperty('data');
        }

        return false;
    }

    importCompleteData(importData) {
        try {
            let importedGames = 0;
            const importResults = {
                success: true,
                importedGames: 0,
                totalGames: Object.keys(importData.games).length,
                errors: [],
            };

            // Import game data
            Object.entries(importData.games).forEach(([gameId, gameData]) => {
                try {
                    if (this.saveGameProgress(gameId, gameData)) {
                        importedGames++;
                    }
                } catch (error) {
                    importResults.errors.push(
                        `Failed to import ${gameId}: ${error.message}`
                    );
                }
            });

            importResults.importedGames = importedGames;

            // Import global data
            if (importData.global) {
                this.save(STORAGE_KEYS.GLOBAL_PROGRESS, importData.global);
            }

            // Import preferences
            if (importData.preferences) {
                this.save(
                    STORAGE_KEYS.USER_PREFERENCES,
                    importData.preferences
                );
            }

            // Update global progress
            this.updateGlobalProgress();

            return importResults;
        } catch (error) {
            console.error('Complete data import failed:', error);
            throw error;
        }
    }

    importGameData(importData) {
        try {
            const success = this.saveGameProgress(
                importData.gameId,
                importData.data
            );

            if (success) {
                this.updateGlobalProgress();
                return {
                    success: true,
                    gameId: importData.gameId,
                    totalSteps: importData.data.totalSteps || 0,
                    completedSteps: importData.data.completedSteps || 0,
                };
            }

            throw new Error('Failed to save imported game data');
        } catch (error) {
            console.error('Game data import failed:', error);
            throw error;
        }
    }

    createFullBackup() {
        const timestamp = new Date().toISOString();
        const backupKey = `full_backup_${timestamp}`;

        try {
            const fullBackup = this.exportAllData();
            localStorage.setItem(backupKey, JSON.stringify(fullBackup));

            // Update last backup timestamp
            this.save(STORAGE_KEYS.LAST_BACKUP, timestamp);

            return true;
        } catch (error) {
            console.error('Full backup creation failed:', error);
            return false;
        }
    }
}
```

## Storage Optimization

```javascript
class StorageOptimizer extends DataExportImportManager {
    // Simple compression for large datasets
    compress(data) {
        // Basic compression: remove whitespace and use shorter keys
        return data
            .replace(/\s+/g, '')
            .replace(/"completed"/g, '"c"')
            .replace(/"timestamp"/g, '"t"')
            .replace(/"pokemon"/g, '"p"')
            .replace(/"location"/g, '"l"')
            .replace(/"category"/g, '"cat"')
            .replace(/"tags"/g, '"tg"');
    }

    decompress(data) {
        // Reverse compression
        return data
            .replace(/"c"/g, '"completed"')
            .replace(/"t"/g, '"timestamp"')
            .replace(/"p"/g, '"pokemon"')
            .replace(/"l"/g, '"location"')
            .replace(/"cat"/g, '"category"')
            .replace(/"tg"/g, '"tags"');
    }

    // Storage usage monitoring
    getStorageUsage() {
        let totalSize = 0;
        const usage = {};

        for (let key in localStorage) {
            if (
                localStorage.hasOwnProperty(key) &&
                key.startsWith('pokemon_walkthrough')
            ) {
                const size = new Blob([localStorage[key]]).size;
                totalSize += size;
                usage[key] = {
                    size,
                    sizeKB: (size / 1024).toFixed(2),
                    timestamp: localStorage.getItem(`${key}_timestamp`),
                };
            }
        }

        return {
            totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            usage,
            maxSize: this.storageQuota,
            percentUsed: ((totalSize / this.storageQuota) * 100).toFixed(1),
            itemCount: Object.keys(usage).length,
        };
    }

    // Clean up old or unnecessary data
    cleanupStorage() {
        const currentTime = new Date().getTime();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

        let cleanedItems = 0;
        let reclaimedSpace = 0;

        for (let key in localStorage) {
            if (
                localStorage.hasOwnProperty(key) &&
                key.startsWith('pokemon_walkthrough')
            ) {
                let shouldDelete = false;

                // Clean old backups
                if (key.includes('_backup_')) {
                    const timestampMatch = key.match(/_backup_(\d+)$/);
                    if (timestampMatch) {
                        const backupTime = parseInt(timestampMatch[1]);
                        if (currentTime - backupTime > maxAge) {
                            shouldDelete = true;
                        }
                    }
                }

                // Clean temporary data
                if (key.includes('temp') || key.includes('cache')) {
                    const timestamp = localStorage.getItem(`${key}_timestamp`);
                    if (timestamp) {
                        const itemTime = new Date(timestamp).getTime();
                        if (currentTime - itemTime > maxAge) {
                            shouldDelete = true;
                        }
                    }
                }

                if (shouldDelete) {
                    const size = new Blob([localStorage[key]]).size;
                    localStorage.removeItem(key);
                    localStorage.removeItem(`${key}_timestamp`);
                    cleanedItems++;
                    reclaimedSpace += size;
                }
            }
        }

        return {
            cleanedItems,
            reclaimedSpace,
            reclaimedSpaceKB: (reclaimedSpace / 1024).toFixed(2),
            reclaimedSpaceMB: (reclaimedSpace / (1024 * 1024)).toFixed(2),
        };
    }

    // Handle storage quota errors
    handleStorageError(error, key, data) {
        if (error.name === 'QuotaExceededError') {
            console.warn('Storage quota exceeded, attempting cleanup...');

            // Try cleanup first
            const cleanupResult = this.cleanupStorage();

            if (cleanupResult.cleanedItems > 0) {
                // Retry save after cleanup
                try {
                    localStorage.setItem(key, JSON.stringify(data));
                    console.info(
                        `Save succeeded after cleaning ${cleanupResult.cleanedItems} items`
                    );
                    return true;
                } catch (retryError) {
                    console.error(
                        'Save still failed after cleanup:',
                        retryError
                    );
                }
            }

            // Show user-friendly error
            this.showStorageFullWarning();
        }

        return false;
    }

    showStorageFullWarning() {
        const usage = this.getStorageUsage();
        const message = `
      Storage space is full! To continue saving progress:
      1. Export your current progress as backup
      2. Clear old game data you no longer need
      3. Try saving again
      
      Current storage usage: ${usage.percentUsed}%
      Total items: ${usage.itemCount}
    `;

        console.warn(message);

        // Emit event for UI to handle
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(
                new CustomEvent('storage:quota-exceeded', {
                    detail: { usage, message },
                })
            );
        }
    }

    // Optimize data structure before saving
    optimizeDataStructure(data) {
        // Remove empty objects and arrays
        const optimized = JSON.parse(
            JSON.stringify(data, (key, value) => {
                if (Array.isArray(value) && value.length === 0)
                    return undefined;
                if (
                    typeof value === 'object' &&
                    value !== null &&
                    Object.keys(value).length === 0
                )
                    return undefined;
                return value;
            })
        );

        return optimized;
    }
}
```

## Data Migration System

```javascript
class DataMigrationManager extends StorageOptimizer {
    migrateDataIfNeeded(data) {
        if (!data || !data.version) {
            // Migrate from legacy format
            return this.migrateLegacyData(data);
        }

        const currentVersion = parseFloat(this.currentVersion);
        const dataVersion = parseFloat(data.version);

        if (dataVersion < currentVersion) {
            return this.migrateToCurrentVersion(data, dataVersion);
        }

        return data;
    }

    migrateLegacyData(data) {
        console.info('Migrating legacy data format...');

        // Convert old structure to new structure
        const migratedData = {
            version: this.currentVersion,
            lastUpdated: new Date().toISOString(),
            steps: {},
            choices: {},
            pokemon: {},
            items: {},
            battles: {},
        };

        // Migrate step completion data
        if (data && typeof data === 'object') {
            Object.entries(data).forEach(([key, value]) => {
                if (typeof value === 'boolean') {
                    // Simple boolean completion
                    migratedData.steps[key] = {
                        completed: value,
                        timestamp: new Date().toISOString(),
                        tags: [],
                    };
                } else if (typeof value === 'object' && value.completed) {
                    // Already structured data
                    migratedData.steps[key] = value;
                }
            });
        }

        console.info(
            `Migrated ${
                Object.keys(migratedData.steps).length
            } steps from legacy format`
        );
        return migratedData;
    }

    migrateToCurrentVersion(data, fromVersion) {
        console.info(
            `Migrating data from version ${fromVersion} to ${this.currentVersion}`
        );

        let migratedData = { ...data };

        // Version-specific migrations
        if (fromVersion < 1.1) {
            migratedData = this.migrateToV1_1(migratedData);
        }

        if (fromVersion < 1.2) {
            migratedData = this.migrateToV1_2(migratedData);
        }

        // Update version and timestamp
        migratedData.version = this.currentVersion;
        migratedData.lastUpdated = new Date().toISOString();

        console.info(`Migration completed to version ${this.currentVersion}`);
        return migratedData;
    }

    migrateToV1_1(data) {
        console.info('Applying migration to v1.1: Adding encounter tracking');

        // Add encounter tracking to existing Pokemon data
        if (data.pokemon) {
            Object.keys(data.pokemon).forEach(pokemonName => {
                if (!data.pokemon[pokemonName].encounters) {
                    data.pokemon[pokemonName].encounters = [];
                    data.pokemon[pokemonName].totalEncounters = 0;
                }
            });
        }

        return data;
    }

    migrateToV1_2(data) {
        console.info('Applying migration to v1.2: Adding battle tracking');

        // Add battle tracking system
        if (!data.battles) {
            data.battles = {};
        }

        // Convert old trainer battle completions to new battle format
        Object.entries(data.steps || {}).forEach(([stepId, stepData]) => {
            if (stepData.category === 'trainer-battle' && stepData.completed) {
                const battleId = stepId.replace('step-', 'battle-');
                data.battles[battleId] = {
                    completed: true,
                    timestamp: stepData.timestamp,
                    result: 'victory', // Assume victory for completed battles
                };
            }
        });

        return data;
    }

    // Check if migration is needed across all stored data
    checkMigrationNeeded() {
        const migrationStatus = {
            needsMigration: false,
            gamesNeedingMigration: [],
            currentVersion: this.currentVersion,
        };

        // Check all game progress data
        const allGames = ['red', 'blue', 'yellow', 'gold', 'silver', 'crystal'];
        allGames.forEach(gameId => {
            const key = STORAGE_KEYS.GAME_PROGRESS(gameId);
            const data = this.load(key);

            if (data) {
                const dataVersion = parseFloat(data.version || '0.0');
                const currentVersion = parseFloat(this.currentVersion);

                if (dataVersion < currentVersion) {
                    migrationStatus.needsMigration = true;
                    migrationStatus.gamesNeedingMigration.push({
                        gameId,
                        currentVersion: data.version || 'legacy',
                        targetVersion: this.currentVersion,
                    });
                }
            }
        });

        return migrationStatus;
    }

    // Perform bulk migration of all data
    performBulkMigration() {
        const migrationStatus = this.checkMigrationNeeded();

        if (!migrationStatus.needsMigration) {
            console.info('No migration needed - all data is current');
            return { success: true, migratedGames: 0 };
        }

        console.info(
            `Starting migration for ${migrationStatus.gamesNeedingMigration.length} games`
        );

        // Create full backup before migration
        this.createFullBackup();

        const results = {
            success: true,
            migratedGames: 0,
            errors: [],
        };

        migrationStatus.gamesNeedingMigration.forEach(
            ({ gameId, currentVersion }) => {
                try {
                    console.info(
                        `Migrating ${gameId} from version ${currentVersion}`
                    );

                    const gameData = this.loadGameProgress(gameId);
                    const migratedData = this.migrateDataIfNeeded(gameData);

                    if (this.saveGameProgress(gameId, migratedData)) {
                        results.migratedGames++;
                        console.info(`Successfully migrated ${gameId}`);
                    } else {
                        throw new Error('Failed to save migrated data');
                    }
                } catch (error) {
                    console.error(`Migration failed for ${gameId}:`, error);
                    results.errors.push(`${gameId}: ${error.message}`);
                    results.success = false;
                }
            }
        );

        console.info(
            `Migration completed: ${results.migratedGames} games migrated, ${results.errors.length} errors`
        );
        return results;
    }
}
```

## Usage Examples

```javascript
// Initialize the complete data persistence system
const dataManager = new DataMigrationManager();

// Check for needed migrations on startup
document.addEventListener('DOMContentLoaded', async () => {
    const migrationStatus = dataManager.checkMigrationNeeded();

    if (migrationStatus.needsMigration) {
        console.info('Data migration required');
        const results = dataManager.performBulkMigration();

        if (results.success) {
            console.info(
                `Migration completed successfully for ${results.migratedGames} games`
            );
        } else {
            console.error('Migration had errors:', results.errors);
        }
    }

    // Load current game
    await dataManager.loadGameProgress('red');
});

// Save progress with automatic backup
dataManager.saveGameProgress('red', gameProgressData);

// Monitor storage usage
setInterval(() => {
    const usage = dataManager.getStorageUsage();
    if (parseFloat(usage.percentUsed) > 80) {
        console.warn('Storage usage high:', usage.percentUsed + '%');

        // Suggest cleanup
        const cleanupResult = dataManager.cleanupStorage();
        if (cleanupResult.cleanedItems > 0) {
            console.info(
                `Cleaned up ${cleanupResult.cleanedItems} items, reclaimed ${cleanupResult.reclaimedSpaceKB}KB`
            );
        }
    }
}, 60000); // Check every minute

// Export/Import handlers
document.getElementById('export-btn').addEventListener('click', () => {
    try {
        dataManager.exportAllData();
        console.log('Export completed successfully');
    } catch (error) {
        console.error('Export failed:', error);
    }
});

document
    .getElementById('import-file')
    .addEventListener('change', async event => {
        const file = event.target.files[0];
        if (file) {
            try {
                const result = await dataManager.importData(file);
                console.log('Import completed:', result);
            } catch (error) {
                console.error('Import failed:', error);
            }
        }
    });
```

This comprehensive data persistence strategy ensures reliable, scalable, and maintainable data storage while providing robust backup, migration, and optimization capabilities.
