/**
 * Pokemon Validation CLI
 * Command-line interface for validating pokemon-base.json
 */

const PokemonValidator = require('./pokemon-validator.js');
const path = require('path');

class ValidationCLI {
    constructor() {
        this.validator = new PokemonValidator();
    }

    /**
     * Main CLI entry point
     */
    async run(args = []) {
        console.log('🔍 POKEMON VALIDATION SYSTEM');
        console.log('='.repeat(50));
        
        try {
            // Parse command line arguments
            const options = this.parseArguments(args);
            
            // Handle stats commands
            if (options.command === 'stats') {
                return await this.handleStats(options);
            }
            
            if (options.command === 'field-status') {
                return await this.handleFieldStatus(options);
            }
            
            // Handle override management commands
            if (options.command === 'accept-issue') {
                return await this.handleAcceptIssue(options);
            }
            
            if (options.command === 'remove-accepted') {
                return await this.handleRemoveAccepted(options);
            }
            
            if (options.command === 'list-accepted') {
                return await this.handleListAccepted();
            }
            
            // Handle in-game validation commands
            if (options.command === 'set-in-game-validated') {
                return await this.handleSetInGameValidated(options);
            }
            
            if (options.command === 'remove-in-game-validated') {
                return await this.handleRemoveInGameValidated(options);
            }
            
            if (options.command === 'list-in-game-validated') {
                return await this.handleListInGameValidated();
            }
            
            // Load Pokemon data
            console.log('📂 Loading pokemon-base.json...');
            await this.validator.loadPokemonData();
            
            // Load accepted issues and in-game validation
            console.log('⚙️ Loading validation data...');
            const acceptedLoaded = await this.validator.loadAcceptedIssues();
            const inGameLoaded = await this.validator.loadInGameValidation();
            if (acceptedLoaded) {
                console.log('✅ Accepted issues loaded');
            }
            if (inGameLoaded) {
                console.log('✅ In-game validation data loaded');
            }
            if (!acceptedLoaded && !inGameLoaded) {
                console.log('ℹ️ No validation overrides found (this is normal for new setups)');
            }
            
            // Get Pokemon that need validation
            const needsValidation = this.validator.getPokemonNeedingValidation();
            console.log(`📊 Found ${needsValidation.length} Pokemon needing validation`);
            
            if (needsValidation.length === 0) {
                console.log('✅ All Pokemon are already 100% validated!');
                return;
            }

            // Filter based on options
            let pokemonToValidate = needsValidation;
            if (options.pokemon) {
                pokemonToValidate = needsValidation.filter(p => 
                    p.name.toLowerCase().includes(options.pokemon.toLowerCase()) ||
                    p.id === options.pokemon
                );
                
                if (pokemonToValidate.length === 0) {
                    console.log(`❌ No Pokemon found matching "${options.pokemon}"`);
                    return;
                }
            }

            if (options.limit) {
                pokemonToValidate = pokemonToValidate.slice(0, options.limit);
            }

            console.log(`🎯 Validating ${pokemonToValidate.length} Pokemon...`);
            console.log('');

            // Set up progress tracking
            let lastProgress = 0;
            this.validator.setProgressCallback((progress) => {
                const percent = Math.round((progress.current / progress.total) * 100);
                if (percent !== lastProgress) {
                    process.stdout.write(`\r⏳ Progress: ${percent}% (${progress.current}/${progress.total}) - Validating ${progress.pokemon}...`);
                    lastProgress = percent;
                }
            });

            // Run validation
            const results = await this.validator.validateMultiplePokemon(
                pokemonToValidate.map(p => ({ id: p.id, pokemon: p.pokemon }))
            );
            
            console.log('\n✅ Validation complete!');
            console.log('');

            // Show summary
            this.showSummary(results);

            // Generate HTML report
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const reportPath = path.join(__dirname, '..', 'reports', `validation-report-${timestamp}.html`);
            
            console.log('📝 Generating HTML report...');
            await this.validator.generateHTMLReport(results, reportPath);
            console.log(`📋 Report saved to: ${reportPath}`);
            
            // Open report if requested
            if (options.open) {
                const { exec } = require('child_process');
                exec(`start "${reportPath}"`, (error) => {
                    if (error) {
                        console.log(`💡 To view the report, open: ${reportPath}`);
                    } else {
                        console.log('🌐 Opening report in browser...');
                    }
                });
            } else {
                console.log(`💡 To view the report, open: ${reportPath}`);
            }

        } catch (error) {
            console.error('❌ CLI Error:', error.message);
            if (error.stack) {
                console.error('Stack trace:', error.stack);
            }
        }
    }

