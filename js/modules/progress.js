/**
 * Progress Tracker - Handles user progress tracking and persistence
 * Manages completion state for walkthrough steps, Pokemon encounters, etc.
 */

export class ProgressTracker {
    constructor(eventEmitter, storage) {
        this.eventEmitter = eventEmitter;
        this.storage = storage;
        this.currentGame = null;
        this.progress = {
            games: {},
            global: {
                totalSteps: 0,
                completedSteps: 0,
                pokemonCaught: 0,
                achievements: []
            }
        };
    }
    
    /**
     * Initialize the progress tracker
     */
    async init() {
        console.log('📊 Initializing progress tracker...');
        
        // Load existing progress
        await this.loadProgress();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('✅ Progress tracker initialized');
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for step completion events
        this.eventEmitter.on('step:completed', (data) => {
            this.markStepCompleted(data.stepId, data.gameId);
        });
        
        // Listen for Pokemon catch events
        this.eventEmitter.on('pokemon:caught', (data) => {
            this.markPokemonCaught(data.pokemonId, data.gameId, data.location);
        });
        
        // Auto-save progress periodically
        setInterval(() => {
            this.saveProgress();
        }, 30000); // Save every 30 seconds
    }
    
    /**
     * Set the current game
     */
    setCurrentGame(gameId) {
        this.currentGame = gameId;
        
        // Initialize game progress if it doesn't exist
        if (!this.progress.games[gameId]) {
            this.progress.games[gameId] = {
                steps: {},
                pokemon: {},
                items: {},
                battles: {},
                startTime: Date.now(),
                lastPlayed: Date.now()
            };
        }
        
        // Update last played time
        this.progress.games[gameId].lastPlayed = Date.now();
        
        // Emit game changed event
        this.eventEmitter.emit('progress:gameChanged', { gameId });
    }
    
