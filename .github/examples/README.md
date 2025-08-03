# Code Examples Index

This directory contains practical implementation examples extracted from the Pokemon Walkthrough Project documentation. These examples demonstrate architectural patterns, implementation strategies, and best practices used throughout the application.

## HTML Examples (`/html`)

### Component Templates

- **[component-templates.html](./html/component-templates.html)** - Complete HTML component library
  - Document structure template with semantic HTML5 and accessibility
  - Step element patterns: basic steps, Pokemon catch steps, trainer battles, choices, name inputs
  - Location container patterns with collapsible sections and progress indicators
  - Settings panel structure with display modes, filters, and preferences
  - Form accessibility patterns with proper labeling and error handling
  - Data attribute reference and naming conventions

## Architecture Examples (`/architecture`)

### Core Patterns

- **[event-system.js](./architecture/event-system.js)** - Event-driven architecture with custom EventEmitter
  - EventEmitter implementation with error handling
  - Module communication patterns
  - Progress and UI manager integration examples

- **[data-patterns.js](./architecture/data-patterns.js)** - Data management and persistence patterns
  - Base + Override pattern for Pokemon data
  - Cross-game progress aggregation
  - Data merging and conflict resolution

- **[module-interfaces.js](./architecture/module-interfaces.js)** - Standard module architecture
  - BaseManager abstract class pattern
  - Concrete ProgressManager and UIManager implementations
  - Initialization and cleanup lifecycle management

### UI and Components

- **[html-components.html](./architecture/html-components.html)** - Semantic HTML component templates
  - Step component with accessibility attributes
  - Location section with collapsible details
  - Progress indicators and form patterns
  - Choice components with proper labeling

- **[css-components.css](./architecture/css-components.css)** - Component-based CSS architecture
  - CSS custom properties (design tokens)
  - Component styling patterns
  - Responsive design breakpoints
  - Accessibility features (focus, contrast, motion)

### Advanced Features

- **[performance-patterns.js](./architecture/performance-patterns.js)** - Performance optimization strategies
  - Lazy loading with IntersectionObserver
  - Service Worker caching implementation
  - Core Web Vitals monitoring
  - Resource preloading and optimization

- **[security-patterns.js](./architecture/security-patterns.js)** - Security and validation patterns
  - Input validation and sanitization
  - Content Security Policy helpers
  - Rate limiting implementation
  - Safe DOM manipulation

- **[testing-patterns.js](./architecture/testing-patterns.js)** - Testing strategies and utilities
  - Unit testing with mocks and utilities
  - Integration testing patterns
  - Accessibility testing approaches
  - Performance testing examples

## CSS Examples (`/css`)

### Design Foundation

- **[design-tokens.css](./css/design-tokens.css)** - Complete design system foundation
  - CSS custom properties for consistent theming
  - Generation-based Pokemon color schemes
  - Comprehensive spacing, typography, and breakpoint systems
  - Dark mode and accessibility token integration

- **[component-styles.css](./css/component-styles.css)** - Core component styling patterns
  - Step components with completion states and category-specific styling
  - Location sections with collapsible behavior and progress indicators
  - Form elements with proper focus states and validation styling
  - Interactive elements with hover, focus, and active states

### Responsive Design

- **[responsive-patterns.css](./css/responsive-patterns.css)** - Mobile-first responsive design system
  - Mobile, tablet, and desktop layout strategies
  - Settings panel responsive behavior (overlay → modal → sidebar)
  - Simple vs Rich display mode implementations
  - Container queries and performance optimizations

### Theming and Visual Identity

- **[theme-system.css](./css/theme-system.css)** - Pokemon generation-based themes
  - Generation 1 and 2 color schemes with Pokemon type integration
  - Automatic dark mode adaptation with system preference detection
  - High contrast mode support and reduced motion preferences
  - Theme switching mechanisms and user preference persistence

### Accessibility Implementation

- **[accessibility-styles.css](./css/accessibility-styles.css)** - Comprehensive accessibility patterns
  - WCAG 2.1 AA compliant focus indicators and navigation support
  - Screen reader utilities and live region announcements
  - High contrast mode and reduced motion implementations
  - Keyboard navigation enhancements and touch target accessibility

## Accessibility Examples (`/accessibility`)

### Interaction Patterns

- **[keyboard-navigation.js](./accessibility/keyboard-navigation.js)** - Complete keyboard navigation system
  - Tab order management and focus control
  - Arrow key navigation for related groups
  - Keyboard shortcuts and hotkey handling
  - Focus trap implementation for modals

- **[focus-management.js](./accessibility/focus-management.js)** - Advanced focus management
  - Focus restoration across navigation
  - Dynamic focus indicators
  - Focus containment strategies
  - Screen reader focus announcements

### Screen Reader Support

- **[screen-reader-support.js](./accessibility/screen-reader-support.js)** - Screen reader integration
  - ARIA live regions and announcements
  - Dynamic content updates
  - Context-aware messaging
  - Screen reader testing utilities

- **[form-accessibility.js](./accessibility/form-accessibility.js)** - Accessible form patterns
  - Comprehensive input labeling
  - Error handling and validation
  - Real-time feedback patterns
  - Fieldset and legend usage