    /**
     * Handle stats command - show validation statistics
     */
    async handleStats(options) {
        console.log('📊 VALIDATION STATISTICS');
        console.log('='.repeat(50));
        
        await this.validator.loadPokemonData();
        await this.validator.loadValidationStatistics();
        
        if (this.validator.validationStatistics.size === 0) {
            console.log('ℹ️ No validation statistics available.');
            console.log('💡 Run validations first to generate statistics.');
            return;
        }

        if (options.pokemonId) {
            // Show detailed stats for specific Pokemon
            const stats = this.validator.getValidationStatistics(options.pokemonId);
            if (!stats) {
                console.log(`❌ No validation statistics found for Pokemon #${options.pokemonId}`);
                return;
            }
            
            const pokemon = this.validator.pokemonData.pokemon[options.pokemonId];
            const pokemonName = pokemon?.name || `Pokemon #${options.pokemonId}`;
            
            console.log(`🎯 ${pokemonName} (#${options.pokemonId})`);
            console.log(`   📈 Overall Completeness: ${stats.completeness}%`);
            console.log(`   🌐 External Accuracy: ${stats.externalAccuracy}% (75% max)`);
            console.log(`   🎮 In-Game Validation: ${stats.inGameValidation}% (25% max)`);
            console.log(`   ⚠️ Total Issues: ${stats.totalIssues}`);
            console.log(`   ✅ Accepted Issues: ${stats.acceptedIssues}`);
            console.log(`   🕒 Last Validated: ${new Date(stats.lastValidated).toLocaleString()}`);
            
        } else {
            // Show summary statistics for all Pokemon
            const allStats = Array.from(this.validator.validationStatistics.entries());
            const avgCompleteness = allStats.reduce((sum, [, stats]) => sum + stats.completeness, 0) / allStats.length;
            const totalIssues = allStats.reduce((sum, [, stats]) => sum + stats.totalIssues, 0);
            const totalAccepted = allStats.reduce((sum, [, stats]) => sum + stats.acceptedIssues, 0);
            
            console.log(`📊 Summary for ${allStats.length} Pokemon:`);
            console.log(`   📈 Average Completeness: ${Math.round(avgCompleteness)}%`);
            console.log(`   ⚠️ Total Issues: ${totalIssues}`);
            console.log(`   ✅ Accepted Issues: ${totalAccepted}`);
            
            console.log(`\n🎯 Individual Pokemon:`);
            allStats
                .sort((a, b) => b[1].completeness - a[1].completeness)
                .forEach(([pokemonId, stats]) => {
                    const pokemon = this.validator.pokemonData.pokemon[pokemonId];
                    const pokemonName = pokemon?.name || `Pokemon #${pokemonId}`;
                    console.log(`   ${pokemonName} (#${pokemonId}): ${stats.completeness}% complete`);
                });
        }
    }

