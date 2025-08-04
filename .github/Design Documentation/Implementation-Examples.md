# Implementation Examples

## Overview

This document provides practical code examples and implementation patterns for the Pokemon Walkthrough Project. These examples demonstrate how to implement key features using vanilla JavaScript with the established architecture patterns.

## Data Merging Strategy

```javascript
// Merge base and game-specific Pokemon data
const getPokemonData = (pokemonId, gameId) => {
    const baseData = pokemonBase[pokemonId];
    const gameData = gameSpecific[gameId][pokemonId] || {};

    // Game data completely overrides base data properties
    return { ...baseData, ...gameData };
};
```

## Real-time Step Counter Updates

```javascript
// Update step counter when checkbox state changes
function updateStepCounter(locationId) {
    const checkboxes = document.querySelectorAll(
        `input[data-location="${locationId}"]`
    );
    const uncheckedCount = Array.from(checkboxes).filter(
        cb => !cb.checked
    ).length;
    const counter = document.querySelector(
        `.step-counter[data-location="${locationId}"]`
    );

    if (counter) {
        counter.textContent = uncheckedCount;

        // Visual completion indicator
        if (uncheckedCount === 0) {
            counter.parentElement.innerHTML =
                counter.parentElement.innerHTML.replace(
                    ' steps remaining',
                    ' steps - ✅ Complete!'
                );
        }
    }
}
```

## Step Data Tracking

```javascript
// Capture rich data when steps are completed
function handleStepCompletion(stepElement) {
    const stepData = {
        stepId: stepElement.id,
        completed: stepElement.checked,
        timestamp: new Date().toISOString(),
        tags: stepElement.dataset.tags?.split(',') || [],
        category: stepElement.dataset.category,
    };

    // Capture additional data based on step type
    if (stepElement.dataset.pokemon) {
        const levelInput = stepElement.parentElement.querySelector(
            '[data-field="level"]'
        );
        const encountersInput = stepElement.parentElement.querySelector(
            '[data-field="encountersBeforeCatch"]'
        );
        stepData.pokemon = {
            name: stepElement.dataset.pokemon,
            level: levelInput?.value || null,
            location: stepElement.dataset.location,
            encountersBeforeCatch: encountersInput?.value || 1,
        };
    }

    if (stepElement.dataset.choice) {
        stepData.choice = stepElement.dataset.choice;
    }

    // Save to progress tracking
    saveStepProgress(stepData);
}
```

## Tag-based Filtering

```javascript
// Filter steps based on user preferences
function filterStepsByTags(includeTags = [], excludeTags = []) {
    const steps = document.querySelectorAll('.step');

    steps.forEach(step => {
        const stepTags = step.dataset.tags?.split(',') || [];

        const shouldInclude =
            includeTags.length === 0 ||
            includeTags.some(tag => stepTags.includes(tag));
        const shouldExclude = excludeTags.some(tag => stepTags.includes(tag));

        if (shouldInclude && !shouldExclude) {
            step.style.display = '';
        } else {
            step.style.display = 'none';
        }
    });
}

// Example usage:
// filterStepsByTags(['story', 'required'], ['optional']); // Show only required story steps
// filterStepsByTags(['pokemon'], []); // Show only Pokemon-related steps
```

## Cross-Location Pokemon Auto-Complete

```javascript
// Auto-check Pokemon across all locations when one is caught
function handlePokemonCaught(pokemonName, gameId) {
    const autoCheckEnabled = this.globalProgress.preferences.autoCheckPokemon;

    if (autoCheckEnabled) {
        // Find all checkboxes for this Pokemon in the current game
        const pokemonCheckboxes = document.querySelectorAll(
            `input[data-pokemon="${pokemonName}"]`
        );

        pokemonCheckboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                checkbox.checked = true;
                // Trigger the completion handler for each location
                handleStepCompletion(checkbox);
                // Update step counters for affected locations
                updateStepCounter(checkbox.dataset.location);
            }
        });

        this.emit('pokemon:auto-completed', {
            pokemon: pokemonName,
            locations: pokemonCheckboxes.length,
        });
    }
}
```

## Name Personalization System

