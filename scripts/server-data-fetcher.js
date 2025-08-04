/**
 * Server-side Pokemon Data Fetcher (Node.js)
 * Uses proper HTML parsing with cheerio for more reliable data extraction
 */

const fs = require('fs').promises;
const path = require('path');

// Note: These would need to be installed with npm
// npm install cheerio axios
let cheerio, axios;

try {
    cheerio = require('cheerio');
    axios = require('axios');
} catch (error) {
    console.warn('cheerio or axios not installed. Install with: npm install cheerio axios');
    console.warn('Error details:', error.message);
}

class ServerPokemonDataFetcher {
    constructor() {
        this.sources = {
            bulbapedia: {
                baseUrl: 'https://bulbapedia.bulbagarden.net/wiki',
                rateLimit: 1000,
                userAgent: 'Pokemon Walkthrough Project Data Validator (Educational Use)',
            },
            serebii: {
                baseUrl: 'https://www.serebii.net/pokedex',
                rateLimit: 1000,
                userAgent: 'Pokemon Walkthrough Project Data Validator (Educational Use)',
            },
        };

        this.requestQueue = [];
        this.processing = false;
        this.lastRequestTime = 0;

        // Ensure axios is available
        if (!axios) {
            throw new Error(
                'axios is required for server-side fetching. Install with: npm install axios'
            );
        }
        if (!cheerio) {
            throw new Error(
                'cheerio is required for HTML parsing. Install with: npm install cheerio'
            );
        }
    }