    /**
     * Handle field-status command - show detailed field validation status
     */
    async handleFieldStatus(options) {
        console.log('🔍 FIELD VALIDATION STATUS');
        console.log('='.repeat(50));
        
        await this.validator.loadPokemonData();
        await this.validator.loadValidationStatistics();
        
        if (this.validator.validationStatistics.size === 0) {
            console.log('ℹ️ No validation statistics available.');
            console.log('💡 Run validations first to generate field status information.');
            return;
        }

        if (options.pokemonId) {
            // Show detailed field status for specific Pokemon
            const stats = this.validator.getValidationStatistics(options.pokemonId);
            if (!stats) {
                console.log(`❌ No validation statistics found for Pokemon #${options.pokemonId}`);
                return;
            }
            
            const pokemon = this.validator.pokemonData.pokemon[options.pokemonId];
            const pokemonName = pokemon?.name || `Pokemon #${options.pokemonId}`;
            
            console.log(`🎯 ${pokemonName} (#${options.pokemonId}) - Field Status:`);
            console.log(`📈 Overall: ${stats.completeness}% complete\n`);
            
            for (const [field, fieldInfo] of Object.entries(stats.fieldValidation)) {
                const statusEmoji = this.getFieldStatusEmoji(fieldInfo.status);
                const statusText = this.getFieldStatusText(fieldInfo.status);
                
                console.log(`${statusEmoji} ${field}: ${statusText}`);
                if (fieldInfo.inGameValidated) {
                    console.log(`     🎮 In-game validated`);
                }
                if (fieldInfo.hasAcceptedIssue) {
                    console.log(`     ✅ Has accepted override`);
                }
            }
        } else {
            // Show field status summary across all Pokemon
            const fieldCounts = {
                accurate: 0,
                accepted_override: 0,
                in_game_validated: 0,
                inaccurate: 0,
                no_reference: 0,
                partial_match: 0,
                source_conflict: 0,
                total: 0
            };
            
            for (const [pokemonId, stats] of this.validator.validationStatistics.entries()) {
                for (const [field, fieldInfo] of Object.entries(stats.fieldValidation)) {
                    fieldCounts[fieldInfo.status]++;
                    fieldCounts.total++;
                }
            }
            
            console.log(`📊 Field Status Summary (${fieldCounts.total} total fields):`);
            console.log(`   ✅ Accurate: ${fieldCounts.accurate} (${Math.round(fieldCounts.accurate/fieldCounts.total*100)}%)`);
            console.log(`   🔄 Accepted Override: ${fieldCounts.accepted_override} (${Math.round(fieldCounts.accepted_override/fieldCounts.total*100)}%)`);
            console.log(`   🎮 In-Game Validated: ${fieldCounts.in_game_validated} (${Math.round(fieldCounts.in_game_validated/fieldCounts.total*100)}%)`);
            console.log(`   ❌ Inaccurate: ${fieldCounts.inaccurate} (${Math.round(fieldCounts.inaccurate/fieldCounts.total*100)}%)`);
            console.log(`   ❓ No Reference Data: ${fieldCounts.no_reference} (${Math.round(fieldCounts.no_reference/fieldCounts.total*100)}%)`);
            console.log(`   ⚠️ Partial Match: ${fieldCounts.partial_match} (${Math.round(fieldCounts.partial_match/fieldCounts.total*100)}%)`);
            console.log(`   ⚡ Source Conflict: ${fieldCounts.source_conflict} (${Math.round(fieldCounts.source_conflict/fieldCounts.total*100)}%)`);
        }
    }

    /**
     * Get emoji for field status
     */
    getFieldStatusEmoji(status) {
        switch (status) {
            case 'accurate': return '✅';
            case 'accepted_override': return '🔄';
            case 'in_game_validated': return '🎮';
            case 'inaccurate': return '❌';
            case 'no_reference': return '❓';
            case 'partial_match': return '⚠️';
            case 'source_conflict': return '⚡';
            default: return '❓';
        }
    }

    /**
     * Get text description for field status
     */
    getFieldStatusText(status) {
        switch (status) {
            case 'accurate': return 'Matches external sources';
            case 'accepted_override': return 'Override accepted (manual verification)';
            case 'in_game_validated': return 'Validated through gameplay (no external match)';
            case 'inaccurate': return 'Does not match external sources';
            case 'no_reference': return 'No external reference data available';
            case 'partial_match': return 'Matches one source but conflicts with another (0 weight)';
            case 'source_conflict': return 'External sources disagree, current matches neither (0 weight)';
            default: return 'Unknown status';
        }
    }

