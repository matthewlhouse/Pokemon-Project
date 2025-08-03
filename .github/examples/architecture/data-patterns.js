/**
 * Data structure patterns demonstrating the Base + Override approach
 * and Progress Aggregation patterns used in the Pokemon Walkthrough Project
 */

// Base + Override Pattern
// =====================

// Base Pokemon data (shared across games)
const basePokemonData = {
  "001": {
    "name": "Bulbasaur",
    "type": ["Grass", "Poison"],
    "stats": { "hp": 45, "attack": 49, "defense": 49 },
    "evolution": { "evolves_to": "002", "level": 16 }
  }
};

// Game-specific overrides
const gameOverrides = {
  "yellow": {
    "001": {
      "locations": ["starter-pokemon", "cerulean-city-trade"],
      "encounters": { "cerulean-city": { "method": "trade", "rate": "100%" } }
    }
  },
  "red-blue": {
    "001": {
      "locations": ["starter-pokemon"],
      "encounters": {}
    }
  }
};

// Runtime data resolution
function getPokemonData(pokemonId, gameVersion) {
  const baseData = basePokemonData[pokemonId];
  const overrideData = gameOverrides[gameVersion]?.[pokemonId] || {};
  
  return mergeDeep(baseData, overrideData);
}

// Deep merge utility function
function mergeDeep(target, source) {
  const output = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = mergeDeep(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  
  return output;
}

// Progress Aggregation Pattern
// ===========================

// Individual game progress
const gameProgress = {
  "red-blue": {
    "metadata": {
      "version": "1.0.0",
      "lastModified": "2024-01-15T10:30:00Z",
      "gameId": "red-blue"
    },
    "steps": {
      "pallet-town-1": true,
      "pallet-town-2": false
    },
    "pokemon": {
      "001": { "caught": true, "level": 16, "location": "pallet-town" }
    }
  }
};

// Cross-game aggregated data
const globalProgress = {
  "livingPokedex": {
    "001": {
      "caught": true,
      "games": ["red-blue", "yellow"],
      "firstCaught": "2024-01-15T09:00:00Z",
      "locations": ["pallet-town", "route-1"]
    }
  },
  "statistics": {
    "totalStepsCompleted": 150,
    "totalPokemonCaught": 45,
    "gamesStarted": 3,
    "gamesCompleted": 1
  }
};

// Example aggregation function
function aggregateProgressAcrossGames(gameProgressData) {
  const aggregated = {
    livingPokedex: {},
    statistics: {
      totalStepsCompleted: 0,
      totalPokemonCaught: 0,
      gamesStarted: 0,
      gamesCompleted: 0
    }
  };

  Object.entries(gameProgressData).forEach(([gameId, progress]) => {
    // Aggregate steps
    const completedSteps = Object.values(progress.steps || {}).filter(Boolean).length;
    aggregated.statistics.totalStepsCompleted += completedSteps;
    
    // Aggregate Pokemon
    Object.entries(progress.pokemon || {}).forEach(([pokemonId, pokemonData]) => {
      if (!aggregated.livingPokedex[pokemonId]) {
        aggregated.livingPokedex[pokemonId] = {
          caught: false,
          games: [],
          locations: []
        };
      }
      
      if (pokemonData.caught) {
        aggregated.livingPokedex[pokemonId].caught = true;
        aggregated.livingPokedex[pokemonId].games.push(gameId);
        aggregated.livingPokedex[pokemonId].locations.push(pokemonData.location);
      }
    });
    
    aggregated.statistics.gamesStarted++;
    if (completedSteps > 0) {
      // Consider game "completed" if significant progress made
      aggregated.statistics.gamesCompleted++;
    }
  });
  
  aggregated.statistics.totalPokemonCaught = Object.values(aggregated.livingPokedex)
    .filter(pokemon => pokemon.caught).length;
  
  return aggregated;
}

export { 
  basePokemonData, 
  gameOverrides, 
  getPokemonData, 
  mergeDeep,
  gameProgress,
  globalProgress,
  aggregateProgressAcrossGames
};
