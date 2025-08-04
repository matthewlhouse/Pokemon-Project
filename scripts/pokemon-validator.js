/**
 * Pokemon Validation System with Granular In-Game Field Validation
 * Validates pokemon-base.json against external sources with field-level in-game validation
 */

const fs = require('fs').promises;
const path = require('path');
const ServerPokemonDataFetcher = require('./server-data-fetcher.js');

class PokemonValidator {
    constructor() {
        this.fetcher = new ServerPokemonDataFetcher();
        this.pokemonData = null;
        this.validationResults = [];
        this.progressCallback = null;
        this.acceptedIssues = new Map(); // Pokemon ID -> Set of accepted issue signatures
        this.inGameValidated = new Map(); // Pokemon ID -> Set of validated field names
        this.validationStatistics = new Map(); // Pokemon ID -> validation statistics
    }

    /**
     * Load validation data (accepted issues and in-game validation status)
     */
    async loadValidationData() {
        await this.loadAcceptedIssues();
        await this.loadInGameValidation();
        await this.loadValidationStatistics();
    }

    /**
     * Load in-game validation status from file
     */
    async loadInGameValidation() {
        const inGamePath = path.join(__dirname, '..', 'data', 'in-game-validated.json');

        try {
            const rawData = await fs.readFile(inGamePath, 'utf8');
            const inGameData = JSON.parse(rawData);

            this.inGameValidated.clear();
            for (const pokemonEntry of inGameData.validated) {
                if (pokemonEntry.fields) {
                    // New granular format: Pokemon ID -> Set of field names
                    this.inGameValidated.set(pokemonEntry.id, new Set(pokemonEntry.fields));
                } else {
                    // Legacy format: Pokemon was validated entirely
                    // Convert to all fields being validated
                    const allFields = [
                        'name',
                        'species',
                        'types',
                        'baseStats',
                        'height',
                        'weight',
                        'growthRate',
                        'baseExp',
                        'catchRate',
                        'effortValues',
                        'evolutionChain',
                        'learnset',
                        'tmCompatibility',
                        'pokedexEntry',
                    ];
                    this.inGameValidated.set(pokemonEntry.id, new Set(allFields));
                }
            }

            return true;
        } catch (error) {
            // No in-game validation file found - this is expected for new setups
            // Log for debugging but don't treat as an error
            if (error.code !== 'ENOENT') {
                console.warn('⚠️ Error loading in-game validation:', error.message);
            }
            return false;
        }
    }

    /**
     * Save in-game validation status to file
     */
    async saveInGameValidation() {
        const inGamePath = path.join(__dirname, '..', 'data', 'in-game-validated.json');
        const inGameData = {
            metadata: {
                description: 'Pokemon fields that have been validated in-game',
                lastUpdated: new Date().toISOString(),
            },
            validated: Array.from(this.inGameValidated.entries()).map(([pokemonId, fields]) => {
                const pokemon = this.pokemonData?.pokemon[pokemonId];
                return {
                    id: pokemonId,
                    name: pokemon?.name || `Pokemon #${pokemonId}`,
                    fields: Array.from(fields),
                    lastUpdated: new Date().toISOString(),
                };
            }),
        };

        await fs.writeFile(inGamePath, JSON.stringify(inGameData, null, 2), 'utf8');
    }

    /**
     * Set a specific field as validated in-game for a Pokemon
     */
    setInGameValidated(pokemonId, fieldName) {
        if (!this.inGameValidated.has(pokemonId)) {
            this.inGameValidated.set(pokemonId, new Set());
        }
        this.inGameValidated.get(pokemonId).add(fieldName);
    }

    /**
     * Remove in-game validation for a specific field of a Pokemon
     */
    removeInGameValidated(pokemonId, fieldName) {
        if (this.inGameValidated.has(pokemonId)) {
            this.inGameValidated.get(pokemonId).delete(fieldName);
            // If no fields are validated, remove the Pokemon entirely
            if (this.inGameValidated.get(pokemonId).size === 0) {
                this.inGameValidated.delete(pokemonId);
            }
        }
    }

    /**
     * Check if a specific field has been validated in-game for a Pokemon
     */
    isInGameValidated(pokemonId, fieldName) {
        return (
            this.inGameValidated.has(pokemonId) &&
            this.inGameValidated.get(pokemonId).has(fieldName)
        );
    }

    /**
     * Get all in-game validated fields for a Pokemon
     */
    getInGameValidatedFields(pokemonId) {
        return this.inGameValidated.get(pokemonId) || new Set();
    }

    /**
     * Load validation statistics from file
     */
    async loadValidationStatistics() {
        const statsPath = path.join(__dirname, '..', 'data', 'validation-statistics.json');

        try {
            const rawData = await fs.readFile(statsPath, 'utf8');
            const statsData = JSON.parse(rawData);

            this.validationStatistics.clear();
            for (const pokemonEntry of statsData.statistics) {
                this.validationStatistics.set(pokemonEntry.id, {
                    completeness: pokemonEntry.completeness,
                    lastValidated: pokemonEntry.lastValidated,
                    fieldValidation: pokemonEntry.fieldValidation,
                    externalAccuracy: pokemonEntry.externalAccuracy,
                    inGameValidation: pokemonEntry.inGameValidation,
                    totalIssues: pokemonEntry.totalIssues,
                    acceptedIssues: pokemonEntry.acceptedIssues,
                });
            }

            return true;
        } catch (error) {
            // No validation statistics file found - this is expected for new setups
            // Log for debugging but don't treat as an error
            if (error.code !== 'ENOENT') {
                console.warn('⚠️ Error loading validation statistics:', error.message);
            }
            return false;
        }
    }