    /**
     * Parse command line arguments
     */
    parseArguments(args) {
        const options = {
            pokemon: null,
            limit: null,
            open: false,
            command: null,
            field: null,
            pokemonId: null
        };

        let i = 0;
        while (i < args.length) {
            switch (args[i]) {
                case '--pokemon':
                case '-p':
                    if (i + 1 < args.length) {
                        options.pokemon = args[i + 1];
                        i += 2;
                    } else {
                        i++;
                    }
                    break;
                case '--limit':
                case '-l':
                    if (i + 1 < args.length) {
                        options.limit = parseInt(args[i + 1]);
                        i += 2;
                    } else {
                        i++;
                    }
                    break;
                case '--open':
                case '-o':
                    options.open = true;
                    i++;
                    break;
                case 'stats':
                    options.command = 'stats';
                    if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
                        options.pokemonId = args[i + 1];
                        i++;
                    }
                    i++;
                    break;
                case 'field-status':
                    options.command = 'field-status';
                    if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
                        options.pokemonId = args[i + 1];
                        i++;
                    }
                    i++;
                    break;
                case 'accept-issue':
                    options.command = 'accept-issue';
                    if (i + 2 < args.length) {
                        options.pokemonId = args[i + 1];
                        options.field = args[i + 2];
                        i += 3;
                    } else {
                        console.log('❌ Usage: accept-issue <pokemon-id> <field-name>');
                        process.exit(1);
                    }
                    break;
                case 'remove-accepted':
                    options.command = 'remove-accepted';
                    if (i + 2 < args.length) {
                        options.pokemonId = args[i + 1];
                        options.field = args[i + 2];
                        i += 3;
                    } else {
                        console.log('❌ Usage: remove-accepted <pokemon-id> <field-name>');
                        process.exit(1);
                    }
                    break;
                case 'list-accepted':
                    options.command = 'list-accepted';
                    i++;
                    break;
                case 'set-in-game-validated':
                    options.command = 'set-in-game-validated';
                    if (i + 2 < args.length) {
                        options.pokemonId = args[i + 1];
                        options.field = args[i + 2];
                        i += 3;
                    } else {
                        console.log('❌ Usage: set-in-game-validated <pokemon-id> <field-name>');
                        process.exit(1);
                    }
                    break;
                case 'remove-in-game-validated':
                    options.command = 'remove-in-game-validated';
                    if (i + 2 < args.length) {
                        options.pokemonId = args[i + 1];
                        options.field = args[i + 2];
                        i += 3;
                    } else {
                        console.log('❌ Usage: remove-in-game-validated <pokemon-id> <field-name>');
                        process.exit(1);
                    }
                    break;
                case 'list-in-game-validated':
                    options.command = 'list-in-game-validated';
                    i++;
                    break;
                case '--help':
                case '-h':
                    this.showHelp();
                    process.exit(0);
                    break;
                default:
                    i++;
                    break;
            }
        }

        return options;
    }

    /**
     * Handle accept-issue command
     */
    async handleAcceptIssue(options) {
        console.log(`📝 Accepting issue for Pokemon #${options.pokemonId}, field: ${options.field}`);
        
        // Load current data
        await this.validator.loadPokemonData();
        await this.validator.loadAcceptedIssues();
        
        // Get Pokemon data
        const pokemon = this.validator.pokemonData.pokemon[options.pokemonId];
        if (!pokemon) {
            console.log(`❌ Pokemon #${options.pokemonId} not found`);
            return;
        }
        
        // Validate to get current issues
        const result = await this.validator.validatePokemon(options.pokemonId, pokemon);
        
        // Find the issue for this field
        const issue = result.issues.find(i => i.field === options.field && !i.accepted);
        if (!issue) {
            console.log(`❌ No unaccepted issue found for field "${options.field}" in ${pokemon.name || `Pokemon #${options.pokemonId}`}`);
            return;
        }
        
        // Accept the issue
        this.validator.acceptIssue(options.pokemonId, this.validator.generateIssueSignature(issue));
        await this.validator.saveAcceptedIssues();
        
        console.log(`✅ Issue accepted for ${pokemon.name || `Pokemon #${options.pokemonId}`}, field: ${options.field}`);
        console.log(`📊 This will improve the completeness score on next validation.`);
    }

    /**
     * Handle remove-accepted command
     */
    async handleRemoveAccepted(options) {
        console.log(`🗑️ Removing accepted issue for Pokemon #${options.pokemonId}, field: ${options.field}`);
        
        await this.validator.loadPokemonData();
        await this.validator.loadAcceptedIssues();
        
        const pokemon = this.validator.pokemonData.pokemon[options.pokemonId];
        if (!pokemon) {
            console.log(`❌ Pokemon #${options.pokemonId} not found`);
            return;
        }
        
        // Create a mock issue signature to remove
        const mockIssue = {
            field: options.field,
            severity: 'inaccurate', // Most common
            current: this.validator.getFieldValue(pokemon, options.field)
        };
        
        const signature = this.validator.generateIssueSignature(mockIssue);
        this.validator.removeAcceptedIssue(options.pokemonId, signature);
        await this.validator.saveAcceptedIssues();
        
        console.log(`✅ Removed accepted issue for ${pokemon.name || `Pokemon #${options.pokemonId}`}, field: ${options.field}`);
    }

    /**
     * Handle list-accepted command
     */
    async handleListAccepted() {
        console.log('📋 ACCEPTED ISSUES LIST');
        console.log('='.repeat(50));
        
        await this.validator.loadPokemonData();
        await this.validator.loadAcceptedIssues();
        
        if (this.validator.acceptedIssues.size === 0) {
            console.log('ℹ️ No accepted issues found.');
            return;
        }
        
        for (const [pokemonId, signatures] of this.validator.acceptedIssues.entries()) {
            const pokemon = this.validator.pokemonData.pokemon[pokemonId];
            const pokemonName = pokemon?.name || `Pokemon #${pokemonId}`;
            
            console.log(`\n🔍 ${pokemonName} (#${pokemonId}):`);
            
            for (const signature of signatures) {
                // Parse signature to extract field name
                const [field] = signature.split(':');
                console.log(`   ✅ ${field}`);
            }
        }
        
        console.log(`\n📊 Total: ${Array.from(this.validator.acceptedIssues.values()).reduce((sum, set) => sum + set.size, 0)} accepted issues across ${this.validator.acceptedIssues.size} Pokemon`);
    }

    /**
     * Handle set-in-game-validated command
     */
    async handleSetInGameValidated(options) {
        console.log(`🎮 Setting in-game validation for Pokemon #${options.pokemonId}, field: ${options.field}`);
        
        await this.validator.loadPokemonData();
        await this.validator.loadInGameValidation();
        
        const pokemon = this.validator.pokemonData.pokemon[options.pokemonId];
        if (!pokemon) {
            console.log(`❌ Pokemon #${options.pokemonId} not found`);
            return;
        }
        
        // Validate field name
        const validFields = [
            'name', 'species', 'types', 'baseStats', 'height', 'weight', 
            'growthRate', 'baseExp', 'catchRate', 'effortValues', 
            'evolutionChain', 'learnset', 'tmCompatibility', 'pokedexEntry'
        ];
        
        if (!validFields.includes(options.field)) {
            console.log(`❌ Invalid field name "${options.field}"`);
            console.log(`💡 Valid fields: ${validFields.join(', ')}`);
            return;
        }
        
        this.validator.setInGameValidated(options.pokemonId, options.field);
        await this.validator.saveInGameValidation();
        
        const pokemonName = pokemon.name || `Pokemon #${options.pokemonId}`;
        console.log(`✅ ${pokemonName} field "${options.field}" marked as in-game validated`);
        console.log(`📊 This field now contributes to the 25% in-game validation bonus.`);
    }

    /**
     * Handle remove-in-game-validated command
     */
    async handleRemoveInGameValidated(options) {
        console.log(`🗑️ Removing in-game validation for Pokemon #${options.pokemonId}, field: ${options.field}`);
        
        await this.validator.loadPokemonData();
        await this.validator.loadInGameValidation();
        
        const pokemon = this.validator.pokemonData.pokemon[options.pokemonId];
        if (!pokemon) {
            console.log(`❌ Pokemon #${options.pokemonId} not found`);
            return;
        }
        
        this.validator.removeInGameValidated(options.pokemonId, options.field);
        await this.validator.saveInGameValidation();
        
        const pokemonName = pokemon.name || `Pokemon #${options.pokemonId}`;
        console.log(`✅ In-game validation removed for ${pokemonName} field "${options.field}"`);
        console.log(`📊 This field no longer contributes to in-game validation bonus.`);
    }

    /**
     * Handle list-in-game-validated command
     */
    async handleListInGameValidated() {
        console.log('🎮 IN-GAME VALIDATED FIELDS');
        console.log('='.repeat(50));
        
        await this.validator.loadPokemonData();
        await this.validator.loadInGameValidation();
        
        if (this.validator.inGameValidated.size === 0) {
            console.log('ℹ️ No Pokemon fields have been marked as in-game validated.');
            console.log('💡 Use "set-in-game-validated <pokemon-id> <field-name>" to mark specific fields as validated through actual gameplay.');
            return;
        }
        
        let totalFields = 0;
        
        for (const [pokemonId, fields] of this.validator.inGameValidated.entries()) {
            const pokemon = this.validator.pokemonData.pokemon[pokemonId];
            const pokemonName = pokemon?.name || `Pokemon #${pokemonId}`;
            
            console.log(`\n🎮 ${pokemonName} (#${pokemonId}):`);
            for (const field of fields) {
                console.log(`   ✅ ${field}`);
                totalFields++;
            }
        }
        
        console.log(`\n📊 Total: ${totalFields} fields validated across ${this.validator.inGameValidated.size} Pokemon`);
        console.log(`💡 Each validated field contributes to the 25% in-game validation bonus.`);
    }

    /**
     * Show command help
     */
    showHelp() {
        console.log(`
Pokemon Validation CLI Usage:

VALIDATION COMMANDS:
  node validation-cli.js [options]              # Run validation

STATISTICS COMMANDS:
  node validation-cli.js stats [pokemon-id]      # Show validation statistics (all or specific Pokemon)
  node validation-cli.js field-status [pokemon-id] # Show detailed field validation status

OVERRIDE MANAGEMENT COMMANDS:
  node validation-cli.js accept-issue <id> <field>     # Accept an issue as valid
  node validation-cli.js remove-accepted <id> <field>  # Remove accepted issue
  node validation-cli.js list-accepted                 # List all accepted issues

IN-GAME VALIDATION COMMANDS:
  node validation-cli.js set-in-game-validated <id> <field>    # Mark specific field as validated in-game
  node validation-cli.js remove-in-game-validated <id> <field> # Remove in-game validation for field
  node validation-cli.js list-in-game-validated               # List all in-game validated fields

Options:
  -p, --pokemon <name/id>   Validate specific Pokemon (by name or ID)
  -l, --limit <number>      Limit number of Pokemon to validate
  -o, --open               Open HTML report in browser after generation
  -h, --help               Show this help message

Examples:
  # Validation
  node validation-cli.js                      # Validate all incomplete Pokemon
  node validation-cli.js -p Bulbasaur         # Validate only Bulbasaur
  node validation-cli.js -l 5 -o              # Validate 5 Pokemon and open report
  
  # Statistics
  node validation-cli.js stats                # Show overall statistics
  node validation-cli.js stats 001            # Show detailed stats for Bulbasaur
  node validation-cli.js field-status 001     # Show field-by-field status for Bulbasaur
  
  # Issue Management (after seeing issues in HTML report)
  node validation-cli.js accept-issue 001 evolutionChain    # Accept Bulbasaur evolution chain issue
  node validation-cli.js accept-issue 001 baseExp          # Accept Bulbasaur base experience issue
  node validation-cli.js list-accepted                     # See all accepted issues
  node validation-cli.js remove-accepted 001 baseExp      # Remove accepted base experience
  
  # In-Game Validation (ultimate validation authority - field level)
  node validation-cli.js set-in-game-validated 001 baseStats     # Mark Bulbasaur base stats as validated in-game
  node validation-cli.js list-in-game-validated                  # See all in-game validated fields
  node validation-cli.js remove-in-game-validated 001 baseStats  # Remove in-game validation for base stats
        `);
    }

    /**
     * Show validation summary
     */
    showSummary(results) {
        const completed = results.filter(r => r.status === 'completed').length;
        const errors = results.filter(r => r.status === 'error').length;
        const totalIssues = results.reduce((sum, r) => sum + (r.totalIssues || 0), 0);
        
        const severityCounts = results.reduce((counts, r) => {
            if (r.issues) {
                r.issues.forEach(issue => {
                    counts[issue.severity] = (counts[issue.severity] || 0) + 1;
                });
            }
            return counts;
        }, {});

        console.log('📊 VALIDATION SUMMARY');
        console.log('-'.repeat(30));
        console.log(`✅ Successful validations: ${completed}`);
        console.log(`❌ Failed validations: ${errors}`);
        console.log(`🔍 Total issues found: ${totalIssues}`);
        console.log(`   • Missing data: ${severityCounts.missing || 0}`);
        console.log(`   • Data mismatches: ${severityCounts.mismatch || 0}`);
        console.log(`   • Errors: ${severityCounts.error || 0}`);
        console.log('');

        // Show top issues
        if (totalIssues > 0) {
            console.log('🚨 POKEMON WITH MOST ISSUES:');
            const sortedByIssues = results
                .filter(r => r.totalIssues > 0)
                .sort((a, b) => b.totalIssues - a.totalIssues)
                .slice(0, 5);

            sortedByIssues.forEach(r => {
                console.log(`   ${r.name} (#${r.id}): ${r.totalIssues} issues (${r.completeness}% complete)`);
            });
            console.log('');
        }
    }
}

// Create executable script
async function main() {
    const args = process.argv.slice(2);
    const cli = new ValidationCLI();
    await cli.run(args);
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ValidationCLI;
