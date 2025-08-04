/* Content Tagging System for Pokemon Walkthrough Project
   This file contains the comprehensive tagging system referenced in Content-Guidelines.md */

// Comprehensive Tag Categories for Content Organization
const gameplayTags = {
    // Story progression
    'story-critical': 'Required for story advancement',
    'story-optional': 'Story content that can be skipped',
    'plot-relevant': 'Important for understanding the story',

    // Pokemon-related
    'pokemon-encounter': 'Involves encountering wild Pokemon',
    'pokemon-catch': 'Involves catching specific Pokemon',
    'pokemon-trade': 'Involves trading Pokemon with NPCs',
    'pokemon-gift': 'Receiving Pokemon from NPCs',
    'legendary-pokemon': 'Encounters with legendary Pokemon',

    // Battle types
    'trainer-battle': 'Battles against trainers',
    'gym-battle': 'Gym leader battles',
    'elite-four': 'Elite Four battles',
    'champion-battle': 'Champion battle',
    'rival-battle': 'Battles against your rival',

    // Item management
    'item-collection': 'Collecting items from the world',
    'item-purchase': 'Buying items from shops',
    'item-gift': 'Receiving items from NPCs',
    'hidden-item': 'Items hidden in the environment',
    'key-item': 'Important items required for progression',

    // Preparation and strategy
    preparation: 'Preparing for upcoming challenges',
    'level-grinding': 'Recommended leveling spots',
    'move-learning': 'Learning or teaching new moves',
    evolution: 'Pokemon evolution opportunities',
};

const completionTags = {
    // Required vs Optional
    required: 'Must be completed to finish the game',
    optional: 'Can be skipped without affecting progression',
    recommended: 'Optional but strongly recommended',
    completionist: 'Required for 100% completion',

    // Difficulty indicators
    easy: 'Low difficulty, minimal risk',
    moderate: 'Moderate difficulty, some preparation needed',
    hard: 'High difficulty, requires strategy and preparation',
    expert: 'Very high difficulty, advanced strategies required',

    // Timing considerations
    'time-sensitive': 'Must be done at a specific time',
    missable: 'Can be permanently missed if not done now',
    repeatable: 'Can be repeated multiple times',
    'one-time-only': 'Can only be done once per game',
};

const uxTags = {
    // Accessibility considerations
    'audio-cue': 'Important audio information provided',
    'visual-indicator': 'Important visual information provided',
    'timing-sensitive': 'Requires quick reactions or timing',
    'color-dependent': 'Relies on color differentiation',
    'text-heavy': 'Contains significant amounts of text',

    // Spoiler management
    'spoiler-free': 'No story spoilers',
    'minor-spoilers': 'Minor story context',
    'major-spoilers': 'Significant story revelations',

    // User preferences
    'casual-friendly': 'Good for casual players',
    'speedrun-relevant': 'Important for speedrunning',
    'nuzlocke-relevant': 'Important for Nuzlocke runs',
    'challenge-run': 'Relevant for challenge runs',
};

// Version detection and content filtering
const versionTags = {
    'version-red': 'Pokemon Red specific content',
    'version-blue': 'Pokemon Blue specific content',
    'version-yellow': 'Pokemon Yellow specific content',
    'version-shared': 'Content common to all versions',
    'version-rb': 'Content shared between Red and Blue only',
    'version-exclusive': 'Content exclusive to one version',
    'version-difference': 'Content that varies between versions',
};

// Version-specific data structures
const versionData = {
    'red-blue': {
        starterPokemon: ['Bulbasaur', 'Charmander', 'Squirtle'],
        gymLeaders: {
            cerulean: {
                name: 'Misty',
                specialty: 'Water',
                team: [
                    { pokemon: 'Staryu', level: 18 },
                    { pokemon: 'Starmie', level: 21 },
                ],
            },
        },
    },
    yellow: {
        starterPokemon: ['Pikachu'],
        gymLeaders: {
            cerulean: {
                name: 'Misty',
                specialty: 'Water',
                team: [
                    { pokemon: 'Staryu', level: 18 },
                    { pokemon: 'Starmie', level: 21 },
                ],
            },
        },
        uniqueFeatures: [
            'Team Rocket Jessie and James appear',
            'Pikachu follows you outside its Poke Ball',
            'Different gym leader teams to account for Pikachu',
        ],
    },
};

