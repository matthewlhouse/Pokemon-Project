/* Content Validation System for Pokemon Walkthrough Project
   This file contains content validation patterns referenced in Content-Guidelines.md */

// Content Quality Assurance and Validation System

// Content Review Checklist Structure
const contentReviewChecklist = {
    accuracy: {
        name: 'Accuracy Check',
        items: [
            'All Pokemon data verified against reliable sources',
            'Trainer information matches official guides',
            'Item locations tested in-game where possible',
            'Move effects and power verified',
        ],
    },
    accessibility: {
        name: 'Accessibility Check',
        items: [
            'All steps have proper tagging',
            'Spoiler warnings are appropriate',
            'Language is clear and direct',
            'Screen reader considerations addressed',
        ],
    },
    consistency: {
        name: 'Consistency Check',
        items: [
            'Writing style matches established guidelines',
            'Tag usage follows defined taxonomy',
            'HTML structure follows established patterns',
            'Cross-references are accurate and working',
        ],
    },
    userExperience: {
        name: 'User Experience Check',
        items: [
            'Steps flow logically from one to the next',
            'Instructions are actionable and specific',
            'Optional content is clearly marked',
            'Difficulty expectations are appropriate',
        ],
    },
};

// Content Validation Rules System
class ContentValidator {
    constructor() {
        this.rules = {
            // Required elements for each step
            requiredAttributes: ['data-step-id', 'data-category', 'data-location', 'data-tags'],

            // Tag validation rules
            tagRules: {
                required: 'Cannot be combined with optional',
                'story-critical': 'Must include required tag',
                'gym-battle': 'Must include story-critical tag',
                missable: 'Should include time-sensitive tag',
                'spoiler-free': 'Cannot be combined with spoiler tags',
            },

            // Content quality checks
            qualityChecks: {
                stepTextLength: { min: 10, max: 200 }, // Characters
                tagsPerStep: { min: 2, max: 8 },
                locationNaming: /^[a-z-]+$/, // Kebab case
                categoryWhitelist: [
                    'story',
                    'pokemon',
                    'trainer-battle',
                    'gym-battle',
                    'item',
                    'progression',
                    'choice',
                    'setup',
                ],
            },
        };
    }

    // Main validation function
    validateStepContent(stepElement) {
        const errors = [];
        const warnings = [];

        // Check required attributes
        this.validateRequiredAttributes(stepElement, errors);

        // Validate tags
        this.validateTags(stepElement, errors, warnings);

        // Content quality checks
        this.validateContentQuality(stepElement, warnings);

        // Validate data consistency
        this.validateDataConsistency(stepElement, errors, warnings);

        return { errors, warnings };
    }

    validateRequiredAttributes(stepElement, errors) {
        this.rules.requiredAttributes.forEach(attr => {
            if (!stepElement.hasAttribute(attr)) {
                errors.push(`Missing required attribute: ${attr}`);
            }
        });
    }

    validateTags(stepElement, errors, warnings) {
        const tags = stepElement.dataset.tags?.split(',').map(tag => tag.trim()) || [];

        // Tag combination validation
        if (tags.includes('required') && tags.includes('optional')) {
            errors.push('Step cannot be both required and optional');
        }

        if (tags.includes('story-critical') && !tags.includes('required')) {
            warnings.push('Story-critical steps should usually be required');
        }

        if (
            tags.includes('spoiler-free') &&
            (tags.includes('minor-spoilers') || tags.includes('major-spoilers'))
        ) {
            errors.push('Step cannot be spoiler-free and contain spoilers');
        }

        // Tag count validation
        if (tags.length < this.rules.qualityChecks.tagsPerStep.min) {
            warnings.push(
                `Step has only ${tags.length} tags, recommend at least ${this.rules.qualityChecks.tagsPerStep.min}`
            );
        } else if (tags.length > this.rules.qualityChecks.tagsPerStep.max) {
            warnings.push(
                `Step has ${tags.length} tags, consider reducing to max ${this.rules.qualityChecks.tagsPerStep.max}`
            );
        }
    }

    validateContentQuality(stepElement, warnings) {
        const stepText = stepElement.querySelector('.step-text')?.textContent || '';

        // Text length validation
        if (stepText.length < this.rules.qualityChecks.stepTextLength.min) {
            warnings.push(
                `Step text is very short (${stepText.length} chars) - may need more detail`
            );
        } else if (stepText.length > this.rules.qualityChecks.stepTextLength.max) {
            warnings.push(
                `Step text is very long (${stepText.length} chars) - consider breaking into multiple steps`
            );
        }

        // Check for vague language
        const vagueTerms = ['obviously', 'simply', 'just', 'easily', 'clearly'];
        vagueTerms.forEach(term => {
            if (stepText.toLowerCase().includes(term)) {
                warnings.push(`Consider removing vague term: "${term}"`);
            }
        });

        // Check for non-actionable language
        if (
            !stepText.match(/^(Go|Talk|Battle|Catch|Choose|Enter|Exit|Find|Get|Use|Heal|Buy|Sell)/i)
        ) {
            warnings.push('Step text should start with an action verb');
        }
    }

