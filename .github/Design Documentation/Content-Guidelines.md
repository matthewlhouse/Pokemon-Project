# Content Guidelines

## Overview

This document establishes standards for writing, organizing, and maintaining content in the Pokemon Walkthrough Project to ensure consistency, accuracy, and accessibility across all Pokemon games.

## Writing Standards

### Tone and Voice

- **Clear and Direct**: Use simple, actionable language that gets straight to the point
- **Friendly but Professional**: Maintain enthusiasm for Pokemon while being respectful and inclusive
- **Player-Focused**: Write from the player's perspective, addressing them directly with "you"
- **Accessible**: Use plain language that works for all reading levels and screen readers

### Writing Style Guidelines

```markdown
<!-- GOOD: Clear, direct instructions -->
Go to Professor Oak's lab and choose your starter Pokemon.

<!-- AVOID: Vague or flowery language -->
Make your way over to the esteemed Professor Oak's research facility where you'll embark on the momentous decision of selecting your loyal companion.

<!-- GOOD: Specific actions -->
Heal your Pokemon at the Pokemon Center before challenging Brock.

<!-- AVOID: Assumptions about player knowledge -->
Obviously, you'll want to heal up before the gym battle.

<!-- GOOD: Inclusive language -->
Choose the starter that matches your preferred play style.

<!-- AVOID: Gendered assumptions -->
Pick the starter any guy would want for this game.
```

### Action-Oriented Instructions

```markdown
<!-- Structure: Action + Location/Context + Purpose (if helpful) -->

<!-- Basic Step Pattern -->
- Talk to the girl near the PC to receive a Potion
- Battle the Youngster on Route 1 (optional)
- Enter Viridian City and visit the Pokemon Center

<!-- Choice Steps -->
Choose your starter Pokemon:
- **Bulbasaur** (Grass/Poison) - Good against first two gyms
- **Charmander** (Fire) - Challenging early game, powerful late game  
- **Squirtle** (Water) - Balanced throughout the game

<!-- Battle Instructions -->
Battle Brock (Pewter Gym Leader):
- His team: Geodude (Lv. 12), Onix (Lv. 14)
- Effective types: Water, Grass, Fighting, Ground, Steel
- Reward: Boulder Badge, TM39 (Rock Tomb)

<!-- Item Collection -->
Find the hidden items in Viridian Forest:
- **Antidote** - Behind the tree near the northwest entrance
- **Poké Ball** - In the grass patch near the Bug Catcher
- **Potion** - Next to the large tree in the center area
```

### Spoiler Management

```markdown
<!-- Spoiler Levels -->
[spoiler-free] - No story details, character names, or plot points
[minor-spoilers] - Basic story context, no major reveals
[major-spoilers] - Full story details, character motivations, plot twists

<!-- Spoiler Markup -->
<details class="spoiler minor-spoilers">
<summary>Story Context (Minor Spoilers)</summary>
Team Rocket is causing trouble in the Silph Co. building. You'll need to help stop them.
</details>

<details class="spoiler major-spoilers">
<summary>Full Story Details (Major Spoilers)</summary>
Giovanni is the leader of Team Rocket and also the Viridian City Gym Leader.
</details>
```

## Content Organization

### Hierarchical Structure

```markdown
# Game Title (Pokemon Red/Blue)

## Location (Pallet Town)
Brief description of the location and its significance.

### Sub-location or Major Event (Professor Oak's Lab)
Context for this specific area or event.

#### Individual Steps
- Specific actionable instructions
- Each step should be independently completable
- Steps should flow logically from one to the next
```

### Step Categories and Tags

#### Required Step Categories

```markdown
<!-- Story Progression -->
data-category="story"
data-tags="required,story-critical"

<!-- Pokemon Encounters -->
data-category="pokemon" 
data-tags="pokemon-encounter,wild-pokemon"

<!-- Trainer Battles -->
data-category="trainer-battle"
data-tags="trainer-battle,experience"

<!-- Gym Battles -->
data-category="gym-battle"
data-tags="gym-battle,story-critical,required"

<!-- Item Collection -->
data-category="item"
data-tags="item-collection,useful-item"

<!-- Game Progression -->
data-category="progression"
data-tags="required,story-progression"

<!-- Player Choices -->
data-category="choice"
data-tags="player-choice,permanent-effect"

<!-- Setup/Preparation -->
data-category="setup"
data-tags="preparation,optional"
```

#### Common Tag Combinations

```markdown
<!-- Required story steps -->
data-tags="required,story-critical,no-skip"

<!-- Optional but recommended -->
data-tags="optional,recommended,helpful"

<!-- Pokemon-focused content -->
data-tags="pokemon-encounter,pokedex,completionist"

<!-- Battle preparation -->
data-tags="preparation,trainer-battle,level-grinding"

<!-- Version differences -->
data-tags="version-red,version-blue,version-specific"

<!-- Accessibility considerations -->
data-tags="audio-cue,visual-indicator,timing-sensitive"

<!-- Spoiler classifications -->
data-tags="spoiler-free,minor-spoilers,major-spoilers"
```

