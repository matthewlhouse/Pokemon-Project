# Pokemon Project - Data Architecture

## 📊 Overview

This folder contains all Pokemon game data organized for maintainability, scalability, and accuracy. The architecture supports multiple games with shared core data and game-specific overrides.

## 🏗️ Folder Structure

````text
data/
├── core/                        # Shared data organized by generation
│   ├── gen1/                   # Generation I (Red/Blue/Yellow) - Kanto
│   │   ├── pokemon.json        # Complete Gen I Pokemon database  
│   │   ├── moves.json          # All moves available in Gen I
│   │   ├── items.json          # Items, pokeballs, medicine, TMs/HMs
│   │   └── types.json          # Type effectiveness chart (15 types)
│   ├── gen2/                   # Generation II (Gold/Silver/Crystal) - Johto
│   │   └── README.md           # Placeholder for future implementation
│   └── gen3/                   # Generation III (Ruby/Sapphire/Emerald) - Hoenn  
│       └── README.md           # Placeholder for future implementation
├── games/                       # Game-specific data and overrides
│   ├── red/                    # Pokemon Red specific data
│   │   ├── encounters.json     # Wild Pokemon encounter data
│   │   ├── trainers.json       # Trainer battle data  
│   │   ├── items.json          # Item locations and shops
│   │   └── overrides.json      # Game-specific data overrides
│   ├── blue/                   # Pokemon Blue specific data
│   │   ├── encounters.json     # (Same structure as Red)
│   │   └── overrides.json      # Blue version exclusives
│   └── yellow/                 # Pokemon Yellow specific data
│       ├── encounters.json     # Pikachu starter + unique encounters
│       └── overrides.json      # Yellow-specific features
└── validation/                  # Data validation and quality assurance
    ├── statistics.json         # Field-level validation statistics  
    └── in-game-validated.json  # In-game validation tracking

````

## 🎯 Design Principles

### **1. Shared Core + Game Overrides**

- **`core/`** contains data common to all games (Pokemon stats, moves, types)
- **`games/[game]/`** contains only game-specific differences and additions
- **Override system** allows game-specific files to modify or extend core data

### **2. Separation of Concerns**

- **Core data** focuses on Pokemon properties (stats, types, evolution)
- **Game data** focuses on gameplay elements (encounters, trainers, items)
- **Validation data** tracks data quality and verification status

### **3. Structured Data Categories**

- **encounters.json** - Wild Pokemon locations, rates, levels
- **trainers.json** - Gym leaders, rivals, NPCs with Pokemon teams
- **items.json** - Item locations, shops, gifts, hidden items
- **overrides.json** - Version exclusives, game-specific mechanics

## 📈 Data Usage Patterns

### **Loading Pokemon Data**

1. Load base Pokemon data from `core/gen1/pokemon.json`
2. Load additional data (moves, items, types) from respective `core/gen1/` files
3. Apply game-specific overrides from `games/[game]/overrides.json`
4. Combine with encounter data from `games/[game]/encounters.json`

### **Version Differences**

- **Red/Blue**: Version exclusive Pokemon, different encounter rates
- **Yellow**: Pikachu starter, anime-inspired changes, unique mechanics

### **Validation System**

- **statistics.json**: Tracks accuracy and completeness of each data field
- **in-game-validated.json**: Records data verified through actual gameplay
- **Quality assurance**: 75% external sources + 25% in-game validation target

## 🔧 Maintenance Guidelines

### **Adding New Pokemon Data**

1. Add base information to appropriate `core/gen[X]/pokemon.json`
2. Add move data to `core/gen[X]/moves.json` 
3. Add item data to `core/gen[X]/items.json`
4. Add game-specific encounters to appropriate `games/[game]/encounters.json`
5. Update validation tracking as data is verified

### **Adding New Games**

1. Create folder under `games/[game-name]/`
2. Create standard files: `encounters.json`, `trainers.json`, `items.json`, `overrides.json`
3. Document game-specific mechanics in `overrides.json`

### **Data Validation**

1. All changes should update validation timestamps
2. Critical data requires in-game verification
3. Source conflicts should be documented and resolved

## 🎮 Game-Specific Notes

### **Pokemon Red**

- Original Red version encounters and trainers
- Red version exclusive Pokemon (Ekans, Arbok, Vulpix, Ninetales, etc.)

### **Pokemon Blue**

- Blue version encounters (some differences from Red)
- Blue version exclusive Pokemon (Sandshrew, Sandslash, Growlithe, Arcanine, etc.)

### **Pokemon Yellow**

- Pikachu starter with special mechanics
- Anime-inspired changes (Team Rocket battles, gym leader differences)
- Unique encounter tables with wild Pikachu availability

## 📊 Future Expansion

This architecture is designed to scale for:

- **Additional Generations** (Gen II, III, IV, etc.)
- **Remakes and variants** (FireRed/LeafGreen, Let's Go, etc.)
- **Enhanced data types** (abilities, natures, regional forms)
- **Walkthrough integration** (step-by-step progress tracking)

---

*Last Updated: August 5, 2025*
*Architecture Version: 2.0.0*