    /**
     * Queue a request with rate limiting
     */
    async queueRequest(url, source = 'bulbapedia') {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                url,
                source,
                resolve,
                reject,
                timestamp: Date.now(),
            });

            if (!this.processing) {
                this.processQueue();
            }
        });
    }

    /**
     * Process the request queue with rate limiting
     */
    async processQueue() {
        if (this.processing || this.requestQueue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.requestQueue.length > 0) {
            const request = this.requestQueue.shift();
            const timeSinceLastRequest = Date.now() - this.lastRequestTime;
            const rateLimit = this.sources[request.source].rateLimit;

            // Wait if we need to respect rate limiting
            if (timeSinceLastRequest < rateLimit) {
                await this.sleep(rateLimit - timeSinceLastRequest);
            }

            try {
                const response = await axios.get(request.url, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': this.sources[request.source].userAgent,
                    },
                });

                this.lastRequestTime = Date.now();
                request.resolve(response.data);
            } catch (error) {
                console.error(`Failed to fetch ${request.url}:`, error.message);
                request.reject(error);
            }
        }

        this.processing = false;
    }

    /**
     * Sleep utility for rate limiting
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fetch Pokemon data from Bulbapedia with proper HTML parsing
     */
    async fetchFromBulbapedia(pokemonName) {
        try {
            const url = `${this.sources.bulbapedia.baseUrl}/${pokemonName}_(Pokémon)`;
            console.log(`Fetching from Bulbapedia: ${pokemonName}`);

            const html = await this.queueRequest(url, 'bulbapedia');
            const $ = cheerio.load(html);

            return await this.parseBulbapediaDataWithCheerio($, pokemonName);
        } catch (error) {
            console.error(`Failed to fetch from Bulbapedia for ${pokemonName}:`, error.message);
            return {
                source: 'bulbapedia',
                pokemon_name: pokemonName,
                timestamp: new Date().toISOString(),
                error: error.message,
                data: null,
            };
        }
    }

    /**
     * Fetch Pokemon data from Serebii with proper HTML parsing
     */
    async fetchFromSerebii(pokemonNumber) {
        try {
            const paddedNumber = pokemonNumber.toString().padStart(3, '0');
            const url = `${this.sources.serebii.baseUrl}/${paddedNumber}.shtml`;
            console.log(`Fetching from Serebii: Pokemon #${pokemonNumber}`);

            const html = await this.queueRequest(url, 'serebii');
            const $ = cheerio.load(html);

            return this.parseSerebiiDataWithCheerio($, pokemonNumber);
        } catch (error) {
            console.error(
                `Failed to fetch from Serebii for Pokemon #${pokemonNumber}:`,
                error.message
            );
            return {
                source: 'serebii',
                pokemon_number: pokemonNumber,
                timestamp: new Date().toISOString(),
                error: error.message,
                data: null,
            };
        }
    }

    /**
     * Helper function to extract base stats from Bulbapedia HTML
     */
    extractBaseStats($) {
        const baseStats = {};

        // Helper function to extract stat value from th element
        const extractStatValue = thContent => {
            const statMatch = thContent.match(/<div>(\d+)<\/div>/);
            return statMatch ? parseInt(statMatch[1]) : null;
        };

        // Define stat mappings
        const statMappings = {
            HP: 'hp',
            Attack: 'attack',
            Defense: 'defense',
            'Sp. Atk': 'specialAttack',
            'Sp. Def': 'specialDefense',
            Speed: 'speed',
        };

        // Look for the stats table
        $('th').each((i, elem) => {
            const $th = $(elem);
            const thContent = $th.html();

            if (!thContent) return;

            // Check each stat type
            Object.entries(statMappings).forEach(([statText, statKey]) => {
                if (thContent.includes(statText)) {
                    // Special handling for Attack/Defense to avoid Sp. variants
                    if (
                        (statText === 'Attack' || statText === 'Defense') &&
                        thContent.includes('Sp.')
                    ) {
                        return;
                    }

                    const value = extractStatValue(thContent);
                    if (value) baseStats[statKey] = value;
                }
            });
        });

        return baseStats;
    }

    /**
     * Parse Bulbapedia data using Cheerio with improved selectors
     */
    async parseBulbapediaDataWithCheerio($, pokemonName) {
        const data = {
            source: 'bulbapedia',
            pokemon_name: pokemonName,
            timestamp: new Date().toISOString(),
            data: {},
            parsing_notes: [],
        };

        try {
            // Extract Pokemon name from the main page heading (h1)
            const $h1 = $('h1.firstHeading');
            if ($h1.length > 0) {
                const pageTitle = $h1.text().trim();
                // Extract name from title like "Bulbasaur (Pokémon)" or just "Bulbasaur"
                const nameMatch = pageTitle.match(/^([^(]+)(?:\s*\(|$)/);
                if (nameMatch) {
                    data.data.name = nameMatch[1].trim();
                    data.parsing_notes.push(`Pokemon name found: ${data.data.name}`);
                }
            }

            // Extract types from the infobox - look for actual type links (not Unknown)
            const types = [];
            $('.infobox a[title*="(type)"]').each((i, elem) => {
                const typeText = $(elem).attr('title');
                if (typeText && !typeText.includes('Unknown')) {
                    const typeMatch = typeText.match(/^([^(]+) \(type\)$/);
                    if (typeMatch) {
                        const typeName = typeMatch[1].trim();
                        if (!types.includes(typeName)) {
                            types.push(typeName);
                        }
                    }
                }
            });
            if (types.length > 0) {
                data.data.types = types;
                data.parsing_notes.push(`Found ${types.length} types: ${types.join(', ')}`);
            }

            // Extract height and weight from infobox - more flexible approach
            $('.infobox').each((i, infobox) => {
                const $infobox = $(infobox);
                const infoboxText = $infobox.text();

                // Look for height pattern (e.g., "0.7 m")
                const heightMatch = /(\d+\.?\d*)\s*m(?!\w)/g.exec(infoboxText);
                if (heightMatch && !data.data.height) {
                    data.data.height = parseFloat(heightMatch[1]);
                    data.parsing_notes.push(`Height found: ${data.data.height}m`);
                }

                // Look for weight pattern (e.g., "6.9 kg")
                const weightMatch = /(\d+\.?\d*)\s*kg(?!\w)/g.exec(infoboxText);
                if (weightMatch && !data.data.weight) {
                    data.data.weight = parseFloat(weightMatch[1]);
                    data.parsing_notes.push(`Weight found: ${data.data.weight}kg`);
                }
            });

            // Extract base stats using helper function
            const baseStats = this.extractBaseStats($);

            // For Generation I, combine Sp. Atk and Sp. Def into Special
            if (
                baseStats.specialAttack &&
                baseStats.specialDefense &&
                baseStats.specialAttack === baseStats.specialDefense
            ) {
                baseStats.special = baseStats.specialAttack;
                delete baseStats.specialAttack;
                delete baseStats.specialDefense;
            }

            if (Object.keys(baseStats).length > 0) {
                data.data.baseStats = baseStats;
                data.parsing_notes.push(`Base stats found: ${Object.keys(baseStats).join(', ')}`);
            }

            // Extract Pokedex number from the main infobox specifically
            $('.infobox').each((i, infobox) => {
                const $infobox = $(infobox);
                const infoboxText = $infobox.text();

                // Look for the #0001 pattern in the infobox (not navigation)
                const pokedexMatch = /#0*(\d+)(?!\d)/g.exec(infoboxText);
                if (pokedexMatch && !data.data.pokedex_number) {
                    data.data.pokedex_number = parseInt(pokedexMatch[1]);
                    data.parsing_notes.push(`Pokedex number found: ${data.data.pokedex_number}`);
                }
            });

            // Extract additional Pokemon attributes
            await this.extractExtendedBulbapediaData($, data);

            data.parsing_notes.push('Improved Cheerio-based parsing completed');
        } catch (error) {
            data.parsing_notes.push(`Parsing error: ${error.message}`);
        }

        return data;
    }

    /**
     * Parse Serebii data using Cheerio with improved selectors
     */
    parseSerebiiDataWithCheerio($, pokemonNumber) {
        const data = {
            source: 'serebii',
            pokemon_number: pokemonNumber,
            timestamp: new Date().toISOString(),
            data: {},
            parsing_notes: [],
        };

        try {
            // Extract Pokemon name from fooinfo elements
            const $fooinfos = $('.fooinfo');

            // The name is typically in the second fooinfo element
            if ($fooinfos.length >= 2) {
                const nameText = $($fooinfos[1]).text().trim();
                if (nameText && !nameText.includes('function') && nameText.length < 50) {
                    data.data.name = nameText;
                    data.parsing_notes.push(`Pokemon name found: ${nameText}`);
                }
            }

            // Extract height and weight from fooinfo elements
            $fooinfos.each((i, elem) => {
                const text = $(elem).text().trim();

                // Look for height pattern (e.g., "2'04" 0.7m")
                const heightMatch = /(\d+\.?\d*)\s*m/g.exec(text);
                if (heightMatch && !data.data.height) {
                    data.data.height = parseFloat(heightMatch[1]);
                    data.parsing_notes.push(`Height found: ${data.data.height}m`);
                }

                // Look for weight pattern (e.g., "15.2lbs 6.9kg")
                const weightMatch = /(\d+\.?\d*)\s*kg/g.exec(text);
                if (weightMatch && !data.data.weight) {
                    data.data.weight = parseFloat(weightMatch[1]);
                    data.parsing_notes.push(`Weight found: ${data.data.weight}kg`);
                }
            });

            // Extract base stats from the stats table (dextable)
            $('.dextable').each((i, table) => {
                const $table = $(table);
                const tableText = $table.text();

                // Look for the base stats table (contains "Base Stats - Total:")
                if (tableText.includes('Base Stats - Total:')) {
                    data.parsing_notes.push('Base stats table found');

                    // Find the row with stat names and the row with stat values
                    const rows = $table.find('tr');

                    rows.each((rowIndex, row) => {
                        const $row = $(row);
                        const cells = $row.find('td');

                        // Look for the stats header row (HP, Attack, Defense, Special, Speed)
                        if (cells.length >= 5) {
                            const cellTexts = [];
                            cells.each((cellIndex, cell) => {
                                cellTexts.push($(cell).text().trim());
                            });

                            // Check if this row contains stat names
                            if (
                                cellTexts.some(
                                    text => text === 'HP' || text === 'Attack' || text === 'Defense'
                                )
                            ) {
                                // The next row should contain the stat values
                                const nextRow = rows.eq(rowIndex + 1);
                                const valueCells = nextRow.find('td');

                                if (valueCells.length >= 5) {
                                    const baseStats = {};

                                    // Map the stat values (skip first cell which is "Base Stats - Total:")
                                    const statValues = [];
                                    valueCells.slice(1).each((cellIndex, cell) => {
                                        const value = $(cell).text().trim();
                                        if (!isNaN(parseInt(value))) {
                                            statValues.push(parseInt(value));
                                        }
                                    });

                                    // Assign values to stats (HP, Attack, Defense, Special, Speed)
                                    if (statValues.length >= 5) {
                                        baseStats.hp = statValues[0];
                                        baseStats.attack = statValues[1];
                                        baseStats.defense = statValues[2];
                                        baseStats.special = statValues[3];
                                        baseStats.speed = statValues[4];

                                        data.data.baseStats = baseStats;
                                        data.parsing_notes.push(
                                            `Base stats extracted: HP=${baseStats.hp}, Attack=${baseStats.attack}, Defense=${baseStats.defense}, Special=${baseStats.special}, Speed=${baseStats.speed}`
                                        );
                                    }
                                }
                            }
                        }
                    });
                }
            });

            // Extract types from type images - specifically from the Pokemon info table
            const types = [];

            // Look for the main Pokemon info table containing types
            $('.dextable').each((i, table) => {
                const $table = $(table);
                const tableText = $table.text();

                // Find the table that contains basic Pokemon info (Name, Type, Classification)
                if (
                    tableText.includes('Name') &&
                    tableText.includes('Type') &&
                    tableText.includes('Classification')
                ) {
                    // In this table, find type images
                    $table.find('img[src*="/pokedex-bw/type/"]').each((imgIndex, img) => {
                        const src = $(img).attr('src');
                        if (src) {
                            const typeMatch = /\/pokedex-bw\/type\/(\w+)\.gif/g.exec(src);
                            if (typeMatch) {
                                const typeName =
                                    typeMatch[1].charAt(0).toUpperCase() + typeMatch[1].slice(1);
                                if (!types.includes(typeName)) {
                                    types.push(typeName);
                                }
                            }
                        }
                    });
                }
            });

            if (types.length > 0) {
                data.data.types = types;
                data.parsing_notes.push(`Types found: ${types.join(', ')}`);
            }

            // Extract Pokedex number from fooinfo
            $fooinfos.each((i, elem) => {
                const text = $(elem).text().trim();
                const pokedexMatch = /#(\d+)/g.exec(text);

                if (pokedexMatch && !data.data.pokedex_number) {
                    data.data.pokedex_number = parseInt(pokedexMatch[1]);
                    data.parsing_notes.push(`Pokedex number found: ${data.data.pokedex_number}`);
                }
            });

            // Extract additional Pokemon attributes from Serebii
            this.extractExtendedSerebiiData($, data);

            data.parsing_notes.push('Improved Cheerio-based parsing completed');
        } catch (error) {
            data.parsing_notes.push(`Parsing error: ${error.message}`);
        }

        return data;
    }

    /**
     * Extract extended Pokemon data from Serebii
     */
    extractExtendedSerebiiData($, data) {
        try {
            // Extract basic classification and growth rate
            this.extractSerebiiBasicData($, data);

            // Extract catch rate from main info table
            this.extractSerebiiCatchRate($, data);

            // Extract Effort Values, Learnset, TMs, and Evolution Chain
            this.extractSerebiiMoveAndEvolutionData($, data);

            // Add notes for unavailable data
            data.parsing_notes.push('Base Experience: Not available for Gen I Pokemon on Serebii');
            data.parsing_notes.push('Pokedex Entry: Not available for Gen I Pokemon on Serebii');
        } catch (error) {
            data.parsing_notes.push(`Extended Serebii parsing error: ${error.message}`);
        }
    }

    /**
     * Extract basic data (species, growth rate) from Serebii
     */
    extractSerebiiBasicData($, data) {
        // Extract species from the main dextable
        $('.dextable').each((i, table) => {
            const $table = $(table);
            const tableText = $table.text();

            if (tableText.includes('Classification') && !data.data.species) {
                // Look for classification in table cells
                $table.find('td').each((j, cell) => {
                    const cellText = $(cell).text().trim();
                    if (cellText.includes('Pokémon') || cellText.includes('Pokemon')) {
                        data.data.species = cellText;
                        data.parsing_notes.push(`Species found: ${cellText}`);
                        return false; // break
                    }
                });
            }
        });

        // Extract Growth Rate (under "Experience Growth" heading)
        const growthRate = this.extractSerebiiSectionData($, 'Experience Growth');
        if (growthRate) {
            data.data.growthRate = growthRate;
            data.parsing_notes.push(`Growth rate found: ${growthRate}`);
        }
    }

    /**
     * Extract catch rate from Serebii main info table
     */
    extractSerebiiCatchRate($, data) {
        let catchRate = null;
        $('.dextable').each((i, table) => {
            const $table = $(table);

            // Look for table with basic Pokemon info
            $table.find('tr').each((j, row) => {
                const $row = $(row);
                const cells = $row.find('td');

                // Look for row with classification, height, weight, capture rate
                if (cells.length >= 4) {
                    let foundWeight = false;
                    let catchRateValue = null;

                    cells.each((k, cell) => {
                        const cellText = $(cell).text().trim();

                        // Look for weight information (indicates this is the right row)
                        if (cellText.includes('kg') && cellText.includes('lbs')) {
                            foundWeight = true;
                        }

                        // If we found weight, look for a standalone number (catch rate)
                        if (foundWeight && /^\d{1,3}$/.test(cellText)) {
                            const num = parseInt(cellText);
                            if (num >= 3 && num <= 255) {
                                // Valid catch rate range
                                catchRateValue = num;
                            }
                        }
                    });

                    if (catchRateValue !== null) {
                        catchRate = catchRateValue;
                        return false; // break
                    }
                }
            });

            if (catchRate !== null) return false; // break outer loop
        });

        if (catchRate !== null) {
            data.data.catchRate = catchRate;
            data.parsing_notes.push(`Catch rate found: ${catchRate}`);
        }
    }

    /**
     * Extract move and evolution data from Serebii
     */
    extractSerebiiMoveAndEvolutionData($, data) {
        // Extract Effort Values (under "Effort Values Earned" heading)
        const effortValues = this.extractSerebiiEffortValues($);
        if (effortValues) {
            data.data.effortValues = effortValues;
            data.parsing_notes.push(`Effort values found: ${JSON.stringify(effortValues)}`);
        }

        // Extract Learnset (under "Generation I Level Up" heading)
        const learnset = this.extractSerebiiLearnset($);
        if (learnset && learnset.length > 0) {
            data.data.learnset = learnset;
            data.parsing_notes.push(`Learnset found: ${learnset.length} moves`);
        }

        // Extract TM Compatibility (under "TM & HM Attacks" heading)
        const tmCompatibility = this.extractSerebiiTMCompatibility($);
        if (tmCompatibility && tmCompatibility.length > 0) {
            data.data.tmCompatibility = tmCompatibility;
            data.parsing_notes.push(`TM compatibility found: ${tmCompatibility.length} TMs`);
        }

        // Extract Evolution Chain from evolution table
        const evolutionChain = this.extractSerebiiEvolutionChain($);
        if (evolutionChain && evolutionChain.length > 0) {
            data.data.evolutionChain = evolutionChain;
            data.parsing_notes.push(`Evolution chain found: ${evolutionChain.length} evolution(s)`);
        }
    }

    /**
     * Extract Pokedex entry from Serebii
     */
    extractSerebiiPokedexEntry($) {
        let pokedexEntry = '';

        // Look for Pokedex description in various formats
        $('table').each((i, table) => {
            const $table = $(table);
            const tableText = $table.text();

            if (tableText.includes('Game Locations') || tableText.includes('Description')) {
                $table.find('td').each((j, cell) => {
                    const text = $(cell).text().trim();

                    // Look for descriptive text that sounds like a Pokedex entry
                    if (!pokedexEntry && text.length > 30 && text.length < 300) {
                        // Check if it's describing the Pokemon (not game location info)
                        if (
                            !text.includes('Route') &&
                            !text.includes('Cave') &&
                            !text.includes('Surf') &&
                            !text.includes('Level')
                        ) {
                            pokedexEntry = text;
                        }
                    }
                });
            }
        });

        return pokedexEntry;
    }

    /**
     * Extract data from a section with a specific heading on Serebii
     */
    extractSerebiiSectionData($, headingText) {
        let sectionData = '';

        // Look for the specific heading in table headers
        $('th, td').each((i, element) => {
            const $element = $(element);
            const text = $element.text().trim();

            if (text.includes(headingText)) {
                // Found the heading, now look for data in the next row
                const $table = $element.closest('table');
                if ($table.length) {
                    if (headingText === 'Experience Growth') {
                        // Look in the next row after the header
                        const $headerRow = $element.closest('tr');
                        const $nextRow = $headerRow.next('tr');

                        if ($nextRow.length) {
                            $nextRow.find('td').each((j, cell) => {
                                const cellText = $(cell).text().trim();

                                // Look for growth rate patterns (ignore the points)
                                if (
                                    cellText.match(
                                        /^(Medium Slow|Medium Fast|Fast|Slow|Erratic|Fluctuating)$/i
                                    )
                                ) {
                                    sectionData = cellText;
                                    return false; // break
                                }

                                // Also check for growth rate within text that includes points
                                const growthMatch = cellText.match(
                                    /(Medium Slow|Medium Fast|Fast|Slow|Erratic|Fluctuating)/i
                                );
                                if (growthMatch && !sectionData) {
                                    sectionData = growthMatch[1];
                                }
                            });
                        }
                    }

                    if (headingText === 'Capture Rate') {
                        // Look in nearby cells for just the number
                        const $row = $element.closest('tr');
                        $row.find('td').each((j, cell) => {
                            const cellText = $(cell).text().trim();
                            const numMatch = cellText.match(/^(\d{1,3})$/);
                            if (numMatch && cellText.length < 10) {
                                sectionData = cellText;
                                return false; // break
                            }
                        });
                    }
                }

                if (sectionData) return false; // break outer loop
            }
        });

        return sectionData;
    }

    /**
     * Extract Effort Values from Serebii "Effort Values Earned" section
     */
    extractSerebiiEffortValues($) {
        let effortValues = null;

        $('*').each((i, element) => {
            const $element = $(element);
            const text = $element.text().trim();

            if (text.includes('Effort Values Earned')) {
                // Found the EV section, look for EV data in nearby elements
                const evData = { hp: 0, attack: 0, defense: 0, speed: 0, special: 0 };

                // Look for EV data in the same table or nearby elements
                let $searchArea = $element.closest('table');
                if (!$searchArea.length) {
                    $searchArea = $element.parent();
                }

                $searchArea.find('td, div, span').each((j, cell) => {
                    const cellText = $(cell).text().trim().toLowerCase();

                    // Look for patterns like "1 Special Attack", "2 HP", "1 Defense", etc.
                    const patterns = [
                        /(\d+)\s*(hp|health|hit\s*points?)/i,
                        /(\d+)\s*attack(?!\s*defense)/i,
                        /(\d+)\s*(defense|defence)/i,
                        /(\d+)\s*speed/i,
                        /(\d+)\s*(special|sp\.?\s*att?|sp\.?\s*def)/i,
                    ];

                    patterns.forEach((pattern, index) => {
                        const match = cellText.match(pattern);
                        if (match) {
                            const value = parseInt(match[1]);
                            const statNames = ['hp', 'attack', 'defense', 'speed', 'special'];
                            evData[statNames[index]] = value;
                        }
                    });

                    // Also try simple number detection in cells adjacent to stat names
                    if (/^\d+$/.test(cellText)) {
                        const num = parseInt(cellText);
                        const $prevCell = $(cell).prev();
                        const $nextCell = $(cell).next();
                        const prevText = $prevCell.text().toLowerCase();
                        const nextText = $nextCell.text().toLowerCase();

                        if (prevText.includes('hp') || nextText.includes('hp')) {
                            evData.hp = num;
                        } else if (prevText.includes('attack') || nextText.includes('attack')) {
                            evData.attack = num;
                        } else if (prevText.includes('defense') || nextText.includes('defense')) {
                            evData.defense = num;
                        } else if (prevText.includes('speed') || nextText.includes('speed')) {
                            evData.speed = num;
                        } else if (prevText.includes('special') || nextText.includes('special')) {
                            evData.special = num;
                        }
                    }
                });

                // Check if we found any EV data
                if (Object.values(evData).some(val => val > 0)) {
                    effortValues = evData;
                    return false; // break
                }
            }
        });

        return effortValues;
    }

    /**
     * Extract learnset from Serebii "Generation I Level Up" section
     */
    extractSerebiiLearnset($) {
        const learnset = [];

        $('*').each((i, element) => {
            const $element = $(element);
            const text = $element.text().trim();

            if (text.includes('Generation I Level Up')) {
                // Found the learnset section, look for move data in nearby table
                const $parent = $element.closest('table').next('table'); // Often in next table
                if ($parent.length) {
                    $parent.find('tr').each((j, row) => {
                        const $row = $(row);
                        const cells = $row.find('td');

                        if (cells.length >= 2) {
                            const levelText = $(cells[0]).text().trim();
                            const moveText = $(cells[1]).text().trim();

                            // Parse level (could be "Start", number, or "--")
                            let level;
                            if (levelText === 'Start' || levelText === '--') {
                                level = 0;
                            } else {
                                const levelNum = parseInt(levelText);
                                level = !isNaN(levelNum) ? levelNum : 0;
                            }

                            if (moveText && moveText.length > 0) {
                                learnset.push({
                                    level: level,
                                    attack_name: moveText,
                                });
                            }
                        }
                    });
                }

                if (learnset.length > 0) return false; // break
            }
        });

        return learnset;
    }

    /**
     * Extract TM compatibility from Serebii "TM & HM Attacks" section
     */
    extractSerebiiTMCompatibility($) {
        const tmList = [];

        // Look for the TM & HM Attacks table header
        $('th, td').each((i, element) => {
            const $element = $(element);
            const text = $element.text().trim();

            if (text.includes('TM & HM Attacks')) {
                // Found the TM section header, look for the table with TM data
                const $table = $element.closest('table');
                if ($table.length) {
                    // Look for table rows with TM/HM data
                    $table.find('tr').each((j, row) => {
                        const $row = $(row);
                        const cells = $row.find('td');

                        if (cells.length >= 1) {
                            const firstCell = $(cells[0]).text().trim();

                            // Look for TM/HM patterns in the first column (TM/HM #)
                            const tmMatch = firstCell.match(/^(TM|HM)(\d{2})$/);
                            if (tmMatch) {
                                const tmCode = tmMatch[0]; // e.g., "TM01", "HM05"
                                tmList.push(tmCode);
                            }
                        }
                    });
                }

                if (tmList.length > 0) return false; // break after finding the table
            }
        });

        // If not found by header, try looking for tables with TM patterns
        if (tmList.length === 0) {
            $('table').each((i, table) => {
                const $table = $(table);
                const tableText = $table.text();

                // Check if this table contains TM/HM data
                if (tableText.includes('TM') && tableText.includes('HM')) {
                    const tempTmList = [];

                    $table.find('tr').each((j, row) => {
                        const $row = $(row);
                        const cells = $row.find('td');

                        if (cells.length >= 1) {
                            const firstCell = $(cells[0]).text().trim();
                            const tmMatch = firstCell.match(/^(TM|HM)(\d{2})$/);
                            if (tmMatch) {
                                tempTmList.push(tmMatch[0]);
                            }
                        }
                    });

                    // If we found a reasonable number of TMs (expecting ~15 for Gen I)
                    if (tempTmList.length >= 10) {
                        tmList.push(...tempTmList);
                        return false; // break
                    }
                }
            });
        }

        return tmList;
    }

    /**
     * Extract Pokemon number and name from href
     */
    extractPokemonFromHref(href) {
        const pokedexMatch = href?.match(/\/pokedex\/(\d+)\.shtml/);
        if (pokedexMatch) {
            const pokedexNumber = parseInt(pokedexMatch[1]);

            // Map Pokemon numbers to names (for Gen I)
            const pokemonNames = {
                1: 'Bulbasaur',
                2: 'Ivysaur',
                3: 'Venusaur',
                4: 'Charmander',
                5: 'Charmeleon',
                6: 'Charizard',
                7: 'Squirtle',
                8: 'Wartortle',
                9: 'Blastoise',
                // Add more as needed
            };

            return {
                number: pokedexNumber,
                name: pokemonNames[pokedexNumber] || `Pokemon #${pokedexNumber}`,
            };
        }
        return null;
    }

    /**
     * Process level evolution from image
     */
    processLevelEvolution($, images, j) {
        const $img = $(images[j]);
        const src = $img.attr('src');

        const levelMatch = src?.match(/l(\d+)\.png/);
        if (levelMatch) {
            const level = parseInt(levelMatch[1]);

            // Look for the next Pokemon in the sequence
            if (j + 1 < images.length) {
                const $nextImg = $(images[j + 1]);
                const $nextParent = $nextImg.closest('a');
                const href = $nextParent.attr('href');

                const pokemon = this.extractPokemonFromHref(href);
                if (pokemon) {
                    return {
                        level: level,
                        method: 'level',
                        evolves_to: pokemon.name,
                        evolves_to_number: pokemon.number,
                    };
                }
            }
        }
        return null;
    }

    /**
     * Process stone evolution from image
     */
    processStoneEvolution($, images, j) {
        const $img = $(images[j]);
        const src = $img.attr('src');

        if (
            src?.includes('/evoicon/') &&
            (src.includes('fire') ||
                src.includes('water') ||
                src.includes('thunder') ||
                src.includes('leaf') ||
                src.includes('moon') ||
                src.includes('sun'))
        ) {
            let stoneType = 'Stone';
            if (src.includes('fire')) stoneType = 'Fire Stone';
            else if (src.includes('water')) stoneType = 'Water Stone';
            else if (src.includes('thunder')) stoneType = 'Thunder Stone';
            else if (src.includes('leaf')) stoneType = 'Leaf Stone';
            else if (src.includes('moon')) stoneType = 'Moon Stone';
            else if (src.includes('sun')) stoneType = 'Sun Stone';

            // Look for the next Pokemon in the sequence
            if (j + 1 < images.length) {
                const $nextImg = $(images[j + 1]);
                const $nextParent = $nextImg.closest('a');
                const href = $nextParent.attr('href');

                const pokemon = this.extractPokemonFromHref(href);
                if (pokemon) {
                    return {
                        method: 'stone',
                        item: stoneType,
                        evolves_to: pokemon.name,
                        evolves_to_number: pokemon.number,
                    };
                }
            }
        }
        return null;
    }

    /**
     * Extract evolution chain from Serebii evolution table
     */
    extractSerebiiEvolutionChain($) {
        const evolutionChain = [];

        // Look for <td> containing "Evolutionary Chain"
        $('td').each((i, element) => {
            const $element = $(element);
            const text = $element.text().trim();

            if (text.includes('Evolutionary Chain')) {
                this.processEvolutionChainSection($element, evolutionChain, $);
                return false; // break after finding evolution data
            }
        });

        return evolutionChain;
    }

    /**
     * Process the evolution chain section once found
     */
    processEvolutionChainSection($element, evolutionChain, $) {
        // Found the evolutionary chain section, look for images in the next row
        const $row = $element.closest('tr');
        const $nextRow = $row.next('tr');

        if ($nextRow.length) {
            const images = $nextRow.find('img');
            this.processEvolutionImages($, images, evolutionChain);
        }
    }

    /**
     * Process evolution images to extract evolution data
     */
    processEvolutionImages($, images, evolutionChain) {
        for (let j = 0; j < images.length; j++) {
            // Check for level evolution
            if (images[j].attribs?.src?.includes('/evoicon/l')) {
                const levelEvolution = this.processLevelEvolution($, images, j);
                if (levelEvolution) {
                    evolutionChain.push(levelEvolution);
                }
            }
            // Check for stone evolution
            else if (images[j].attribs?.src?.includes('/evoicon/')) {
                const stoneEvolution = this.processStoneEvolution($, images, j);
                if (stoneEvolution) {
                    evolutionChain.push(stoneEvolution);
                }
            }
        }
    }

    /**
     * Fetch and validate data for a single Pokemon
     */
    async fetchAndValidatePokemon(pokemonId, pokemonName) {
        console.log(`\n=== Fetching data for ${pokemonName} (#${pokemonId}) ===`);

        const results = await Promise.allSettled([
            this.fetchFromBulbapedia(pokemonName),
            this.fetchFromSerebii(parseInt(pokemonId)),
        ]);

        const sourceData = results.map((result, index) => {
            const sourceName = index === 0 ? 'bulbapedia' : 'serebii';
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                console.error(`Failed to fetch from ${sourceName}:`, result.reason.message);
                return {
                    source: sourceName,
                    error: result.reason.message,
                    data: null,
                };
            }
        });

        return {
            pokemon_id: pokemonId,
            pokemon_name: pokemonName,
            sources: sourceData,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Batch fetch data for multiple Pokemon
     */
    async batchFetchPokemon(pokemonList, options = {}) {
        const { batchSize = 5, delay = 2000 } = options;
        const results = [];

        console.log(`Starting batch fetch for ${pokemonList.length} Pokemon...`);
        console.log(`Batch size: ${batchSize}, Delay between batches: ${delay}ms`);

        for (let i = 0; i < pokemonList.length; i += batchSize) {
            const batch = pokemonList.slice(i, i + batchSize);
            console.log(
                `\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pokemonList.length / batchSize)}`
            );

            const batchPromises = batch.map(pokemon =>
                this.fetchAndValidatePokemon(pokemon.id, pokemon.name)
            );

            const batchResults = await Promise.allSettled(batchPromises);

            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    console.error(`Batch error for ${batch[index].name}:`, result.reason);
                    results.push({
                        pokemon_id: batch[index].id,
                        pokemon_name: batch[index].name,
                        error: result.reason.message,
                        timestamp: new Date().toISOString(),
                    });
                }
            });

            // Delay between batches to be respectful to the servers
            if (i + batchSize < pokemonList.length) {
                console.log(`Waiting ${delay}ms before next batch...`);
                await this.sleep(delay);
            }
        }

        return results;
    }

    /**
     * Extract extended Pokemon data from Bulbapedia
     */
    async extractExtendedBulbapediaData($, data) {
        try {
            // Extract basic data (species, growth rate, base exp, catch rate)
            this.extractBulbapediaBasicExtendedData($, data);

            // Extract evolution data
            await this.extractBulbapediaEvolutionData($, data);

            // Extract learnset and TM data
            await this.extractBulbapediaLearnsetAndTMData($, data);

            // Add notes for unavailable data
            data.parsing_notes.push(
                'Effort Values: Not displayed for Gen I/II Pokemon on Bulbapedia'
            );
        } catch (error) {
            data.parsing_notes.push(`Extended parsing error: ${error.message}`);
        }
    }

    /**
     * Extract basic extended data from Bulbapedia
     */
    extractBulbapediaBasicExtendedData($, data) {
        // Extract species (category) from the same <td> as the name
        $('td').each((i, cell) => {
            const $cell = $(cell);
            const cellText = $cell.text().trim();

            // Look for pattern like "BulbasaurSeed Pokémon" - species immediately after Pokemon name
            if (cellText.includes('Pokémon')) {
                // First try pattern like "BulbasaurSeed Pokémon"
                const directPattern = /[A-Z][a-z]+([A-Z][a-z]+)\s*Pokémon/;
                const directMatch = cellText.match(directPattern);

                if (directMatch && !data.data.species) {
                    data.data.species = directMatch[1] + ' Pokemon';
                    data.parsing_notes.push(`Species found (direct): ${data.data.species}`);
                    return false; // break
                }

                // Alternative pattern: "the X Pokémon"
                const altSpeciesMatch = cellText.match(/the\s+([^,\n]+)\s+Pokémon/i);
                if (altSpeciesMatch && !data.data.species) {
                    data.data.species = altSpeciesMatch[1].trim() + ' Pokemon';
                    data.parsing_notes.push(`Species found (alt pattern): ${data.data.species}`);
                    return false; // break
                }
            }
        });

        // Extract Growth Rate under "Leveling rate" header
        $('*').each((i, element) => {
            const $element = $(element);
            const text = $element.text().trim();

            if (text.includes('Leveling rate')) {
                // Look for the growth rate in nearby elements
                let $searchArea = $element.parent();
                $searchArea.find('*').each((j, subElement) => {
                    const subText = $(subElement).text().trim();
                    if (
                        subText.match(/^(Medium Slow|Medium Fast|Fast|Slow|Erratic|Fluctuating)$/i)
                    ) {
                        data.data.growthRate = subText;
                        data.parsing_notes.push(`Growth rate found: ${subText}`);
                        return false; // break
                    }
                });

                if (data.data.growthRate) return false; // break outer loop
            }
        });

        // Extract Base Experience under <b> "Base experience yield"
        $('b').each((i, boldElement) => {
            const $bold = $(boldElement);
            const boldText = $bold.text().trim();

            if (boldText.includes('Base experience yield')) {
                // Look for number in the same element or next sibling
                const $parent = $bold.parent();
                const parentText = $parent.text();
                const expMatch = parentText.match(/Base experience yield[^\d]*(\d+)/i);

                if (expMatch) {
                    data.data.baseExp = parseInt(expMatch[1]);
                    data.parsing_notes.push(`Base experience found: ${data.data.baseExp}`);
                    return false; // break
                }
            }
        });

        // Extract Catch Rate under <b> "Catch Rate"
        $('b').each((i, boldElement) => {
            const $bold = $(boldElement);
            const boldText = $bold.text().trim();

            if (boldText.includes('Catch rate')) {
                // Look for number in the same element or next sibling
                const $parent = $bold.parent();
                const parentText = $parent.text();
                const catchMatch = parentText.match(/Catch rate[^\d]*(\d+)/i);

                if (catchMatch) {
                    data.data.catchRate = parseInt(catchMatch[1]);
                    data.parsing_notes.push(`Catch rate found: ${data.data.catchRate}`);
                    return false; // break
                }
            }
        });
    }

    /**
     * Extract evolution data from Bulbapedia
     */
    async extractBulbapediaEvolutionData($, data) {
        try {
            data.parsing_notes.push('Starting evolution data extraction...');
            $('h3').each((i, h3Element) => {
                const $h3 = $(h3Element);
                const h3Text = $h3.text().trim();

                if (h3Text === 'Evolution data') {
                    data.parsing_notes.push('Found Evolution data h3');

                    // Found the evolution data section, look for the table immediately after
                    const $evolutionTable = $h3.next('table');

                    if ($evolutionTable.length) {
                        data.parsing_notes.push('Found evolution table');

                        try {
                            const evolutionChain =
                                this.extractBulbapediaEvolutionChain($evolutionTable);
                            if (evolutionChain && evolutionChain.length > 0) {
                                data.data.evolutionChain = evolutionChain;
                                data.parsing_notes.push(
                                    `Evolution chain found: ${evolutionChain.length} evolution(s)`
                                );
                            } else {
                                data.parsing_notes.push(
                                    'Evolution data table found but no evolution chain extracted'
                                );
                            }
                        } catch (error) {
                            data.parsing_notes.push(`Evolution extraction error: ${error.message}`);
                        }
                    } else {
                        data.parsing_notes.push('Evolution data h3 found but no table after it');
                    }

                    return false; // break after finding evolution data
                }
            });
        } catch (error) {
            data.parsing_notes.push(`Evolution section error: ${error.message}`);
        }
    }

    /**
     * Extract learnset and TM data from Bulbapedia
     */
    async extractBulbapediaLearnsetAndTMData($, data) {
        // Extract Learnset and TM Compatibility links from Learnset section
        this.extractBulbapediaLearnsetLinks($, data);

        // Fetch external learnset and TM data if links were found
        await this.fetchExternalBulbapediaData(data);
    }

    /**
     * Fetch external learnset and TM data from Bulbapedia links
     */
    async fetchExternalBulbapediaData(data) {
        if (!data.data.externalLinks) return;

        // Fetch learnset data
        if (data.data.externalLinks.learnset) {
            try {
                const learnsetData = await this.fetchBulbapediaLearnsetData(
                    data.data.externalLinks.learnset
                );
                if (learnsetData && learnsetData.length > 0) {
                    data.data.learnset = learnsetData;
                    data.parsing_notes.push(
                        `Learnset fetched from external link: ${learnsetData.length} moves`
                    );
                }
            } catch (error) {
                data.parsing_notes.push(`Learnset fetch error: ${error.message}`);
            }
        }

        // Fetch TM compatibility data
        if (data.data.externalLinks.tmCompatibility) {
            try {
                const tmData = await this.fetchBulbapediaTMData(
                    data.data.externalLinks.tmCompatibility
                );
                if (tmData && tmData.length > 0) {
                    data.data.tmCompatibility = tmData;
                    data.parsing_notes.push(
                        `TM compatibility fetched from external link: ${tmData.length} TMs`
                    );
                }
            } catch (error) {
                data.parsing_notes.push(`TM fetch error: ${error.message}`);
            }
        }
    }

    /**
     * Extract learnset and TM compatibility links from Bulbapedia Learnset section
     */
    extractBulbapediaLearnsetLinks($, data) {
        try {
            data.parsing_notes.push('Starting learnset link extraction...');

            // Find all H4 elements and check if they're learnset-related
            $('h4').each((i, h4Element) => {
                const $h4 = $(h4Element);
                const h4Text = $h4.text().trim();

                data.parsing_notes.push(`Found H4: "${h4Text}"`);

                // Step 2a: Locate "By leveling up" inside of an <h4> tag
                if (h4Text.includes('By leveling up')) {
                    data.parsing_notes.push('Found "By leveling up" h4');
                    this.extractGenerationLearnsetLink($, $h4, data, 'learnset');
                }

                // Step 8: Locate "By TM" inside of an <h4> tag
                if (h4Text.includes('By TM')) {
                    data.parsing_notes.push('Found "By TM" h4');
                    this.extractGenerationLearnsetLink($, $h4, data, 'tmCompatibility');
                }
            });
        } catch (error) {
            data.parsing_notes.push(`Learnset link extraction error: ${error.message}`);
        }
    }

    /**
     * Extract Generation I link from learnset table structure
     */
    extractGenerationLearnsetLink($, $h4Element, data, dataType) {
        try {
            // Step 3: Locate the very next <table> tag
            const $table = $h4Element.next('table');

            if ($table.length) {
                data.parsing_notes.push(`Found table after ${dataType} h4`);

                // Look for Generation I link anywhere in the table
                $table.find('a').each((j, link) => {
                    const $link = $(link);
                    const href = $link.attr('href');
                    const linkText = $link.text().trim();

                    // Look for exactly Generation I
                    if (linkText === 'I') {
                        data.parsing_notes.push(`Found Generation I ${dataType} link: ${href}`);

                        // Store the link for future fetching
                        if (!data.data.externalLinks) {
                            data.data.externalLinks = {};
                        }
                        data.data.externalLinks[dataType] = href;

                        return false; // break
                    }
                });
            }
        } catch (error) {
            data.parsing_notes.push(
                `Generation link extraction error for ${dataType}: ${error.message}`
            );
        }
    }

    /**
     * Fetch learnset data from external Bulbapedia link
     */
    async fetchBulbapediaLearnsetData(learnsetPath) {
        try {
            const fullUrl = `https://bulbapedia.bulbagarden.net${learnsetPath}`;
            const html = await this.queueRequest(fullUrl, 'bulbapedia');
            const $ = cheerio.load(html);

            const learnset = [];

            // Find the "By leveling up" section first
            let foundLearnsetTable = false;

            $('h4').each((i, h4Element) => {
                const $h4 = $(h4Element);
                const h4Text = $h4.text().trim();

                if (h4Text.includes('By leveling up') && !foundLearnsetTable) {
                    // Look for the first table after this heading
                    let $currentElement = $h4;
                    while ($currentElement.length > 0) {
                        $currentElement = $currentElement.next();

                        if ($currentElement.is('table')) {
                            // Look for the inner sortable table within this outer table
                            const $innerTable = $currentElement.find('table.sortable');
                            if ($innerTable.length > 0) {
                                // Use the inner sortable table for parsing
                                $innerTable.find('tr').each((j, row) => {
                                    const $row = $(row);
                                    const cells = $row.find('td');

                                    if (cells.length >= 2) {
                                        // Extract level from the first cell, but ignore hidden spans
                                        const $levelCell = $(cells[0]);
                                        // Remove hidden spans and get only visible text
                                        const $levelCellClone = $levelCell.clone();
                                        $levelCellClone
                                            .find('span[style*="display:none"]')
                                            .remove();
                                        const levelText = $levelCellClone.text().trim();

                                        const moveText = $(cells[1]).text().trim();

                                        // Skip header rows
                                        if (levelText === 'Level' || moveText === 'Move') {
                                            return true; // continue to next row
                                        }

                                        // Parse level
                                        let level;
                                        if (
                                            levelText === 'Start' ||
                                            levelText === '—' ||
                                            levelText === '-'
                                        ) {
                                            level = 0;
                                        } else {
                                            const levelNum = parseInt(levelText);
                                            level = !isNaN(levelNum) ? levelNum : 0;
                                        }

                                        if (moveText && moveText.length > 0) {
                                            learnset.push({
                                                level: level,
                                                attack_name: moveText,
                                            });
                                        }
                                    }
                                });
                            } else {
                                // Fallback: if no inner sortable table, process the outer table but skip problematic rows
                                $currentElement.find('tr').each((j, row) => {
                                    const $row = $(row);
                                    const cells = $row.find('td');

                                    if (cells.length >= 2) {
                                        // Skip rows where the first cell contains nested table structures
                                        const $levelCell = $(cells[0]);
                                        if ($levelCell.find('table').length > 0) {
                                            return true; // Skip this row, it contains nested tables
                                        }

                                        // Remove hidden spans and get only visible text
                                        const $levelCellClone = $levelCell.clone();
                                        $levelCellClone
                                            .find('span[style*="display:none"]')
                                            .remove();
                                        const levelText = $levelCellClone.text().trim();

                                        const moveText = $(cells[1]).text().trim();

                                        // Skip header rows
                                        if (levelText === 'Level' || moveText === 'Move') {
                                            return true; // continue to next row
                                        }

                                        // Parse level
                                        let level;
                                        if (
                                            levelText === 'Start' ||
                                            levelText === '—' ||
                                            levelText === '-'
                                        ) {
                                            level = 0;
                                        } else {
                                            const levelNum = parseInt(levelText);
                                            level = !isNaN(levelNum) ? levelNum : 0;
                                        }

                                        if (moveText && moveText.length > 0) {
                                            learnset.push({
                                                level: level,
                                                attack_name: moveText,
                                            });
                                        }
                                    }
                                });
                            }

                            foundLearnsetTable = true;
                            break; // Found the table, stop looking
                        }
                    }

                    return false; // Break out of h4 loop
                }
            });

            return learnset;
        } catch (error) {
            console.error(`Failed to fetch learnset data from ${learnsetPath}:`, error.message);
            return [];
        }
    }

    /**
     * Fetch TM compatibility data from external Bulbapedia link
     */
    async fetchBulbapediaTMData(tmPath) {
        try {
            const fullUrl = `https://bulbapedia.bulbagarden.net${tmPath}`;
            const html = await this.queueRequest(fullUrl, 'bulbapedia');
            const $ = cheerio.load(html);

            const tmList = [];

            // Look for the TM table
            $('table').each((i, table) => {
                const $table = $(table);
                const tableText = $table.text();

                // Find table with TM data (contains TM#, Move, Type, etc.)
                if (
                    tableText.includes('TM') &&
                    (tableText.includes('Move') || tableText.includes('Type'))
                ) {
                    $table.find('tr').each((j, row) => {
                        const $row = $(row);
                        const cells = $row.find('td');

                        if (cells.length >= 2) {
                            const secondCell = $(cells[1]).text().trim(); // TM numbers are in the second cell

                            // Look for TM/HM patterns
                            const tmMatch = secondCell.match(/^(TM|HM)(\d{2})$/);
                            if (tmMatch) {
                                tmList.push(tmMatch[0]); // e.g., "TM01", "HM05"
                            }
                        }
                    });

                    if (tmList.length > 0) return false; // break after finding the table
                }
            });

            return tmList;
        } catch (error) {
            console.error(`Failed to fetch TM data from ${tmPath}:`, error.message);
            return [];
        }
    }

    /**
     * Extract evolution chain from Bulbapedia evolution data table
     */
    extractBulbapediaEvolutionChain($evolutionTable) {
        try {
            const evolutionChain = [];
            const tableText = $evolutionTable.text();

            // Use the working pattern from debug - matches "Level N→ First/Second Evolution Pokemon"
            const evolutionPattern =
                /Level\s+(\d+)→\s*(?:First|Second)\s+Evolution\s+([A-Z][a-z]+)/g;
            const evolutionMatches = [...tableText.matchAll(evolutionPattern)];

            for (const match of evolutionMatches) {
                const level = parseInt(match[1]);
                const pokemonName = match[2];

                evolutionChain.push({
                    level: level,
                    method: 'level',
                    evolves_to: pokemonName,
                });
            }

            return evolutionChain;
        } catch (error) {
            console.log('Error in extractBulbapediaEvolutionChain:', error.message);
            return [];
        }
    }

    /**
     * Extract effort values from Bulbapedia
     */
    extractEffortValues($) {
        const effortValues = {};

        // Look for effort values in various table formats
        $('table').each((i, table) => {
            const $table = $(table);
            const tableText = $table.text();

            if (tableText.includes('Effort points')) {
                $table.find('td').each((j, cell) => {
                    const cellText = $(cell).text().trim();

                    // Match patterns like "1 HP", "2 Attack", etc.
                    const evMatch = /(\d+)\s+(HP|Attack|Defense|Sp\.\s*Atk|Sp\.\s*Def|Speed)/i.exec(
                        cellText
                    );
                    if (evMatch) {
                        const value = parseInt(evMatch[1]);
                        const stat = evMatch[2].toLowerCase().replace(/\s/g, '').replace('.', '');

                        // Normalize stat names
                        const statMap = {
                            hp: 'hp',
                            attack: 'attack',
                            defense: 'defense',
                            spatk: 'spAttack',
                            spdef: 'spDefense',
                            speed: 'speed',
                        };

                        if (statMap[stat]) {
                            effortValues[statMap[stat]] = value;
                        }
                    }
                });
            }
        });

        return effortValues;
    }

    /**
     * Extract Pokedex entry from Bulbapedia
     */
    extractPokedexEntry($) {
        let pokedexEntry = '';

        // Look for Pokedex entries in various sections
        $('.mw-parser-output p').each((i, p) => {
            const text = $(p).text().trim();

            // Skip navigation, headers, and very short text
            if (text.length < 20 || text.includes('Navigation') || text.includes('Categories')) {
                return;
            }

            // Look for descriptive text that sounds like a Pokedex entry
            if (!pokedexEntry && text.length > 30 && text.length < 200) {
                // Check if it's describing the Pokemon
                if (
                    text.includes('Pokémon') ||
                    text.includes('Pokemon') ||
                    /\b(plant|seed|fire|water|electric|grass|poison)\b/i.test(text)
                ) {
                    pokedexEntry = text;
                }
            }
        });

        return pokedexEntry;
    }

    /**
     * Save fetched data to file
     */
    async saveToFile(data, filename) {
        try {
            const filePath = path.join(__dirname, '..', 'data', 'validation', filename);

            // Ensure directory exists
            await fs.mkdir(path.dirname(filePath), { recursive: true });

            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`Data saved to: ${filePath}`);
        } catch (error) {
            console.error(`Failed to save data to ${filename}:`, error.message);
        }
    }
}

module.exports = ServerPokemonDataFetcher;