// Content validation rules
const contentValidation = {
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

// Automated content validation
function validateStepContent(stepElement) {
    const errors = [];
    const warnings = [];

    // Check required attributes
    contentValidation.requiredAttributes.forEach(attr => {
        if (!stepElement.hasAttribute(attr)) {
            errors.push(`Missing required attribute: ${attr}`);
        }
    });

    // Validate tags
    const tags = stepElement.dataset.tags?.split(',') || [];

    // Tag combination validation
    if (tags.includes('required') && tags.includes('optional')) {
        errors.push('Step cannot be both required and optional');
    }

    if (tags.includes('story-critical') && !tags.includes('required')) {
        warnings.push('Story-critical steps should usually be required');
    }

    // Content quality checks
    const stepText = stepElement.querySelector('.step-text')?.textContent || '';
    if (stepText.length < contentValidation.qualityChecks.stepTextLength.min) {
        warnings.push('Step text is very short - may need more detail');
    }

    if (tags.length < contentValidation.qualityChecks.tagsPerStep.min) {
        warnings.push('Step may need more descriptive tags');
    }

    return { errors, warnings };
}

// Tag filtering utility
class TagFilter {
    constructor() {
        this.allTags = { ...gameplayTags, ...completionTags, ...uxTags, ...versionTags };
        this.activeFilters = new Set();
        this.excludedTags = new Set();
    }

    // Add tag to active filters
    addFilter(tag) {
        if (this.allTags[tag]) {
            this.activeFilters.add(tag);
            return true;
        }
        console.warn(`Unknown tag: ${tag}`);
        return false;
    }

    // Remove tag from active filters
    removeFilter(tag) {
        return this.activeFilters.delete(tag);
    }

    // Add tag to exclusion list
    excludeTag(tag) {
        if (this.allTags[tag]) {
            this.excludedTags.add(tag);
            return true;
        }
        console.warn(`Unknown tag: ${tag}`);
        return false;
    }

    // Check if step matches current filters
    matchesFilters(stepTags) {
        const tags = Array.isArray(stepTags) ? stepTags : stepTags.split(',');

        // If no active filters, show all (except excluded)
        if (this.activeFilters.size === 0) {
            return !tags.some(tag => this.excludedTags.has(tag.trim()));
        }

        // Step must have at least one active filter tag
        const hasActiveTag = tags.some(tag => this.activeFilters.has(tag.trim()));

        // Step must not have any excluded tags
        const hasExcludedTag = tags.some(tag => this.excludedTags.has(tag.trim()));

        return hasActiveTag && !hasExcludedTag;
    }

    // Get current filter state
    getFilterState() {
        return {
            active: Array.from(this.activeFilters),
            excluded: Array.from(this.excludedTags),
        };
    }

    // Apply preset filter combination
    applyPreset(presetName) {
        this.activeFilters.clear();
        this.excludedTags.clear();

        const presets = {
            'story-only': {
                include: ['story-critical', 'required'],
                exclude: ['optional'],
            },
            completionist: {
                include: [],
                exclude: [],
            },
            'pokemon-focused': {
                include: ['pokemon-encounter', 'pokemon-catch', 'legendary-pokemon'],
                exclude: [],
            },
            'battles-only': {
                include: ['trainer-battle', 'gym-battle', 'elite-four', 'champion-battle'],
                exclude: [],
            },
            'spoiler-free': {
                include: ['spoiler-free'],
                exclude: ['minor-spoilers', 'major-spoilers'],
            },
        };

        const preset = presets[presetName];
        if (preset) {
            preset.include.forEach(tag => this.addFilter(tag));
            preset.exclude.forEach(tag => this.excludeTag(tag));
            return true;
        }

        console.warn(`Unknown preset: ${presetName}`);
        return false;
    }
}

// Tag utility functions
const TagUtils = {
    // Get all tags of a specific category
    getTagsByCategory(category) {
        switch (category) {
            case 'gameplay':
                return Object.keys(gameplayTags);
            case 'completion':
                return Object.keys(completionTags);
            case 'ux':
                return Object.keys(uxTags);
            case 'version':
                return Object.keys(versionTags);
            default:
                return [];
        }
    },

    // Get tag description
    getTagDescription(tag) {
        const allTags = { ...gameplayTags, ...completionTags, ...uxTags, ...versionTags };
        return allTags[tag] || 'Unknown tag';
    },

    // Validate tag combination
    validateTagCombination(tags) {
        const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
        const errors = [];

        // Check for conflicting tags
        if (tagArray.includes('required') && tagArray.includes('optional')) {
            errors.push('Step cannot be both required and optional');
        }

        if (
            tagArray.includes('spoiler-free') &&
            (tagArray.includes('minor-spoilers') || tagArray.includes('major-spoilers'))
        ) {
            errors.push('Step cannot be spoiler-free and contain spoilers');
        }

        return errors;
    },

    // Get recommended tags for content type
    getRecommendedTags(category, contentType) {
        const recommendations = {
            story: {
                'main-quest': ['required', 'story-critical', 'spoiler-free'],
                'side-quest': ['optional', 'story-optional', 'recommended'],
                tutorial: ['required', 'easy', 'spoiler-free'],
            },
            pokemon: {
                'starter-choice': ['required', 'story-critical', 'pokemon-choice'],
                'wild-encounter': ['optional', 'pokemon-encounter', 'completionist'],
                legendary: ['optional', 'legendary-pokemon', 'hard', 'missable'],
            },
            'gym-battle': {
                required: ['required', 'gym-battle', 'story-critical'],
                optional: ['optional', 'trainer-battle', 'preparation'],
            },
        };

        return recommendations[category]?.[contentType] || [];
    },
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        gameplayTags,
        completionTags,
        uxTags,
        versionTags,
        versionData,
        contentValidation,
        validateStepContent,
        TagFilter,
        TagUtils,
    };
}

// Global access for browser usage
if (typeof window !== 'undefined') {
    window.PokemonWalkthrough = window.PokemonWalkthrough || {};
    window.PokemonWalkthrough.TaggingSystem = {
        gameplayTags,
        completionTags,
        uxTags,
        versionTags,
        versionData,
        contentValidation,
        validateStepContent,
        TagFilter,
        TagUtils,
    };
}