### Location Organization

```markdown
<!-- Location Header Template -->
## Pallet Town
**Region:** Kanto  
**Population:** 2 (Red/Blue)  
**Notable Features:** Professor Oak's Lab, Your House, Rival's House  
**Key Items:** Pokedex, Starter Pokemon, Town Map  
**Connected Routes:** Route 1 (North), Route 21 (South via Surf)

### Your House
Starting location. Your mom will heal your Pokemon throughout the game.

#### Initial Setup
- [Setup] Check the PC in your room (optional)
- [Setup] Check the TV for game hints (optional)  
- [Story] Go downstairs and talk to your mom

### Professor Oak's Lab
Where you'll receive your starter Pokemon and Pokedex.

#### Getting Your Starter
- [Story] Enter the lab and approach Professor Oak
- [Choice] Choose your starter Pokemon:
  - **Bulbasaur** (Grass/Poison) - Easiest early game
  - **Charmander** (Fire) - Moderate difficulty  
  - **Squirtle** (Water) - Balanced difficulty
- [Story] Your rival will choose the Pokemon with type advantage
- [Story] Battle your rival (first battle tutorial)
```

## Data Accuracy Standards

### Pokemon Information Requirements

All Pokemon data must be verified against reliable sources and include complete information for each game version.

**Required Data Points:**

- Species name and National Pokedex number
- Type(s) with version differences noted
- Location availability and encounter rates
- Level ranges for each location
- Evolution requirements and methods
- Base stats if relevant to strategy
- Notable moves available at encounter

**Version Differences Documentation:**

- Clearly identify version-exclusive content
- Note any stat or type changes between games
- Document regional variants and their differences
- Specify encounter rate variations

**Implementation Reference:** See [content-validation.js](../../examples/content/content-validation.js) for automated Pokemon data accuracy checking and validation rules.

### Battle Information Accuracy

**Trainer Battle Requirements:**

- Complete team rosters with levels
- Move sets for significant battles
- Prize money and badge/item rewards
- Strategic recommendations
- Counter-strategies for different starter choices

**Verification Process:**

- Cross-reference against official guides
- Test in-game when possible
- Compare across multiple reliable sources
- Validate version-specific differences

**Implementation Reference:** The content validation system includes comprehensive battle data checking to ensure accuracy across all trainer encounters.

## Tagging System Implementation

### Comprehensive Tag Categories

The Pokemon Walkthrough Project uses a comprehensive tagging system to organize content, enable filtering, and support accessibility features. Tags are organized into logical categories that support different user goals and content types.

**Core Tag Categories:**

- **Gameplay Tags**: Story progression, Pokemon encounters, battle types, item management
- **Difficulty and Completion Tags**: Required vs optional content, difficulty indicators, timing considerations
- **Accessibility and User Experience Tags**: Screen reader support, spoiler management, user preferences
- **Version-Specific Tags**: Content variations between Pokemon game versions

**Implementation Reference:** See [tagging-system.js](../../examples/content/tagging-system.js) for the complete tag validation system, filtering utilities, and categorization patterns.

### Tag Usage Standards

**Consistency Requirements:**

- All steps must have at least 2-3 descriptive tags
- Required steps must include both `required` and a story progression tag
- Optional content should be clearly marked with appropriate difficulty indicators
- Version-specific content must include version tags

**Validation Rules:**

- Conflicting tags (like `required` and `optional`) are automatically flagged
- Missing critical tags for story-important content generate warnings
- Tag combinations are validated against established patterns

**Implementation Reference:** The tagging system includes comprehensive validation rules and automated checking to ensure consistency across all content.

## Version Differences Documentation

### Multi-Version Content Strategy

The Pokemon series features multiple versions of each generation with exclusive Pokemon, different encounter rates, and varied story elements. Our content management system handles these differences through version-specific tagging and conditional content display.

**Version Management Principles:**

- Base content applies to all versions unless specifically noted
- Version-specific content is clearly marked and easily filterable
- Encounter rates and Pokemon availability differences are documented
- Trainer battle variations are noted where significant

**Content Organization:**

- Shared content forms the foundation for all versions
- Version-exclusive content is tagged appropriately
- Significant gameplay differences are highlighted
- Evolution method variations are documented clearly

**Implementation Reference:** See [content-templates.html](../../examples/content/content-templates.html) for complete version difference handling patterns and [tagging-system.js](../../examples/content/tagging-system.js) for version-specific tag management.

### Version-Specific Tags and Data

**Version Detection and Filtering:**

The content system uses version-specific tags to enable users to filter content relevant to their chosen Pokemon game version. This ensures players only see information applicable to their playthrough.

**Tag Categories:**

- `version-red`, `version-blue`, `version-yellow` - Game-specific content
- `version-shared` - Content common to all versions of a generation
- `version-rb` - Content shared between Red and Blue only
- `version-exclusive` - Content available in only one version
- `version-difference` - Content that varies between versions

**Implementation Reference:** The version management system includes data structures for handling Pokemon rosters, gym leader variations, and unique features across different game versions.

## Content Maintenance Standards