    /**
     * Save validation statistics to file
     */
    async saveValidationStatistics() {
        const statsPath = path.join(__dirname, '..', 'data', 'validation-statistics.json');
        const statsData = {
            metadata: {
                description: 'Pokemon validation statistics and field-level validation status',
                lastUpdated: new Date().toISOString(),
                validationSystem: 'Granular Field Validation (75% external + 25% in-game)',
            },
            statistics: Array.from(this.validationStatistics.entries()).map(
                ([pokemonId, stats]) => {
                    const pokemon = this.pokemonData?.pokemon[pokemonId];
                    return {
                        id: pokemonId,
                        name: pokemon?.name || `Pokemon #${pokemonId}`,
                        completeness: stats.completeness,
                        lastValidated: stats.lastValidated,
                        fieldValidation: stats.fieldValidation,
                        externalAccuracy: stats.externalAccuracy,
                        inGameValidation: stats.inGameValidation,
                        totalIssues: stats.totalIssues,
                        acceptedIssues: stats.acceptedIssues,
                    };
                }
            ),
        };

        await fs.writeFile(statsPath, JSON.stringify(statsData, null, 2), 'utf8');
    }

    /**
     * Update validation statistics for a Pokemon
     */
    updateValidationStatistics(pokemonId, validationResult, pokemon, externalData) {
        const requiredFields = [
            'name',
            'species',
            'types',
            'baseStats',
            'height',
            'weight',
            'growthRate',
            'baseExp',
            'catchRate',
            'effortValues',
            'evolutionChain',
            'learnset',
            'tmCompatibility',
            'pokedexEntry',
        ];

        const fieldValidation = this.calculateFieldValidation(
            pokemonId,
            validationResult,
            requiredFields
        );
        const accurateFields = this.countAccurateFields(fieldValidation);
        const validationScores = this.calculateValidationScores(
            accurateFields,
            requiredFields.length,
            pokemonId
        );

        this.storeValidationStatistics(
            pokemonId,
            fieldValidation,
            validationScores,
            validationResult
        );
    }

    /**
     * Calculate field validation status for all required fields
     */
    calculateFieldValidation(pokemonId, validationResult, requiredFields) {
        const fieldValidation = {};
        const inGameValidatedFields = this.getInGameValidatedFields(pokemonId);

        for (const field of requiredFields) {
            const fieldData = this.processFieldValidation(
                pokemonId,
                field,
                validationResult,
                inGameValidatedFields
            );
            fieldValidation[field] = fieldData;
        }

        return fieldValidation;
    }

    /**
     * Process validation status for a single field
     */
    processFieldValidation(pokemonId, field, validationResult, inGameValidatedFields) {
        const isInGameValidated = inGameValidatedFields.has(field);
        const hasAcceptedIssue = this.hasAcceptedIssueForField(pokemonId, field);
        const fieldIssue = validationResult.issues.find(issue => issue.field === field);

        const status = this.determineFieldStatus(fieldIssue, hasAcceptedIssue, isInGameValidated);
        const isAccurate = !fieldIssue;

        return {
            accurate: isAccurate,
            inGameValidated: isInGameValidated,
            hasAcceptedIssue: hasAcceptedIssue,
            status: status,
        };
    }

    /**
     * Determine the validation status for a field
     */
    determineFieldStatus(fieldIssue, hasAcceptedIssue, isInGameValidated) {
        if (!fieldIssue) {
            return 'accurate';
        }

        if (hasAcceptedIssue) {
            return 'accepted_override';
        }

        if (fieldIssue.severity === 'no_reference' && isInGameValidated) {
            return 'in_game_validated';
        }

        return fieldIssue.severity;
    }

    /**
     * Count fields that are considered accurate (naturally accurate or have accepted issues)
     */
    countAccurateFields(fieldValidation) {
        return Object.values(fieldValidation).filter(
            field => field.accurate || field.hasAcceptedIssue
        ).length;
    }

    /**
     * Calculate validation scores (external + in-game)
     */
    calculateValidationScores(accurateFields, totalFields, pokemonId) {
        const inGameValidatedFields = this.getInGameValidatedFields(pokemonId);

        const externalAccuracy = (accurateFields / totalFields) * 0.75;
        const inGameValidation = (inGameValidatedFields.size / totalFields) * 0.25;
        const totalCompleteness = externalAccuracy + inGameValidation;

        return {
            externalAccuracy: Math.round(externalAccuracy * 100),
            inGameValidation: Math.round(inGameValidation * 100),
            completeness: Math.round(totalCompleteness * 100),
        };
    }

    /**
     * Store validation statistics in the map
     */
    storeValidationStatistics(pokemonId, fieldValidation, validationScores, validationResult) {
        this.validationStatistics.set(pokemonId, {
            completeness: validationScores.completeness,
            lastValidated: new Date().toISOString(),
            fieldValidation: fieldValidation,
            externalAccuracy: validationScores.externalAccuracy,
            inGameValidation: validationScores.inGameValidation,
            totalIssues: validationResult.totalIssues || 0,
            acceptedIssues: validationResult.acceptedIssues || 0,
        });
    }