```javascript
// Replace placeholder names throughout the walkthrough
function personalizeContent(playerName, rivalName) {
    // Replace all instances of placeholder names in labels and text
    const walkthrough = document.querySelector('.walkthrough-content');

    if (walkthrough) {
        walkthrough.innerHTML = walkthrough.innerHTML
            .replace(/\{PLAYER\}/g, playerName || 'PLAYER')
            .replace(/\{RIVAL\}/g, rivalName || 'RIVAL')
            .replace(/your rival/g, rivalName || 'your rival')
            .replace(/You \(/g, `${playerName || 'You'} (`);
    }

    // Save names to progress data
    this.gameProgress.choices.playerName = playerName;
    this.gameProgress.choices.rivalName = rivalName;
    this.saveProgress();
}
```

## Encounter Tracking System

```javascript
// Track Pokemon encounters without catching (for Floating Action Panel)
function incrementPokemonEncounter(
    pokemonName,
    location,
    encounterType = 'wild',
    trainer = null
) {
    const encounterId = `encounter-${pokemonName}-${location}`;

    // Update encounter count in temporary tracking
    if (!this.encounterTracking) {
        this.encounterTracking = {};
    }

    if (!this.encounterTracking[encounterId]) {
        this.encounterTracking[encounterId] = {
            pokemon: pokemonName,
            location: location,
            encounters: 0,
        };
    }

    this.encounterTracking[encounterId].encounters++;

    // Also add to permanent encounter log
    this.addPokemonEncounter(pokemonName, {
        location: location,
        type: encounterType,
        trainer: trainer,
        timestamp: new Date().toISOString(),
    });

    // Update UI to show encounter count
    const encounterDisplay = document.querySelector(
        `[data-encounter="${encounterId}"]`
    );
    if (encounterDisplay) {
        encounterDisplay.textContent = `${this.encounterTracking[encounterId].encounters} encounters`;
    }

    this.emit('pokemon:encountered', {
        pokemon: pokemonName,
        location: location,
        type: encounterType,
        totalEncounters: this.encounterTracking[encounterId].encounters,
    });
}

// Add encounter to permanent log
function addPokemonEncounter(pokemonName, encounterData) {
    if (!this.gameProgress.pokemon[pokemonName]) {
        this.gameProgress.pokemon[pokemonName] = {
            totalEncounters: 0,
            encounters: [],
            catches: [],
        };
    }

    this.gameProgress.pokemon[pokemonName].encounters.push(encounterData);
    this.gameProgress.pokemon[pokemonName].totalEncounters++;

    this.saveProgress();
}

// When Pokemon is actually caught, merge encounter data
function handlePokemonCaught(pokemonName, location, level) {
    const encounterId = `encounter-${pokemonName}-${location}`;
    const encounterData = this.encounterTracking?.[encounterId];

    const catchData = {
        location: location,
        level: level,
        timestamp: new Date().toISOString(),
        encountersBeforeCatch: encounterData?.encounters || 1,
    };

    // Add to catches array
    if (!this.gameProgress.pokemon[pokemonName]) {
        this.gameProgress.pokemon[pokemonName] = {
            totalEncounters: 0,
            encounters: [],
            catches: [],
        };
    }

    this.gameProgress.pokemon[pokemonName].catches.push(catchData);

    // Set first caught location if this is the first catch
    if (!this.gameProgress.pokemon[pokemonName].firstCaught) {
        this.gameProgress.pokemon[pokemonName].firstCaught = location;
    }

    // Clear temporary encounter tracking for this Pokemon/location
    if (this.encounterTracking?.[encounterId]) {
        delete this.encounterTracking[encounterId];
    }

    return {
        pokemon: {
            name: pokemonName,
            level: level,
            location: location,
            encountersBeforeCatch: catchData.encountersBeforeCatch,
        },
    };
}
```

## Integration with Main Architecture

These implementation examples work with the core architecture patterns defined in the main documentation:

- **Event-driven communication**: Examples use `this.emit()` for module communication
- **Data persistence**: Examples integrate with the localStorage-based progress system
- **Accessibility considerations**: Examples maintain proper DOM structure and ARIA support
- **Performance optimization**: Examples use efficient DOM queries and minimize reflow

## Usage Guidelines

When implementing these examples:

1. **Follow naming conventions**: Use established CSS classes and data attributes
2. **Maintain event consistency**: Use the defined event naming patterns
3. **Preserve accessibility**: Ensure all interactions remain keyboard and screen reader accessible
4. **Test cross-browser**: Verify functionality across supported browsers
5. **Document changes**: Update relevant documentation when modifying implementations

## Related Documentation

- **[Architecture Overview](./Architecture-Overview.md)** - Core architectural patterns and decisions
- **[JavaScript Modules](./JavaScript-Modules.md)** - Detailed module specifications and interfaces
- **[HTML Patterns](./HTML-Patterns.md)** - HTML structure and markup patterns
- **[CSS Architecture](./CSS-Architecture.md)** - Styling patterns and component structure
- **[Accessibility Standards](./Accessibility-Standards.md)** - Accessibility implementation requirements