### Accuracy Verification Process

**Quality Assurance Workflow:**

1. **Source Verification**: All information must be verified against reliable sources
   - Official strategy guides and game documentation
   - Reputable fan sites (Serebii, Bulbapedia) for comprehensive data
   - In-game testing when possible for accuracy confirmation

2. **Cross-Reference Checking**: Compare data across multiple sources
   - Pokemon stats, movesets, and type effectiveness
   - Trainer rosters, levels, and battle rewards
   - Item locations, effects, and availability
   - Evolution requirements and method variations

3. **Version Testing**: Verify version-specific content
   - Test encounter rates where possible
   - Confirm exclusive Pokemon and unique features
   - Validate trainer and gym leader differences

**Implementation Reference:** See [content-validation.js](../../examples/content/content-validation.js) for the complete automated content validation system, including Pokemon data checking, battle information verification, and content quality assurance rules.

### Content Update Workflow

**Review Process Standards:**

The content maintenance workflow ensures all Pokemon walkthrough content maintains high standards of accuracy, accessibility, and consistency. Each content update goes through multiple validation stages.

**Quality Assurance Stages:**

- **Accuracy Check**: Pokemon data, trainer information, and item details verified
- **Accessibility Check**: Proper tagging, spoiler warnings, and clear language
- **Consistency Check**: Writing style, tag usage, and HTML structure compliance
- **User Experience Check**: Logical flow, actionable instructions, and appropriate difficulty

**Implementation Reference:** The content validation system includes comprehensive checking rules for step content, tag validation, writing style assessment, and automated quality assurance workflows.

### Content Quality Assurance

**Automated Validation System:**

The project uses an automated content validation system to maintain consistency and catch common errors before content is published. This system checks for required attributes, validates tag combinations, and ensures content quality standards.

**Validation Categories:**

- **Structure Validation**: Required HTML attributes and proper semantic markup
- **Content Quality**: Text length, clarity, and completeness checks
- **Tag Consistency**: Tag combination validation and category requirements
- **Accessibility Compliance**: Screen reader compatibility and WCAG standards

**Implementation Reference:** The [content-validation.js](../../examples/content/content-validation.js) system provides comprehensive validation rules, automated checking workflows, and content maintenance utilities for ensuring high-quality Pokemon walkthrough content.

## Localization Considerations

### Multi-Language Support Structure

The Pokemon Walkthrough Project is designed with internationalization in mind, supporting multiple languages while maintaining content accuracy and cultural appropriateness.

**Localization Architecture:**

- Content structure designed for easy translation
- Locale-specific data management and preferences
- Cultural adaptation for region-specific Pokemon names and references
- Number formatting and measurement unit considerations

**Implementation Reference:** See [internationalization.js](../../examples/content/internationalization.js) for the complete multi-language support system, including locale detection, translation management, and cultural adaptation patterns.

### Cultural Considerations

**Localization Principles:**

- **Pokemon Names**: Use official localized names where available
- **Game Mechanics**: Some mechanics may be explained differently in different regions
- **Cultural References**: Avoid region-specific references that may not translate
- **Number Formats**: Consider different number formatting conventions (levels, percentages, etc.)

### Future Internationalization Planning

**Implementation Strategy:**

The internationalization system is designed for future expansion to support multiple languages while maintaining the accessibility and usability standards of the English version.

**Supported Languages (Planned):**

- **English** (en) - Primary language
- **Spanish** (es) - Large Pokemon community
- **French** (fr) - Official Pokemon language
- **German** (de) - Major European market
- **Japanese** (ja) - Original Pokemon language
- **Italian** (it) - European market
- **Portuguese** (pt) - Growing Pokemon community

**Translation Priorities:**

1. **Phase 1**: Core walkthrough steps and UI elements
2. **Phase 2**: Pokemon names, move names, item names
3. **Phase 3**: Detailed descriptions and flavor text
4. **Phase 4**: Advanced features and optional content

**Implementation Reference:** The [internationalization.js](../../examples/content/internationalization.js) system provides the foundation for multi-language support with locale detection, translation utilities, and cultural adaptation features.

This comprehensive content guideline ensures consistent, accurate, and accessible content across all Pokemon walkthroughs while maintaining the flexibility to accommodate different games, versions, user preferences, and future internationalization needs.

## Implementation Resources

The content guidelines are supported by comprehensive code examples that demonstrate all patterns and systems described in this document:

### Content Management Examples

- **[tagging-system.js](../../examples/content/tagging-system.js)** - Complete tag management system with validation and filtering
- **[content-templates.html](../../examples/content/content-templates.html)** - HTML templates for all content types with proper semantic structure
- **[content-validation.js](../../examples/content/content-validation.js)** - Automated content quality assurance and validation workflows
- **[internationalization.js](../../examples/content/internationalization.js)** - Multi-language support system with locale management

### Usage Guide

For detailed implementation instructions and examples of all content patterns described in this document, see the [Content Examples README](../../examples/README.md#content-examples-content).

These examples provide working implementations that can be directly used or adapted for content creation, validation, and maintenance workflows.