    validateDataConsistency(stepElement, errors, warnings) {
        const category = stepElement.dataset.category;
        const location = stepElement.dataset.location;

        // Category validation
        if (category && !this.rules.qualityChecks.categoryWhitelist.includes(category)) {
            errors.push(
                `Invalid category: ${category}. Must be one of: ${this.rules.qualityChecks.categoryWhitelist.join(', ')}`
            );
        }

        // Location naming validation
        if (location && !this.rules.qualityChecks.locationNaming.test(location)) {
            errors.push(`Location ID must be kebab-case (lowercase with hyphens): ${location}`);
        }

        // Pokemon-specific validation
        if (category === 'pokemon') {
            const pokemonName = stepElement.dataset.pokemon;
            if (!pokemonName) {
                warnings.push('Pokemon steps should include data-pokemon attribute');
            }
        }

        // Battle-specific validation
        if (category === 'trainer-battle' || category === 'gym-battle') {
            const trainerName = stepElement.dataset.trainer;
            if (!trainerName) {
                warnings.push('Battle steps should include data-trainer attribute');
            }
        }
    }

    // Batch validation for multiple elements
    validatePage(container = document) {
        const steps = container.querySelectorAll('.step[data-step-id]');
        const results = {
            totalSteps: steps.length,
            errors: [],
            warnings: [],
            stepResults: [],
        };

        steps.forEach((step, index) => {
            const stepResult = this.validateStepContent(step);
            stepResult.stepId = step.dataset.stepId || `step-${index + 1}`;
            stepResult.element = step;

            results.stepResults.push(stepResult);
            results.errors.push(...stepResult.errors);
            results.warnings.push(...stepResult.warnings);
        });

        return results;
    }

    // Generate validation report
    generateReport(validationResults) {
        const report = {
            summary: {
                totalSteps: validationResults.totalSteps,
                errorCount: validationResults.errors.length,
                warningCount: validationResults.warnings.length,
                validSteps: validationResults.stepResults.filter(r => r.errors.length === 0).length,
            },
            issues: {
                errors: validationResults.errors,
                warnings: validationResults.warnings,
            },
            stepDetails: validationResults.stepResults.map(result => ({
                stepId: result.stepId,
                status: result.errors.length === 0 ? 'valid' : 'invalid',
                errorCount: result.errors.length,
                warningCount: result.warnings.length,
                issues: [...result.errors, ...result.warnings],
            })),
        };

        return report;
    }
}

// Writing Style Checker
class WritingStyleChecker {
    constructor() {
        this.styleRules = {
            // Good patterns
            goodPatterns: [
                {
                    pattern:
                        /^(Go|Talk|Battle|Catch|Choose|Enter|Exit|Find|Get|Use|Heal|Buy|Sell|Visit|Approach|Leave|Return)/,
                    message: 'Starts with action verb',
                },
                { pattern: /\b(you|your)\b/i, message: 'Uses player-focused language' },
            ],

            // Avoid patterns
            avoidPatterns: [
                {
                    pattern: /\b(obviously|clearly|simply|just|easily)\b/i,
                    message: 'Avoid assumption words',
                },
                { pattern: /\b(guys?|dudes?)\b/i, message: 'Use inclusive language' },
                { pattern: /\bembarl on\b/i, message: 'Avoid flowery language' },
                {
                    pattern: /\b(tons of|lots of|a bunch of)\b/i,
                    message: 'Use specific quantities',
                },
            ],

            // Inclusivity checks
            inclusivityPatterns: [
                { pattern: /\b(he|him|his)\b/i, message: 'Consider gender-neutral pronouns' },
                { pattern: /\b(guys|bros|dudes)\b/i, message: 'Use inclusive group terms' },
            ],
        };
    }

    checkText(text) {
        const issues = [];

        // Check good patterns
        let hasGoodPattern = false;
        this.styleRules.goodPatterns.forEach(rule => {
            if (rule.pattern.test(text)) {
                hasGoodPattern = true;
            }
        });

        if (!hasGoodPattern) {
            issues.push({
                type: 'style',
                severity: 'warning',
                message: 'Consider starting with an action verb',
            });
        }

        // Check avoid patterns
        this.styleRules.avoidPatterns.forEach(rule => {
            if (rule.pattern.test(text)) {
                issues.push({ type: 'style', severity: 'warning', message: rule.message });
            }
        });

        // Check inclusivity
        this.styleRules.inclusivityPatterns.forEach(rule => {
            if (rule.pattern.test(text)) {
                issues.push({ type: 'inclusivity', severity: 'info', message: rule.message });
            }
        });

        return issues;
    }
}

