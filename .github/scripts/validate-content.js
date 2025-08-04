// Content Validation Script for Pokemon Walkthrough Project
// This script validates walkthrough content according to the Content Guidelines

const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');

class ContentValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.requiredAttributes = ['data-step-id', 'data-category', 'data-location', 'data-tags'];
        this.validCategories = [
            'story',
            'pokemon',
            'trainer-battle',
            'gym-battle',
            'item',
            'progression',
            'choice',
            'setup',
        ];
        this.validTags = [
            'required',
            'optional',
            'story-critical',
            'recommended',
            'missable',
            'pokemon-encounter',
            'wild-pokemon',
            'trainer-battle',
            'gym-battle',
            'item-collection',
            'hidden-item',
            'key-item',
            'preparation',
            'tutorial',
            'version-red',
            'version-blue',
            'version-yellow',
            'spoiler-free',
            'minor-spoilers',
            'major-spoilers',
        ];
        this.locationNaming = /^[a-z0-9-]+$/;
        this.stepIdNaming = /^[a-z0-9-]+$/;
    }

    async validateDirectory(dirPath) {
        console.log(`🔍 Validating content in: ${dirPath}`);

        try {
            const files = await this.getHTMLFiles(dirPath);

            for (const file of files) {
                await this.validateFile(file);
            }

            this.printResults();
            return this.errors.length === 0;
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            return false;
        }
    }

    async getHTMLFiles(dirPath) {
        const files = [];

        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    // Recursively check subdirectories
                    const subFiles = await this.getHTMLFiles(fullPath);
                    files.push(...subFiles);
                } else if (entry.name.endsWith('.html')) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        return files;
    }

    async validateFile(filePath) {
        console.log(`📄 Validating: ${path.basename(filePath)}`);

        try {
            const content = await fs.readFile(filePath, 'utf8');
            const dom = new JSDOM(content);
            const document = dom.window.document;

            // Validate HTML structure
            this.validateHTML(document, filePath);

            // Validate steps
            const steps = document.querySelectorAll('.step');
            for (const step of steps) {
                this.validateStep(step, filePath);
            }

            // Validate locations
            const locations = document.querySelectorAll('.location-section');
            for (const location of locations) {
                this.validateLocation(location, filePath);
            }

            // Validate accessibility features
            this.validateAccessibility(document, filePath);
        } catch (error) {
            this.addError(filePath, 'File processing', `Failed to process file: ${error.message}`);
        }
    }

    validateHTML(document, filePath) {
        // Check for required HTML structure
        const title = document.querySelector('title');
        if (!title?.textContent?.trim()) {
            this.addError(filePath, 'HTML Structure', 'Missing or empty <title> element');
        }

        const lang = document.documentElement.getAttribute('lang');
        if (!lang) {
            this.addError(filePath, 'HTML Structure', 'Missing lang attribute on <html> element');
        }

        const metaCharset = document.querySelector('meta[charset]');
        if (!metaCharset) {
            this.addError(filePath, 'HTML Structure', 'Missing charset meta tag');
        }

        const metaViewport = document.querySelector('meta[name="viewport"]');
        if (!metaViewport) {
            this.addWarning(
                filePath,
                'HTML Structure',
                'Missing viewport meta tag (recommended for responsive design)'
            );
        }
    }

    validateStep(step, filePath) {
        const stepId = step.getAttribute('data-step-id');
        const category = step.getAttribute('data-category');
        const location = step.getAttribute('data-location');
        const tags = step.getAttribute('data-tags');

        // Validate basic attributes and structure
        this.validateStepAttributes(step, stepId, filePath);
        this.validateStepIdentifiers(stepId, category, location, filePath);
        this.validateStepTags(tags, stepId, filePath);
        this.validateStepContent(step, stepId, filePath);
        this.validateStepAccessibility(step, stepId, filePath);
        this.validateStepTypeSpecific(step, category, stepId, filePath);
    }

    validateStepAttributes(step, stepId, filePath) {
        this.requiredAttributes.forEach(attr => {
            if (!step.hasAttribute(attr)) {
                this.addError(
                    filePath,
                    'Step Attributes',
                    `Step missing required attribute: ${attr}`,
                    stepId
                );
            }
        });
    }

    validateStepIdentifiers(stepId, category, location, filePath) {
        // Validate step ID format
        if (stepId && !this.stepIdNaming.test(stepId)) {
            this.addError(
                filePath,
                'Step ID',
                `Step ID "${stepId}" should use kebab-case (lowercase letters, numbers, hyphens only)`,
                stepId
            );
        }

        // Validate category
        if (category && !this.validCategories.includes(category)) {
            this.addError(
                filePath,
                'Step Category',
                `Invalid category "${category}". Valid categories: ${this.validCategories.join(', ')}`,
                stepId
            );
        }

        // Validate location format
        if (location && !this.locationNaming.test(location)) {
            this.addError(
                filePath,
                'Location ID',
                `Location ID "${location}" should use kebab-case`,
                stepId
            );
        }
    }

    validateStepTags(tags, stepId, filePath) {
        if (!tags) return;

        const tagList = tags.split(',').map(tag => tag.trim());

        this.validateTagConflicts(tagList, stepId, filePath);
        this.validateTagValues(tagList, stepId, filePath);
        this.validateTagCount(tagList, stepId, filePath);
    }

    validateTagConflicts(tagList, stepId, filePath) {
        if (tagList.includes('required') && tagList.includes('optional')) {
            this.addError(
                filePath,
                'Tag Conflict',
                'Step cannot be both "required" and "optional"',
                stepId
            );
        }
    }

    validateTagValues(tagList, stepId, filePath) {
        tagList.forEach(tag => {
            if (!this.validTags.includes(tag)) {
                this.addWarning(
                    filePath,
                    'Unknown Tag',
                    `Unknown tag "${tag}" - consider adding to valid tags list`,
                    stepId
                );
            }
        });
    }

    validateTagCount(tagList, stepId, filePath) {
        if (tagList.length < 2) {
            this.addWarning(
                filePath,
                'Tag Count',
                'Step should have at least 2 descriptive tags',
                stepId
            );
        }
        if (tagList.length > 8) {
            this.addWarning(
                filePath,
                'Tag Count',
                'Step has many tags - consider consolidating',
                stepId
            );
        }
    }

    validateStepContent(step, stepId, filePath) {
        const stepText = step.querySelector('.step-text');

        if (!stepText?.textContent?.trim()) {
            this.addError(filePath, 'Step Content', 'Step missing text content', stepId);
            return;
        }

        const textLength = stepText.textContent.trim().length;

        if (textLength < 10) {
            this.addWarning(
                filePath,
                'Step Content',
                'Step text is very short - may need more detail',
                stepId
            );
        }

        if (textLength > 200) {
            this.addWarning(
                filePath,
                'Step Content',
                'Step text is very long - consider breaking into multiple steps',
                stepId
            );
        }
    }

    validateStepAccessibility(step, stepId, filePath) {
        const checkbox = step.querySelector('.step-checkbox');
        const label = step.querySelector('label');

        if (!checkbox || !label) return;

        const checkboxId = checkbox.id;
        const labelFor = label.getAttribute('for');

        if (!checkboxId) {
            this.addError(filePath, 'Form Accessibility', 'Checkbox missing ID attribute', stepId);
        }

        if (!labelFor) {
            this.addError(filePath, 'Form Accessibility', 'Label missing "for" attribute', stepId);
        }

        if (checkboxId && labelFor && checkboxId !== labelFor) {
            this.addError(
                filePath,
                'Form Accessibility',
                `Checkbox ID "${checkboxId}" doesn't match label for "${labelFor}"`,
                stepId
            );
        }
    }

    validateStepTypeSpecific(step, category, stepId, filePath) {
        if (category === 'pokemon') {
            this.validatePokemonStep(step, stepId, filePath);
        }

        if (category === 'trainer-battle' || category === 'gym-battle') {
            this.validateBattleStep(step, stepId, filePath);
        }
    }

    validatePokemonStep(step, stepId, filePath) {
        const pokemonAttr = step.getAttribute('data-pokemon');
        if (!pokemonAttr) {
            this.addWarning(
                filePath,
                'Pokemon Data',
                'Pokemon step should have data-pokemon attribute',
                stepId
            );
        }
    }

    validateBattleStep(step, stepId, filePath) {
        const trainerAttr = step.getAttribute('data-trainer');
        if (!trainerAttr) {
            this.addWarning(
                filePath,
                'Battle Data',
                'Battle step should have data-trainer attribute',
                stepId
            );
        }
    }

    validateLocation(location, filePath) {
        const locationId = location.getAttribute('data-location-id');

        if (!locationId) {
            this.addError(
                filePath,
                'Location Attributes',
                'Location section missing data-location-id attribute'
            );
            return;
        }

        if (!this.locationNaming.test(locationId)) {
            this.addError(
                filePath,
                'Location ID',
                `Location ID "${locationId}" should use kebab-case`
            );
        }

        // Check for summary element
        const summary = location.querySelector('summary');
        if (!summary) {
            this.addError(
                filePath,
                'Location Structure',
                'Location section should use <details> with <summary>',
                locationId
            );
        }

        // Check for location name
        const locationName = location.querySelector('.location-name');
        if (!locationName?.textContent?.trim()) {
            this.addError(
                filePath,
                'Location Content',
                'Location missing name element',
                locationId
            );
        }

        // Check for step counter
        const stepCounter = location.querySelector('.step-counter');
        if (!stepCounter) {
            this.addWarning(
                filePath,
                'Location Features',
                'Location missing step counter',
                locationId
            );
        }

        // Validate steps in location
        const steps = location.querySelectorAll('.step');
        if (steps.length === 0) {
            this.addWarning(filePath, 'Location Content', 'Location has no steps', locationId);
        }

        // Check that step locations match location ID
        steps.forEach(step => {
            const stepLocation = step.getAttribute('data-location');
            if (stepLocation && stepLocation !== locationId) {
                const stepId = step.getAttribute('data-step-id');
                this.addWarning(
                    filePath,
                    'Location Consistency',
                    `Step location "${stepLocation}" doesn't match parent location "${locationId}"`,
                    stepId
                );
            }
        });
    }

    validateAccessibility(document, filePath) {
        // Check for skip links
        const skipLinks = document.querySelectorAll('a[href^="#"]');
        const hasSkipToMain = Array.from(skipLinks).some(
            link =>
                link.textContent.toLowerCase().includes('skip') &&
                link.textContent.toLowerCase().includes('content')
        );

        if (!hasSkipToMain) {
            this.addWarning(
                filePath,
                'Accessibility',
                'Consider adding skip-to-content link for keyboard users'
            );
        }

        // Check for heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) {
            this.addWarning(
                filePath,
                'Accessibility',
                'No headings found - consider adding heading structure'
            );
        } else {
            // Check heading hierarchy
            let previousLevel = 0;
            headings.forEach((heading, index) => {
                const level = parseInt(heading.tagName[1]);

                if (index === 0 && level !== 1) {
                    this.addWarning(filePath, 'Heading Structure', 'Page should start with h1');
                }

                if (level - previousLevel > 1) {
                    this.addWarning(
                        filePath,
                        'Heading Structure',
                        `Heading level jump from h${previousLevel} to h${level} - avoid skipping levels`
                    );
                }

                previousLevel = level;
            });
        }

        // Check for live regions
        const liveRegions = document.querySelectorAll('[aria-live]');
        if (liveRegions.length === 0) {
            this.addWarning(
                filePath,
                'Accessibility',
                'Consider adding aria-live regions for dynamic content announcements'
            );
        }

        // Check for form labels
        const inputs = document.querySelectorAll('input:not([type="hidden"])');
        inputs.forEach(input => {
            const inputId = input.id;
            const associatedLabel = document.querySelector(`label[for="${inputId}"]`);
            const ariaLabel = input.getAttribute('aria-label');
            const ariaLabelledby = input.getAttribute('aria-labelledby');

            if (!associatedLabel && !ariaLabel && !ariaLabelledby) {
                this.addError(
                    filePath,
                    'Form Accessibility',
                    `Input missing label association: ${inputId || input.type}`
                );
            }
        });

        // Check for alt text on images
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            const alt = img.getAttribute('alt');
            const ariaHidden = img.getAttribute('aria-hidden');

            if (alt === null && ariaHidden !== 'true') {
                this.addError(filePath, 'Image Accessibility', 'Image missing alt attribute');
            }
        });
    }

    addError(filePath, category, message, stepId = null) {
        this.errors.push({
            file: path.basename(filePath),
            category,
            message,
            stepId,
            type: 'error',
        });
    }

    addWarning(filePath, category, message, stepId = null) {
        this.warnings.push({
            file: path.basename(filePath),
            category,
            message,
            stepId,
            type: 'warning',
        });
    }

    printResults() {
        console.log('\n📊 VALIDATION RESULTS');
        console.log('='.repeat(50));

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('✅ No issues found! Content validation passed.');
            return;
        }

        if (this.errors.length > 0) {
            console.log(`\n❌ ERRORS (${this.errors.length}):`);
            this.errors.forEach(error => {
                const stepInfo = error.stepId ? ` [${error.stepId}]` : '';
                console.log(`   ${error.file}: ${error.category} - ${error.message}${stepInfo}`);
            });
        }

        if (this.warnings.length > 0) {
            console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
            this.warnings.forEach(warning => {
                const stepInfo = warning.stepId ? ` [${warning.stepId}]` : '';
                console.log(
                    `   ${warning.file}: ${warning.category} - ${warning.message}${stepInfo}`
                );
            });
        }

        console.log('\n📈 SUMMARY:');
        console.log(`   Errors: ${this.errors.length}`);
        console.log(`   Warnings: ${this.warnings.length}`);

        if (this.errors.length > 0) {
            console.log('\n❗ Please fix all errors before deployment.');
            process.exit(1);
        } else {
            console.log('\n✅ No critical errors found. Warnings are suggestions for improvement.');
        }
    }

    // Generate validation report
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalErrors: this.errors.length,
                totalWarnings: this.warnings.length,
                status: this.errors.length === 0 ? 'PASSED' : 'FAILED',
            },
            errors: this.errors,
            warnings: this.warnings,
            recommendations: this.generateRecommendations(),
        };

        return report;
    }

    generateRecommendations() {
        const recommendations = [];

        // Analyze common issues
        const errorCategories = {};
        const warningCategories = {};

        this.errors.forEach(error => {
            errorCategories[error.category] = (errorCategories[error.category] || 0) + 1;
        });

        this.warnings.forEach(warning => {
            warningCategories[warning.category] = (warningCategories[warning.category] || 0) + 1;
        });

        // Generate recommendations based on common issues
        if (errorCategories['Step Attributes']) {
            recommendations.push({
                category: 'Data Attributes',
                priority: 'high',
                suggestion:
                    'Ensure all steps have required data attributes: data-step-id, data-category, data-location, data-tags',
            });
        }

        if (errorCategories['Form Accessibility'] || warningCategories['Form Accessibility']) {
            recommendations.push({
                category: 'Accessibility',
                priority: 'high',
                suggestion:
                    'Review form accessibility: ensure all inputs have proper labels and IDs match',
            });
        }

        if (warningCategories['Step Content']) {
            recommendations.push({
                category: 'Content Quality',
                priority: 'medium',
                suggestion:
                    'Review step text length - aim for clear, actionable instructions between 10-200 characters',
            });
        }

        if (warningCategories['Tag Count'] || warningCategories['Unknown Tag']) {
            recommendations.push({
                category: 'Tagging System',
                priority: 'medium',
                suggestion:
                    'Review tagging strategy - use 2-8 descriptive tags per step from the approved tag list',
            });
        }

        if (warningCategories['Heading Structure']) {
            recommendations.push({
                category: 'Document Structure',
                priority: 'medium',
                suggestion:
                    'Improve heading hierarchy - start with h1 and avoid skipping heading levels',
            });
        }

        return recommendations;
    }
}

// CLI functionality
if (require.main === module) {
    const validator = new ContentValidator();
    const targetDir = process.argv[2] || './';

    validator
        .validateDirectory(targetDir)
        .then(success => {
            if (process.argv.includes('--report')) {
                const report = validator.generateReport();
                const reportPath = './content-validation-report.json';
                require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
                console.log(`📄 Detailed report saved to: ${reportPath}`);
            }

            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Validation script failed:', error);
            process.exit(1);
        });
}

module.exports = ContentValidator;