    /**
     * Check if a field has an accepted issue
     */
    hasAcceptedIssueForField(pokemonId, fieldName) {
        const acceptedSignatures = this.acceptedIssues.get(pokemonId);
        if (!acceptedSignatures) return false;

        // Check if any accepted signature matches this field
        for (const signature of acceptedSignatures) {
            if (signature.startsWith(`${fieldName}:`)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get field validation status description
     */
    getFieldValidationStatus(isAccurate, isInGameValidated, hasAcceptedIssue) {
        if (isAccurate) {
            return 'accurate';
        } else if (hasAcceptedIssue) {
            return 'accepted_override';
        } else if (isInGameValidated) {
            return 'in_game_validated';
        } else {
            return 'inaccurate';
        }
    }

    /**
     * Get validation statistics for a Pokemon
     */
    getValidationStatistics(pokemonId) {
        return this.validationStatistics.get(pokemonId) || null;
    }

    /**
     * Load accepted issues from file
     */
    async loadAcceptedIssues() {
        const acceptedPath = path.join(__dirname, '..', 'data', 'accepted-issues.json');

        try {
            const rawData = await fs.readFile(acceptedPath, 'utf8');
            const acceptedData = JSON.parse(rawData);

            this.acceptedIssues.clear();
            for (const [pokemonId, pokemonData] of Object.entries(acceptedData)) {
                const signatures = pokemonData.acceptedIssues.map(issue => issue.signature);
                this.acceptedIssues.set(pokemonId, new Set(signatures));
            }

            return true;
        } catch (error) {
            // No accepted issues file found - this is expected for new setups
            // Log for debugging but don't treat as an error
            if (error.code !== 'ENOENT') {
                console.warn('⚠️ Error loading accepted issues:', error.message);
            }
            return false;
        }
    }

    /**
     * Save accepted issues to file
     */
    async saveAcceptedIssues() {
        const acceptedPath = path.join(__dirname, '..', 'data', 'accepted-issues.json');
        const acceptedData = {};

        for (const [pokemonId, signatures] of this.acceptedIssues.entries()) {
            const pokemon = this.pokemonData?.pokemon[pokemonId];
            acceptedData[pokemonId] = {
                name: pokemon?.name || `Pokemon #${pokemonId}`,
                acceptedIssues: Array.from(signatures).map(sig => ({
                    signature: sig,
                    acceptedAt: new Date().toISOString(),
                })),
            };
        }

        await fs.writeFile(acceptedPath, JSON.stringify(acceptedData, null, 2), 'utf8');
    }

    /**
     * Accept a specific issue for a Pokemon
     */
    acceptIssue(pokemonId, issueSignature, reason = '') {
        if (!this.acceptedIssues.has(pokemonId)) {
            this.acceptedIssues.set(pokemonId, new Set());
        }

        this.acceptedIssues.get(pokemonId).add(issueSignature);
    }

    /**
     * Remove an accepted issue
     */
    removeAcceptedIssue(pokemonId, issueSignature) {
        const pokemonAccepted = this.acceptedIssues.get(pokemonId);
        if (pokemonAccepted) {
            pokemonAccepted.delete(issueSignature);
            if (pokemonAccepted.size === 0) {
                this.acceptedIssues.delete(pokemonId);
            }
        }
    }

    /**
     * Generate a unique signature for an issue
     */
    generateIssueSignature(issue) {
        return `${issue.field}:${issue.severity}:${JSON.stringify(issue.current)}`;
    }

    /**
     * Check if an issue has been accepted
     */
    isIssueAccepted(pokemonId, issue) {
        const signature = this.generateIssueSignature(issue);
        return this.acceptedIssues.get(pokemonId)?.has(signature) || false;
    }

    /**
     * Set progress callback for UI updates
     */
    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    /**
     * Load pokemon-base.json
     */
    async loadPokemonData() {
        const dataPath = path.join(__dirname, '..', 'data', 'shared', 'pokemon-base.json');
        const rawData = await fs.readFile(dataPath, 'utf8');
        this.pokemonData = JSON.parse(rawData);
        return this.pokemonData;
    }

    /**
     * Determine if a Pokemon needs validation
     */
    needsValidation(pokemon, pokemonId) {
        // Must have name filled out
        return !(!pokemon.name || pokemon.name.trim() === '');
    }

    /**
     * Get list of Pokemon that need validation
     */
    getPokemonNeedingValidation() {
        if (!this.pokemonData) return [];

        const needsValidation = [];

        for (const [id, pokemon] of Object.entries(this.pokemonData.pokemon)) {
            if (this.needsValidation(pokemon, id)) {
                needsValidation.push({
                    id,
                    name: pokemon.name,
                    completeness: 0, // Will be calculated after external data fetch
                    pokemon,
                });
            }
        }

        return needsValidation;
    }

    /**
     * Validate a single Pokemon against external sources
     */
    async validatePokemon(pokemonId, pokemon) {
        const result = {
            id: pokemonId,
            name: pokemon.name,
            timestamp: new Date().toISOString(),
            completeness: 0, // Will be calculated after external data fetch
            issues: [],
            suggestions: [],
            externalData: {},
            status: 'processing',
            acceptedIssues: 0,
        };

        try {
            // Fetch from external sources
            const externalData = await this.fetcher.fetchAndValidatePokemon(
                pokemonId,
                pokemon.name
            );
            result.externalData = externalData;

            // Compare and identify issues
            this.compareWithExternalSources(pokemon, externalData, result);

            // Apply accepted issues (mark them as accepted)
            this.applyAcceptedIssues(pokemonId, result);

            // Update validation statistics first to get accurate completeness calculation
            this.updateValidationStatistics(pokemonId, result, pokemon, externalData);

            // Use the completeness from validation statistics (which accounts for partial matches correctly)
            const stats = this.getValidationStatistics(pokemonId);
            result.completeness = stats ? stats.completeness : 0;

            result.status = 'completed';
            result.totalIssues = result.issues.filter(issue => !issue.accepted).length;
        } catch (error) {
            result.status = 'error';
            result.error = error.message;
            result.issues.push({
                field: 'external_fetch',
                severity: 'error',
                message: `Failed to fetch external data: ${error.message}`,
            });
        }

        return result;
    }

    /**
     * Apply accepted issues to validation results
     */
    applyAcceptedIssues(pokemonId, result) {
        let acceptedCount = 0;

        result.issues.forEach(issue => {
            if (this.isIssueAccepted(pokemonId, issue)) {
                issue.accepted = true;
                issue.acceptedAt = new Date().toISOString();
                acceptedCount++;
            }
        });

        result.acceptedIssues = acceptedCount;
    }

    /**
     * Calculate completeness considering accepted issues and in-game field validation
     * New system: External validation = 75% max, In-game validation = 25% (field-level)
     */
    calculateCompletenessWithAccepted(pokemon, externalData, pokemonId) {
        if (!externalData) {
            return 0.0;
        }

        const requiredFields = [
            'name',
            'species',
            'types',
            'baseStats',
            'height',
            'weight',
            'growthRate',
            'baseExp',
            'catchRate',
            'effortValues',
            'evolutionChain',
            'learnset',
            'tmCompatibility',
            'pokedexEntry',
        ];

        let accurateFields = 0;
        let inGameValidatedFields = 0;

        for (const field of requiredFields) {
            if (this.isFieldAccurate(pokemon, field, externalData)) {
                // Field is naturally accurate
                accurateFields++;
            } else {
                // Check if this field's inaccuracy has been accepted
                const mockIssue = {
                    field: field,
                    severity: 'inaccurate',
                    current: this.getFieldValue(pokemon, field),
                };

                if (this.isIssueAccepted(pokemonId, mockIssue)) {
                    accurateFields++;
                }
            }

            // Check if this field has been validated in-game
            if (this.isInGameValidated(pokemonId, field)) {
                inGameValidatedFields++;
            }
        }

        // External validation: 75% maximum
        const externalScore = (accurateFields / requiredFields.length) * 0.75;

        // In-game validation: 25% maximum (proportional to fields validated)
        const inGameScore = (inGameValidatedFields / requiredFields.length) * 0.25;

        // Total score
        return externalScore + inGameScore;
    }

    /**
     * Check if a specific field is accurate against external sources
     * Returns true for perfect match, false for any mismatch or missing data
     */
    isFieldAccurate(pokemon, field, externalData) {
        const bulbapediaData = externalData.sources?.find(s => s.source === 'bulbapedia')?.data;
        const serebiiData = externalData.sources?.find(s => s.source === 'serebii')?.data;

        // Get the authoritative value (prefer Bulbapedia, fallback to Serebii)
        const authoritativeValue = this.getAuthoritativeValue(field, bulbapediaData, serebiiData);

        if (!authoritativeValue) {
            // No external data to compare against
            return false;
        }

        const currentValue = this.getFieldValue(pokemon, field);

        return this.exactMatch(currentValue, authoritativeValue);
    }

    /**
     * Get authoritative value for a field from external sources
     */
    getAuthoritativeValue(field, bulbapediaData, serebiiData) {
        const bulbapediaValue = bulbapediaData?.[field];
        const serebiiValue = serebiiData?.[field];

        // Prefer Bulbapedia, fallback to Serebii
        return bulbapediaValue !== undefined ? bulbapediaValue : serebiiValue;
    }

    /**
     * Check for exact match between two values
     */
    exactMatch(current, authoritative) {
        if (current === authoritative) return true;

        // Deep comparison for objects and arrays
        if (typeof current === 'object' && typeof authoritative === 'object') {
            return JSON.stringify(current) === JSON.stringify(authoritative);
        }

        return false;
    }

    /**
     * Get field value from Pokemon data (handles nested fields)
     */
    getFieldValue(pokemon, field) {
        switch (field) {
            case 'height':
                return pokemon.height?.meters;
            case 'weight':
                return pokemon.weight?.kg;
            default:
                return pokemon[field];
        }
    }

    /**
     * Compare current data with external sources and identify issues
     */
    compareWithExternalSources(pokemon, externalData, result) {
        const bulbapediaData = externalData.sources?.find(s => s.source === 'bulbapedia')?.data;
        const serebiiData = externalData.sources?.find(s => s.source === 'serebii')?.data;

        // Compare each field for accuracy
        this.compareFieldAccuracy(
            'name',
            pokemon.name,
            bulbapediaData?.name,
            serebiiData?.name,
            result
        );
        this.compareFieldAccuracy(
            'species',
            pokemon.species,
            bulbapediaData?.species,
            serebiiData?.species,
            result
        );
        this.compareFieldAccuracy(
            'types',
            pokemon.types,
            bulbapediaData?.types,
            serebiiData?.types,
            result
        );
        this.compareFieldAccuracy(
            'baseStats',
            pokemon.baseStats,
            bulbapediaData?.baseStats,
            serebiiData?.baseStats,
            result
        );
        this.compareFieldAccuracy(
            'height',
            pokemon.height?.meters,
            bulbapediaData?.height,
            serebiiData?.height,
            result
        );
        this.compareFieldAccuracy(
            'weight',
            pokemon.weight?.kg,
            bulbapediaData?.weight,
            serebiiData?.weight,
            result
        );
        this.compareFieldAccuracy(
            'growthRate',
            pokemon.growthRate,
            bulbapediaData?.growthRate,
            serebiiData?.growthRate,
            result
        );
        this.compareFieldAccuracy(
            'baseExp',
            pokemon.baseExp,
            bulbapediaData?.baseExp,
            serebiiData?.baseExp,
            result
        );
        this.compareFieldAccuracy(
            'catchRate',
            pokemon.catchRate,
            bulbapediaData?.catchRate,
            serebiiData?.catchRate,
            result
        );
        this.compareFieldAccuracy(
            'learnset',
            pokemon.learnset,
            bulbapediaData?.learnset,
            serebiiData?.learnset,
            result
        );
        this.compareFieldAccuracy(
            'tmCompatibility',
            pokemon.tmCompatibility,
            bulbapediaData?.tmCompatibility,
            serebiiData?.tmCompatibility,
            result
        );
        this.compareFieldAccuracy(
            'evolutionChain',
            pokemon.evolutionChain,
            bulbapediaData?.evolutionChain,
            serebiiData?.evolutionChain,
            result
        );
        this.compareFieldAccuracy(
            'effortValues',
            pokemon.effortValues,
            bulbapediaData?.effortValues,
            serebiiData?.effortValues,
            result
        );
        this.compareFieldAccuracy(
            'pokedexEntry',
            pokemon.pokedexEntry,
            bulbapediaData?.pokedexEntry,
            serebiiData?.pokedexEntry,
            result
        );
    }

    /**
     * Compare a field for accuracy - enhanced to detect partial matches
     */
    compareFieldAccuracy(fieldName, currentValue, bulbapediaValue, serebiiValue, result) {
        const sourceInfo = this.analyzeSourceAvailability(bulbapediaValue, serebiiValue);

        if (!sourceInfo.hasAny) {
            this.addNoReferenceIssue(fieldName, currentValue, result);
            return;
        }

        const matchInfo = this.analyzeMatches(
            currentValue,
            bulbapediaValue,
            serebiiValue,
            sourceInfo
        );

        if (sourceInfo.hasBoth) {
            this.handleBothSourcesComparison(
                fieldName,
                currentValue,
                matchInfo,
                bulbapediaValue,
                serebiiValue,
                result
            );
        } else {
            this.handleSingleSourceComparison(
                fieldName,
                currentValue,
                matchInfo,
                sourceInfo,
                result
            );
        }
    }

    /**
     * Analyze source availability
     */
    analyzeSourceAvailability(bulbapediaValue, serebiiValue) {
        const hasBulbapedia = bulbapediaValue !== undefined;
        const hasSerebii = serebiiValue !== undefined;

        return {
            hasBulbapedia,
            hasSerebii,
            hasBoth: hasBulbapedia && hasSerebii,
            hasAny: hasBulbapedia || hasSerebii,
            authoritativeValue: hasBulbapedia ? bulbapediaValue : serebiiValue,
            authoritativeSource: hasBulbapedia ? 'Bulbapedia' : 'Serebii',
        };
    }

    /**
     * Analyze match results against sources
     */
    analyzeMatches(currentValue, bulbapediaValue, serebiiValue, sourceInfo) {
        return {
            matchesBulbapedia: sourceInfo.hasBulbapedia
                ? this.exactMatch(currentValue, bulbapediaValue)
                : null,
            matchesSerebii: sourceInfo.hasSerebii
                ? this.exactMatch(currentValue, serebiiValue)
                : null,
            sourcesAgree: sourceInfo.hasBoth
                ? this.exactMatch(bulbapediaValue, serebiiValue)
                : true,
        };
    }

    /**
     * Handle comparison when both sources are available
     */
    handleBothSourcesComparison(
        fieldName,
        currentValue,
        matchInfo,
        bulbapediaValue,
        serebiiValue,
        result
    ) {
        if (matchInfo.matchesBulbapedia && matchInfo.matchesSerebii) {
            // Perfect match - both sources agree and current value matches
            return;
        }

        if (matchInfo.matchesBulbapedia || matchInfo.matchesSerebii) {
            this.addPartialMatchIssue(
                fieldName,
                currentValue,
                matchInfo,
                bulbapediaValue,
                serebiiValue,
                result
            );
            return;
        }

        // No match to either source
        if (matchInfo.sourcesAgree) {
            this.addInaccurateIssue(
                fieldName,
                currentValue,
                bulbapediaValue,
                'Bulbapedia & Serebii',
                result
            );
        } else {
            this.addSourceConflictIssue(
                fieldName,
                currentValue,
                bulbapediaValue,
                serebiiValue,
                result
            );
        }
    }

    /**
     * Handle comparison when only one source is available
     */
    handleSingleSourceComparison(fieldName, currentValue, matchInfo, sourceInfo, result) {
        const matchesSource = sourceInfo.hasBulbapedia
            ? matchInfo.matchesBulbapedia
            : matchInfo.matchesSerebii;

        if (!matchesSource) {
            this.addInaccurateIssue(
                fieldName,
                currentValue,
                sourceInfo.authoritativeValue,
                sourceInfo.authoritativeSource,
                result
            );
        }
    }

    /**
     * Add no reference data issue
     */
    addNoReferenceIssue(fieldName, currentValue, result) {
        result.issues.push({
            field: fieldName,
            severity: 'no_reference',
            message: `${fieldName} has no external reference data`,
            current: currentValue,
        });
    }

    /**
     * Add partial match issue
     */
    addPartialMatchIssue(
        fieldName,
        currentValue,
        matchInfo,
        bulbapediaValue,
        serebiiValue,
        result
    ) {
        const matchingSource = matchInfo.matchesBulbapedia ? 'Bulbapedia' : 'Serebii';
        const conflictingSource = matchInfo.matchesBulbapedia ? 'Serebii' : 'Bulbapedia';
        const conflictingValue = matchInfo.matchesBulbapedia ? serebiiValue : bulbapediaValue;

        result.issues.push({
            field: fieldName,
            severity: 'partial_match',
            message: `${fieldName} matches ${matchingSource} but conflicts with ${conflictingSource}`,
            current: currentValue,
            matchingSource: matchingSource,
            matchingValue: currentValue,
            conflictingSource: conflictingSource,
            conflictingValue: conflictingValue,
        });
    }

    /**
     * Add inaccurate data issue
     */
    addInaccurateIssue(fieldName, currentValue, expectedValue, source, result) {
        result.issues.push({
            field: fieldName,
            severity: 'inaccurate',
            message: `${fieldName} does not match ${source}`,
            current: currentValue,
            expected: expectedValue,
            source: source,
        });

        result.suggestions.push({
            field: fieldName,
            action: 'correct',
            value: expectedValue,
            source: source === 'Bulbapedia & Serebii' ? 'Both sources' : source,
        });
    }

    /**
     * Add source conflict issue
     */
    addSourceConflictIssue(fieldName, currentValue, bulbapediaValue, serebiiValue, result) {
        result.issues.push({
            field: fieldName,
            severity: 'source_conflict',
            message: `${fieldName} conflicts - external sources disagree and current value matches neither`,
            current: currentValue,
            bulbapediaValue: bulbapediaValue,
            serebiiValue: serebiiValue,
        });
    }

    /**
     * Validate multiple Pokemon with progress tracking
     */
    async validateMultiplePokemon(pokemonList) {
        const results = [];
        const total = pokemonList.length;

        for (let i = 0; i < total; i++) {
            const { id, pokemon } = pokemonList[i];

            if (this.progressCallback) {
                this.progressCallback({
                    current: i + 1,
                    total,
                    pokemon: pokemon.name,
                    status: 'validating',
                });
            }

            const result = await this.validatePokemon(id, pokemon);
            results.push(result);

            // Rate limiting delay
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        this.validationResults = results;

        // Save validation statistics after all validations complete
        await this.saveValidationStatistics();

        return results;
    }

    /**
     * Generate HTML validation report
     */
    async generateHTMLReport(results, outputPath) {
        const html = this.createHTMLReport(results);
        await fs.writeFile(outputPath, html, 'utf8');
        return outputPath;
    }

    /**
     * Create HTML report content
     */
    createHTMLReport(results) {
        const timestamp = new Date().toLocaleString();
        const totalPokemon = results.length;
        const totalIssues = results.reduce((sum, r) => sum + (r.totalIssues || 0), 0);

        // Calculate validation level statistics
        const fullyValidated = results.filter(r => r.completeness >= 100).length;
        const highlyValidated = results.filter(r => r.completeness >= 75).length;
        const lowValidated = results.filter(r => r.completeness < 75).length;

        const severityCounts = results.reduce((counts, r) => {
            if (r.issues) {
                r.issues.forEach(issue => {
                    counts[issue.severity] = (counts[issue.severity] || 0) + 1;
                });
            }
            return counts;
        }, {});

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pokemon Validation Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .controls {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .controls h3 {
            margin: 0 0 15px 0;
            color: #333;
        }
        .filter-group {
            margin-bottom: 15px;
        }
        .filter-group label {
            display: block;
            font-weight: bold;
            margin-bottom: 8px;
            color: #555;
        }
        .filter-buttons {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .filter-btn {
            padding: 8px 16px;
            border: 2px solid #ddd;
            background: #f8f9fa;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 14px;
            user-select: none;
        }
        .filter-btn:hover {
            border-color: #667eea;
            background: #e7f1ff;
        }
        .filter-btn.active {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }
        .filter-btn .count {
            background: rgba(255,255,255,0.2);
            padding: 2px 6px;
            border-radius: 10px;
            margin-left: 6px;
            font-size: 12px;
        }
        .filter-btn.active .count {
            background: rgba(255,255,255,0.3);
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
        }
        .summary-card .number {
            font-size: 32px;
            font-weight: bold;
            color: #333;
        }
        .pokemon-results {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .pokemon-card {
            border-bottom: 1px solid #eee;
        }
        .pokemon-card:last-child {
            border-bottom: none;
        }
        .pokemon-card.hidden {
            display: none;
        }
        .pokemon-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        .pokemon-header:hover {
            background-color: #f8f9fa;
        }
        .pokemon-name-section {
            display: flex;
            align-items: center;
        }
        .pokemon-name {
            font-size: 20px;
            font-weight: bold;
            color: #333;
        }
        .pokemon-id {
            color: #666;
            margin-left: 10px;
        }
        .collapse-indicator {
            margin-left: 10px;
            color: #999;
            transition: transform 0.2s ease;
        }
        .pokemon-card.collapsed .collapse-indicator {
            transform: rotate(-90deg);
        }
        .completeness-section {
            display: flex;
            align-items: center;
        }
        .completeness-bar {
            width: 150px;
            height: 8px;
            background: #eee;
            border-radius: 4px;
            overflow: hidden;
            margin-right: 15px;
        }
        .completeness-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff4444 0%, #ffaa00 50%, #44ff44 100%);
            transition: width 0.3s ease;
        }
        .completeness-text {
            font-weight: bold;
            min-width: 50px;
        }
        .pokemon-content {
            padding: 0 20px 20px 20px;
            transition: all 0.3s ease;
        }
        .pokemon-card.collapsed .pokemon-content {
            display: none;
        }
        .validation-badges {
            display: flex;
            gap: 8px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        .validation-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        .badge-complete {
            background: #d4edda;
            color: #155724;
        }
        .badge-high {
            background: #fff3cd;
            color: #856404;
        }
        .badge-low {
            background: #f8d7da;
            color: #721c24;
        }
        .badge-in-game {
            background: #cce5ff;
            color: #004085;
        }
        .issues {
            margin-top: 15px;
        }
        .issue {
            padding: 12px;
            margin: 8px 0;
            border-radius: 6px;
            border-left: 4px solid;
            transition: all 0.2s ease;
        }
        .issue.hidden {
            display: none;
        }
        .issue.inaccurate {
            background: #f8d7da;
            border-color: #dc3545;
        }
        .issue.no_reference {
            background: #d1ecf1;
            border-color: #17a2b8;
        }
        .issue.partial_match {
            background: #fff3cd;
            border-color: #ffc107;
        }
        .issue.source_conflict {
            background: #f3e5f5;
            border-color: #9c27b0;
        }
        .issue.accepted {
            background: #d4edda;
            border-color: #28a745;
            opacity: 0.8;
        }
        .issue.error {
            background: #f8d7da;
            border-color: #dc3545;
        }
        .issue-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .issue-field {
            font-weight: bold;
            color: #333;
        }
        .issue-badges {
            display: flex;
            gap: 6px;
        }
        .accepted-badge {
            background: #28a745;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
        }
        .in-game-badge {
            background: #007bff;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
        }
        .issue-message {
            margin: 5px 0;
            color: #666;
        }
        .comparison {
            font-family: monospace;
            font-size: 12px;
            background: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
            margin-top: 8px;
            border: 1px solid #e9ecef;
        }
        .no-issues {
            color: #28a745;
            font-weight: bold;
            text-align: center;
            padding: 30px;
            background: #d4edda;
            border-radius: 6px;
            margin: 15px 0;
        }
        .status-error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 15px;
            border-left: 4px solid #dc3545;
        }
        .results-count {
            text-align: center;
            padding: 15px;
            color: #666;
            background: white;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Pokemon Validation Report</h1>
        <p>Generated on ${timestamp}</p>
        <p><strong>Enhanced Interactive Report:</strong> External validation (75% max) + Field-level in-game validation (25% max)</p>
    </div>

    <div class="controls">
        <h3>🎛️ Report Filters</h3>
        
        <div class="filter-group">
            <label>Pokemon Validation Level:</label>
            <div class="filter-buttons">
                <div class="filter-btn active" data-filter="pokemon" data-value="all">
                    All Pokemon <span class="count">${totalPokemon}</span>
                </div>
                <div class="filter-btn" data-filter="pokemon" data-value="complete">
                    100% Validated <span class="count">${fullyValidated}</span>
                </div>
                <div class="filter-btn" data-filter="pokemon" data-value="high">
                    75%+ Validated <span class="count">${highlyValidated}</span>
                </div>
                <div class="filter-btn" data-filter="pokemon" data-value="low">
                    Below 75% <span class="count">${lowValidated}</span>
                </div>
            </div>
        </div>

        <div class="filter-group">
            <label>Attribute Display:</label>
            <div class="filter-buttons">
                <div class="filter-btn active" data-filter="attributes" data-value="all">
                    All Attributes
                </div>
                <div class="filter-btn" data-filter="attributes" data-value="validated">
                    Validated Only
                </div>
                <div class="filter-btn" data-filter="attributes" data-value="issues">
                    Issues & No Reference
                </div>
            </div>
        </div>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Total Pokemon</h3>
            <div class="number">${totalPokemon}</div>
        </div>
        <div class="summary-card">
            <h3>100% Complete</h3>
            <div class="number">${fullyValidated}</div>
        </div>
        <div class="summary-card">
            <h3>75%+ Validated</h3>
            <div class="number">${highlyValidated}</div>
        </div>
        <div class="summary-card">
            <h3>Below 75%</h3>
            <div class="number">${lowValidated}</div>
        </div>
        <div class="summary-card">
            <h3>Total Issues</h3>
            <div class="number">${totalIssues}</div>
        </div>
        <div class="summary-card">
            <h3>Inaccurate Data</h3>
            <div class="number">${severityCounts.inaccurate || 0}</div>
        </div>
        <div class="summary-card">
            <h3>No Reference Data</h3>
            <div class="number">${severityCounts.no_reference || 0}</div>
        </div>
    </div>

    <div class="results-count">
        <span id="visible-count">${totalPokemon}</span> Pokemon shown
    </div>

    <div class="pokemon-results">
        ${results.map(result => this.createPokemonResultHTML(result)).join('')}
    </div>

    <script>
        // Filter functionality
        let currentPokemonFilter = 'all';
        let currentAttributeFilter = 'all';

        function updateFilters() {
            const pokemonCards = document.querySelectorAll('.pokemon-card');
            let visibleCount = 0;

            pokemonCards.forEach(card => {
                const completeness = parseInt(card.dataset.completeness);
                let showPokemon = false;

                // Pokemon filter
                switch(currentPokemonFilter) {
                    case 'all':
                        showPokemon = true;
                        break;
                    case 'complete':
                        showPokemon = completeness >= 100;
                        break;
                    case 'high':
                        showPokemon = completeness >= 75;
                        break;
                    case 'low':
                        showPokemon = completeness < 75;
                        break;
                }

                if (showPokemon) {
                    card.classList.remove('hidden');
                    visibleCount++;

                    // Attribute filter
                    const issues = card.querySelectorAll('.issue');
                    issues.forEach(issue => {
                        let showIssue = false;
                        const hasIssue = issue.classList.contains('inaccurate') || 
                                        issue.classList.contains('no_reference') || 
                                        issue.classList.contains('partial_match') || 
                                        issue.classList.contains('source_conflict') || 
                                        issue.classList.contains('error');
                        const isAccepted = issue.classList.contains('accepted');

                        switch(currentAttributeFilter) {
                            case 'all':
                                showIssue = true;
                                break;
                            case 'validated':
                                showIssue = isAccepted;
                                break;
                            case 'issues':
                                showIssue = hasIssue && !isAccepted;
                                break;
                        }

                        issue.classList.toggle('hidden', !showIssue);
                    });
                } else {
                    card.classList.add('hidden');
                }
            });

            document.getElementById('visible-count').textContent = visibleCount;
        }

        // Filter button handlers
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const filterType = btn.dataset.filter;
                const filterValue = btn.dataset.value;

                // Update active state
                document.querySelectorAll(\`[data-filter="\${filterType}"]\`).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update current filter
                if (filterType === 'pokemon') {
                    currentPokemonFilter = filterValue;
                } else if (filterType === 'attributes') {
                    currentAttributeFilter = filterValue;
                }

                updateFilters();
            });
        });

        // Collapsible Pokemon cards
        document.querySelectorAll('.pokemon-header').forEach(header => {
            header.addEventListener('click', () => {
                const card = header.closest('.pokemon-card');
                card.classList.toggle('collapsed');
            });
        });

        // Initialize filters
        updateFilters();
    </script>
</body>
</html>`;
    }

    /**
     * Create HTML for individual Pokemon result
     */
    createPokemonResultHTML(result) {
        let completenessColor;
        if (result.completeness >= 100) {
            completenessColor = '#44ff44';
        } else if (result.completeness >= 75) {
            completenessColor = '#ffaa00';
        } else {
            completenessColor = '#ff4444';
        }

        // Get validation badges
        const badges = [];
        if (result.completeness >= 100) {
            badges.push('<span class="validation-badge badge-complete">💯 Complete</span>');
        } else if (result.completeness >= 75) {
            badges.push('<span class="validation-badge badge-high">🟡 75%+ Validated</span>');
        } else {
            badges.push('<span class="validation-badge badge-low">🔴 Below 75%</span>');
        }

        // Check if Pokemon has any in-game validated fields
        const hasInGameValidation =
            this.inGameValidated.has(result.id) && this.inGameValidated.get(result.id).size > 0;
        if (hasInGameValidation) {
            badges.push('<span class="validation-badge badge-in-game">🎮 In-Game Validated</span>');
        }

        // Get field validation data from statistics (includes all fields, not just issues)
        const stats = this.getValidationStatistics(result.id);
        let fieldsHTML = '';

        if (stats?.fieldValidation) {
            // Display all fields from validation statistics
            const allFields = [
                'name',
                'species',
                'types',
                'baseStats',
                'height',
                'weight',
                'growthRate',
                'baseExp',
                'catchRate',
                'effortValues',
                'evolutionChain',
                'learnset',
                'tmCompatibility',
                'pokedexEntry',
            ];

            fieldsHTML = allFields
                .map(field => {
                    return this.generateFieldHTML(field, stats.fieldValidation[field], result);
                })
                .join('');
        } else {
            // Fallback to showing only issues if no statistics available
            fieldsHTML =
                result.issues && result.issues.length > 0
                    ? result.issues
                          .map(issue => {
                              let comparisonHTML = '';
                              if (issue.severity === 'inaccurate') {
                                  comparisonHTML = `
                            <div class="comparison">
                                <strong>Current:</strong> ${JSON.stringify(issue.current)}<br>
                                <strong>Expected (${issue.source}):</strong> ${JSON.stringify(issue.expected)}
                                ${issue.accepted ? `<br><br><strong>✅ Accepted Override:</strong> This issue has been manually verified and accepted.` : ''}
                            </div>
                        `;
                              } else if (issue.current !== undefined) {
                                  comparisonHTML = `
                            <div class="comparison">
                                <strong>Current:</strong> ${JSON.stringify(issue.current)}
                                ${issue.accepted ? `<br><br><strong>✅ Accepted Override:</strong> This issue has been manually verified and accepted.` : ''}
                            </div>
                        `;
                              }

                              const issueClass = issue.accepted
                                  ? `${issue.severity} accepted`
                                  : issue.severity;

                              // Check if this field is in-game validated
                              const isInGameValidated =
                                  this.inGameValidated.has(result.id) &&
                                  this.inGameValidated.get(result.id).has(issue.field);

                              const issueBadges = [];
                              if (issue.accepted) {
                                  issueBadges.push(
                                      '<span class="accepted-badge">✅ ACCEPTED</span>'
                                  );
                              }
                              if (isInGameValidated) {
                                  issueBadges.push('<span class="in-game-badge">🎮 IN-GAME</span>');
                              }

                              return `
                    <div class="issue ${issueClass}" data-signature="${this.generateIssueSignature(issue)}">
                        <div class="issue-header">
                            <div class="issue-field">${issue.field}</div>
                            <div class="issue-badges">
                                ${issueBadges.join('')}
                            </div>
                        </div>
                        <div class="issue-message">${issue.message}</div>
                        ${comparisonHTML}
                    </div>`;
                          })
                          .join('')
                    : '<div class="no-issues">✅ Perfect accuracy - all data matches external sources!</div>';
        }

        return `
        <div class="pokemon-card collapsed" data-completeness="${result.completeness}">
            <div class="pokemon-header">
                <div class="pokemon-name-section">
                    <span class="pokemon-name">${result.name}</span>
                    <span class="pokemon-id">#${result.id}</span>
                    <span class="collapse-indicator">▼</span>
                </div>
                <div class="completeness-section">
                    <div class="completeness-bar">
                        <div class="completeness-fill" style="width: ${result.completeness}%"></div>
                    </div>
                    <div class="completeness-text" style="color: ${completenessColor}">
                        ${result.completeness}%
                    </div>
                </div>
            </div>
            
            <div class="pokemon-content">
                <div class="validation-badges">
                    ${badges.join('')}
                </div>

                ${
                    result.status === 'error'
                        ? `
                    <div class="status-error">
                        <strong>⚠️ Validation Error:</strong> ${result.error}
                    </div>
                `
                        : ''
                }
                
                <div class="issues">
                    ${fieldsHTML}
                </div>
            </div>
        </div>`;
    }
}

module.exports = PokemonValidator;