// Pokemon Data Accuracy Checker
class PokemonDataChecker {
    constructor() {
        // Sample Pokemon data for validation
        this.pokemonDatabase = {
            pikachu: {
                nationalDex: 25,
                types: ['electric'],
                baseStats: { hp: 35, attack: 55, defense: 40, speed: 90 },
                evolutionStone: 'thunder-stone',
                evolution: 'raichu',
            },
            bulbasaur: {
                nationalDex: 1,
                types: ['grass', 'poison'],
                baseStats: { hp: 45, attack: 49, defense: 49, speed: 45 },
                evolutionLevel: 16,
                evolution: 'ivysaur',
            },
        };
    }

    validatePokemonData(pokemonName, providedData) {
        const errors = [];
        const warnings = [];
        const canonicalData = this.pokemonDatabase[pokemonName.toLowerCase()];

        if (!canonicalData) {
            warnings.push(
                `Pokemon "${pokemonName}" not found in database - manual verification needed`
            );
            return { errors, warnings };
        }

        // Validate National Dex number
        if (providedData.nationalDex && providedData.nationalDex !== canonicalData.nationalDex) {
            errors.push(
                `Incorrect National Dex number: expected ${canonicalData.nationalDex}, got ${providedData.nationalDex}`
            );
        }

        // Validate types
        if (providedData.types) {
            const expectedTypes = canonicalData.types.sort();
            const providedTypes = providedData.types.sort();
            if (JSON.stringify(expectedTypes) !== JSON.stringify(providedTypes)) {
                errors.push(
                    `Incorrect types: expected ${expectedTypes.join('/')}, got ${providedTypes.join('/')}`
                );
            }
        }

        return { errors, warnings };
    }
}

// Content Maintenance Workflow
class ContentMaintenanceWorkflow {
    constructor() {
        this.validator = new ContentValidator();
        this.styleChecker = new WritingStyleChecker();
        this.pokemonChecker = new PokemonDataChecker();
    }

    // Full content audit
    auditContent(container = document) {
        const validationResults = this.validator.validatePage(container);
        const report = this.validator.generateReport(validationResults);

        // Add style checking results
        validationResults.stepResults.forEach(stepResult => {
            const stepText = stepResult.element.querySelector('.step-text')?.textContent || '';
            const styleIssues = this.styleChecker.checkText(stepText);
            stepResult.styleIssues = styleIssues;
        });

        return {
            validation: report,
            contentAudit: {
                totalIssues: report.summary.errorCount + report.summary.warningCount,
                criticalIssues: report.summary.errorCount,
                recommendations: report.summary.warningCount,
            },
        };
    }

    // Generate improvement suggestions
    generateImprovementSuggestions(auditResults) {
        const suggestions = [];

        // Common error patterns
        const errorsByType = {};
        auditResults.validation.issues.errors.forEach(error => {
            const type = this.categorizeError(error);
            errorsByType[type] = (errorsByType[type] || 0) + 1;
        });

        // Generate targeted suggestions
        Object.entries(errorsByType).forEach(([type, count]) => {
            if (count > 3) {
                suggestions.push({
                    priority: 'high',
                    category: type,
                    suggestion: this.getSuggestionForErrorType(type),
                    affectedSteps: count,
                });
            }
        });

        return suggestions;
    }

    categorizeError(error) {
        if (error.includes('attribute')) return 'missing-attributes';
        if (error.includes('tag')) return 'tagging-issues';
        if (error.includes('category')) return 'categorization';
        if (error.includes('location')) return 'location-naming';
        return 'other';
    }

    getSuggestionForErrorType(type) {
        const suggestions = {
            'missing-attributes':
                'Review HTML patterns and ensure all steps include required data attributes',
            'tagging-issues': 'Review tagging guidelines and ensure consistent tag usage',
            categorization: 'Verify step categories match the defined whitelist',
            'location-naming': 'Use kebab-case naming for all location IDs',
        };

        return suggestions[type] || 'Review content guidelines for best practices';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        contentReviewChecklist,
        ContentValidator,
        WritingStyleChecker,
        PokemonDataChecker,
        ContentMaintenanceWorkflow,
    };
}

// Global access for browser usage
if (typeof window !== 'undefined') {
    window.PokemonWalkthrough = window.PokemonWalkthrough || {};
    window.PokemonWalkthrough.ContentValidation = {
        contentReviewChecklist,
        ContentValidator,
        WritingStyleChecker,
        PokemonDataChecker,
        ContentMaintenanceWorkflow,
    };
}