    /**
     * Mark a step as completed
     */
    markStepCompleted(stepId, gameId = null) {
        const targetGame = gameId || this.currentGame;
        if (!targetGame) return false;
        
        // Initialize game progress if needed
        if (!this.progress.games[targetGame]) {
            this.setCurrentGame(targetGame);
        }
        
        const gameProgress = this.progress.games[targetGame];
        
        // Mark step as completed if not already
        if (!gameProgress.steps[stepId]) {
            gameProgress.steps[stepId] = {
                completed: true,
                timestamp: Date.now()
            };
            
            // Update global counters
            this.progress.global.completedSteps++;
            
            // Emit completion event
            this.eventEmitter.emit('progress:stepCompleted', {
                stepId,
                gameId: targetGame,
                progress: this.getGameProgress(targetGame)
            });
            
            // Auto-save
            this.saveProgress();
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Mark a step as uncompleted
     */
    markStepUncompleted(stepId, gameId = null) {
        const targetGame = gameId || this.currentGame;
        if (!targetGame) return false;
        
        const gameProgress = this.progress.games[targetGame];
        if (!gameProgress) return false;
        
        // Unmark step if it was completed
        if (gameProgress.steps[stepId]) {
            delete gameProgress.steps[stepId];
            
            // Update global counters
            this.progress.global.completedSteps--;
            
            // Emit uncompleted event
            this.eventEmitter.emit('progress:stepUncompleted', {
                stepId,
                gameId: targetGame,
                progress: this.getGameProgress(targetGame)
            });
            
            // Auto-save
            this.saveProgress();
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if a step is completed
     */
    isStepCompleted(stepId, gameId = null) {
        const targetGame = gameId || this.currentGame;
        if (!targetGame) return false;
        
        const gameProgress = this.progress.games[targetGame];
        return gameProgress?.steps[stepId]?.completed ?? false;
    }
    
    /**
     * Mark a Pokemon as caught
     */
    markPokemonCaught(pokemonId, gameId = null, location = null) {
        const targetGame = gameId || this.currentGame;
        if (!targetGame) return false;
        
        // Initialize game progress if needed
        if (!this.progress.games[targetGame]) {
            this.setCurrentGame(targetGame);
        }
        
        const gameProgress = this.progress.games[targetGame];
        
        // Mark Pokemon as caught if not already
        if (!gameProgress.pokemon[pokemonId]) {
            gameProgress.pokemon[pokemonId] = {
                caught: true,
                timestamp: Date.now(),
                location: location,
                firstCatch: true
            };
            
            // Update global counter
            this.progress.global.pokemonCaught++;
            
            // Emit caught event
            this.eventEmitter.emit('progress:pokemonCaught', {
                pokemonId,
                gameId: targetGame,
                location,
                progress: this.getGameProgress(targetGame)
            });
            
            // Auto-save
            this.saveProgress();
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Get progress for a specific game
     */
    getGameProgress(gameId) {
        const gameProgress = this.progress.games[gameId];
        if (!gameProgress) {
            return {
                stepsCompleted: 0,
                totalSteps: 0,
                pokemonCaught: 0,
                completionPercent: 0
            };
        }
        
        const stepsCompleted = Object.keys(gameProgress.steps).length;
        const pokemonCaught = Object.keys(gameProgress.pokemon).length;
        
        // Calculate total steps based on game data when available
        // For now, use estimated totals per game until data files are loaded
        const estimatedTotalSteps = this.getEstimatedTotalSteps(gameId);
        
        return {
            stepsCompleted,
            totalSteps: estimatedTotalSteps,
            pokemonCaught,
            completionPercent: estimatedTotalSteps > 0 ? Math.round((stepsCompleted / estimatedTotalSteps) * 100) : 0
        };
    }
    
    /**
     * Get estimated total steps for a game
     * NOTE: This will be replaced with actual data when game files are loaded
     */
    getEstimatedTotalSteps(gameId) {
        // Estimated step counts based on typical Pokemon game walkthroughs
        const estimatedSteps = {
            'red': 150,
            'blue': 150,
            'yellow': 165
        };
        
        return estimatedSteps[gameId] || 100;
    }
    
    /**
     * Get overall progress across all games
     */
    getOverallProgress() {
        let totalStepsCompleted = 0;
        let totalPokemonCaught = 0;
        let totalSteps = 0;
        
        Object.keys(this.progress.games).forEach(gameId => {
            const gameProgress = this.getGameProgress(gameId);
            totalStepsCompleted += gameProgress.stepsCompleted;
            totalPokemonCaught += gameProgress.pokemonCaught;
            totalSteps += gameProgress.totalSteps;
        });
        
        return {
            stepsCompleted: totalStepsCompleted,
            totalSteps: totalSteps,
            pokemonCaught: totalPokemonCaught,
            completionPercent: totalSteps > 0 ? Math.round((totalStepsCompleted / totalSteps) * 100) : 0
        };
    }
    
    /**
     * Save progress to storage
     */
    saveProgress() {
        try {
            this.storage.setItem('userProgress', this.progress);
            
            // Also create a backup
            this.storage.backupCriticalData(this.progress, 'progressBackup');
            
            console.log('💾 Progress saved');
            return true;
        } catch (error) {
            console.error('Failed to save progress:', error);
            return false;
        }
    }
    
    /**
     * Load progress from storage
     */
    async loadProgress() {
        try {
            const savedProgress = this.storage.getItem('userProgress');
            
            if (savedProgress) {
                // Merge with default structure to handle version differences
                this.progress = {
                    ...this.progress,
                    ...savedProgress,
                    global: {
                        ...this.progress.global,
                        ...savedProgress.global
                    }
                };
                
                console.log('📥 Progress loaded');
            } else {
                console.log('📝 No saved progress found, starting fresh');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to load progress:', error);
            
            // Try to restore from backup
            const backup = this.storage.restoreFromBackup('progressBackup');
            if (backup) {
                this.progress = backup;
                console.log('🔄 Progress restored from backup');
                return true;
            }
            
            return false;
        }
    }
    
    /**
     * Export progress data
     */
    async exportProgress() {
        return {
            version: '1.0',
            timestamp: Date.now(),
            progress: this.progress
        };
    }
    
    /**
     * Import progress data
     */
    async importProgress(importData) {
        try {
            if (!importData.progress) {
                throw new Error('Invalid import data format');
            }
            
            // Backup current progress before importing
            this.storage.setItem('progressBackupBeforeImport', this.progress);
            
            // Import new progress
            this.progress = importData.progress;
            
            // Save imported progress
            this.saveProgress();
            
            // Emit import complete event
            this.eventEmitter.emit('progress:imported');
            
            return true;
        } catch (error) {
            console.error('Failed to import progress:', error);
            return false;
        }
    }
    
    /**
     * Reset all progress
     */
    async resetProgress() {
        try {
            // Backup current progress before resetting
            this.storage.setItem('progressBackupBeforeReset', this.progress);
            
            // Reset to initial state
            this.progress = {
                games: {},
                global: {
                    totalSteps: 0,
                    completedSteps: 0,
                    pokemonCaught: 0,
                    achievements: []
                }
            };
            
            // Save reset progress
            this.saveProgress();
            
            // Emit reset event
            this.eventEmitter.emit('progress:reset');
            
            return true;
        } catch (error) {
            console.error('Failed to reset progress:', error);
            return false;
        }
    }
    
    /**
     * Get completion statistics
     */
    getStats() {
        const stats = {
            totalGamesStarted: Object.keys(this.progress.games).length,
            totalPlayTime: 0,
            completionRates: {},
            recentActivity: []
        };
        
        // Calculate stats for each game
        Object.entries(this.progress.games).forEach(([gameId, gameData]) => {
            const gameProgress = this.getGameProgress(gameId);
            stats.completionRates[gameId] = gameProgress.completionPercent;
            
            if (gameData.startTime && gameData.lastPlayed) {
                stats.totalPlayTime += gameData.lastPlayed - gameData.startTime;
            }
        });
        
        return stats;
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        // Save progress one last time
        this.saveProgress();
        
        console.log('🧹 Progress tracker cleaned up');
    }
}