### Visual and Motion

- **[color-patterns.css](./accessibility/color-patterns.css)** - Color and contrast management
  - WCAG AA compliant color palettes
  - Multi-modal design patterns (never color alone)
  - High contrast mode support
  - Color-blind friendly indicators

- **[motion-management.js](./accessibility/motion-management.js)** - Motion and animation control
  - Reduced motion detection and handling
  - Safe animation patterns
  - Vestibular disorder considerations
  - User preference management

### Voice and Advanced Interaction

- **[voice-control.js](./accessibility/voice-control.js)** - Voice command integration
  - Speech recognition implementation
  - Natural language command processing
  - Voice navigation patterns
  - Hands-free interaction support

## Content Examples (`/content`)

### Content Organization

- **[tagging-system.js](./content/tagging-system.js)** - Comprehensive content tagging system
  - Gameplay, completion, and accessibility tags
  - Version-specific content management
  - Tag filtering and validation utilities
  - Content categorization patterns

- **[content-templates.html](./content/content-templates.html)** - HTML content templates
  - Step component templates with proper tagging
  - Location organization patterns
  - Version difference handling
  - Spoiler management templates
  - Pokemon and trainer battle information layouts

### Content Quality

- **[content-validation.js](./content/content-validation.js)** - Content quality assurance system
  - Automated content validation rules
  - Writing style checking
  - Pokemon data accuracy verification
  - Content maintenance workflow

- **[internationalization.js](./content/internationalization.js)** - Multi-language support system
  - I18n management utilities
  - Locale detection and preferences
  - Translation priority management
  - Pluralization handling

## How to Use These Examples

### For Learning

Each file is self-contained and can be studied independently. They include:

- Comprehensive inline documentation
- Real-world implementation patterns
- Error handling strategies
- Performance considerations

### For Implementation

These examples can be:

- Copied and adapted for your project
- Used as reference implementations
- Extended with additional features
- Integrated into testing frameworks

### For Testing

Many examples include:

- Mock implementations for testing
- Validation patterns
- Error scenarios
- Performance benchmarks

## Integration with Main Application

These examples are extracted from the main documentation but maintain full compatibility with the actual application code. Key integration points:

1. **Event System**: All modules use the EventEmitter pattern for communication
2. **Data Patterns**: Progress and Pokemon data follow the Base + Override pattern
3. **UI Components**: HTML and CSS patterns are used throughout the interface
4. **Performance**: Optimization patterns are applied in production builds
5. **Security**: Validation patterns protect against malicious input
6. **Testing**: Test patterns ensure code quality and accessibility

## Dependencies

Most examples use vanilla JavaScript and standard web APIs:

- ES6+ JavaScript features
- Web APIs (localStorage, IntersectionObserver, etc.)
- Standard HTML5 and CSS3
- No external frameworks required

Some testing examples reference Jest patterns but can be adapted to other testing frameworks.

## Contributing

When adding new examples:

1. Follow the established patterns and documentation style
2. Include comprehensive inline comments
3. Provide both basic and advanced usage examples
4. Ensure accessibility compliance
5. Add appropriate error handling
6. Include performance considerations

## Quick Reference

| Pattern | File | Use Case |
|---------|------|----------|
| Module Communication | event-system.js | Inter-module messaging |
| Data Management | data-patterns.js | Pokemon/game data handling |
| Component Architecture | module-interfaces.js | Structured module design |
| **HTML Component Templates** | **component-templates.html** | **Complete semantic HTML component library** |
| HTML Templates | html-components.html | Accessible UI components |
| Styling System | css-components.css | Consistent visual design |
| Performance | performance-patterns.js | Speed and efficiency |
| Security | security-patterns.js | Input validation and safety |
| Testing | testing-patterns.js | Quality assurance |
| **CSS Design Tokens** | **design-tokens.css** | **Complete design system foundation** |
| **Component Styling** | **component-styles.css** | **Core component patterns and states** |
| **Responsive Design** | **responsive-patterns.css** | **Mobile-first responsive patterns** |
| **Theme System** | **theme-system.css** | **Pokemon generation themes** |
| **CSS Accessibility** | **accessibility-styles.css** | **WCAG compliant styling patterns** |
| Keyboard Navigation | keyboard-navigation.js | Full keyboard accessibility |
| Focus Management | focus-management.js | Focus control and restoration |
| Screen Reader Support | screen-reader-support.js | ARIA and announcements |
| Form Accessibility | form-accessibility.js | Accessible form patterns |
| Color and Contrast | color-patterns.css | WCAG compliant colors |
| Motion Control | motion-management.js | Reduced motion support |
| Voice Control | voice-control.js | Speech recognition |
| Content Tagging | tagging-system.js | Content organization and filtering |
| Content Templates | content-templates.html | Step and location markup patterns |
| Content Validation | content-validation.js | Quality assurance and style checking |
| Internationalization | internationalization.js | Multi-language support |

For more detailed architecture information, see the main [Architecture Overview](../Design%20Documentation/Architecture-Overview.md) documentation.
