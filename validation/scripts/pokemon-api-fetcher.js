const fs = require('fs').promises;
const path = require('path');

async function fetchPokeApiData(element) {
    const dataFilePath = path.join(
        __dirname,
        '..',
        'data',
        'gen1-source',
        'pokemon',
        `${element.name}.json`
    );

    const response = await fetch(element.url);

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const apiData = await response.json();
    console.log('Successfully fetched data from API');

    await fs.writeFile(dataFilePath, JSON.stringify(apiData, null, 2), 'utf8');
    console.log(`Data saved to: ${dataFilePath}`);
}

async function checkLocalData(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const parsedData = JSON.parse(data);

        return parsedData;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }

        console.error('Error reading local data:', error.message);
        return null;
    }
}

async function fetchApiLinks() {
    const apiLinks = [];
    const localData = await checkLocalData(path.join(__dirname, '..', 'data', 'generation1.json'));

    for (let species of localData.pokemon_species) {
        apiLinks.push({
            name: species.name,
            url: species.url,
        });
    }

    for (const element of apiLinks) {
        fetchPokeApiData(element);
    }

    return apiLinks;
}

async function buildPokemonData() {
    const folderPath = path.join(__dirname, '..', 'data', 'gen1-source', 'pokemon');
    const outputPath = path.join(__dirname, '..', '..', 'data', 'core', 'gen1', 'pokemon.json');

    // Convert pokemonName to Title Case
    function titleCase(pokemonName) {
        return pokemonName
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    try {
        const pokemon = await fs.readdir(folderPath);
        const pokemonData = {}; // Use object with ID as key

        for (const file of pokemon) {
            const filePath = path.join(folderPath, file);
            const data = await fs.readFile(filePath, 'utf8');
            const parsedData = JSON.parse(data);

            // Extract pokedex number and name
            const pokedexId = parsedData.id;
            const pokemonName = titleCase(parsedData.name);

            // Use pokedex ID as key, name as value
            pokemonData[pokedexId] = {
                name: pokemonName,
            };

            console.log(`Processed: ${pokemonName} (ID: ${pokedexId})`);
        }

        // Write complete file once
        await fs.writeFile(outputPath, JSON.stringify(pokemonData, null, 2), 'utf8');
        console.log(`Pokemon data written to: ${outputPath}`);
    } catch (error) {
        console.error('Error building Pokemon data:', error.message);
        throw error;
    }
}

if (require.main === module) {
    buildPokemonData();
}
