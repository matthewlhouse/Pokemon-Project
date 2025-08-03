# Development Workflow

## Overview

This document outlines the complete development workflow for the Pokemon Walkthrough Project, covering Git workflow, testing procedures, code review processes, and deployment strategies.

## Git Workflow

### Branch Strategy

```bash
# Main branches
main                    # Production-ready code, deployed to GitHub Pages
develop                 # Integration branch for features, pre-release testing

# Feature branches
feature/description     # New features or enhancements
content/location-name   # New walkthrough content
fix/bug-description     # Bug fixes
docs/documentation-area # Documentation updates
refactor/component-name # Code refactoring without new features

# Examples
feature/cross-game-progress-sync
content/cerulean-city-walkthrough  
fix/checkbox-persistence-safari
docs/accessibility-standards
refactor/progress-manager-class
```

### Development Process

#### 1. Starting New Work

```bash
# Update your local repository
git checkout main
git pull origin main

# Create and switch to feature branch
git checkout -b feature/pokemon-encounter-tracking

# Verify branch creation
git branch -v
```

#### 2. Development Cycle

```bash
# Make changes and commit regularly
git add .
git commit -m "Add Pokemon encounter tracking to progress manager

- Implement encounter counting for wild Pokemon
- Add encounter data to localStorage persistence  
- Update UI to show encounter counts in step tooltips
- Add accessibility announcements for encounter updates"

# Follow conventional commit format:
# type(scope): description
#
# body explaining what and why
# 
# footer with breaking changes or issue references

# Push to remote branch regularly
git push origin feature/pokemon-encounter-tracking
```

#### 3. Preparing for Merge

```bash
# Update your branch with latest main before creating PR
git checkout main
git pull origin main
git checkout feature/pokemon-encounter-tracking
git rebase main

# Run all tests and validations
npm test                    # Run test suite
npm run lint               # Code linting
npm run accessibility-test # Accessibility validation
npm run content-validate   # Content validation

# Push the rebased branch
git push origin feature/pokemon-encounter-tracking --force-with-lease
```

### Commit Message Standards

#### Conventional Commit Format

```text
type(scope): short description

Longer description explaining what changed and why.
Include any context needed to understand the change.

- List any specific changes made
- Note any breaking changes
- Reference related issues

Closes #123
BREAKING CHANGE: Changed localStorage key format
```

#### Commit Types

```bash
feat:     # New feature for users
fix:      # Bug fix for users  
docs:     # Documentation changes
style:    # Code formatting, no logic changes
refactor: # Code restructuring, no behavior changes
test:     # Adding or updating tests
chore:    # Build process, dependencies, tooling
content:  # Walkthrough content additions/updates
a11y:     # Accessibility improvements

# Examples
feat(progress): add cross-game Pokemon tracking
fix(ui): resolve checkbox state persistence in Safari
docs(api): update module interface documentation  
style(css): standardize color variable naming
refactor(data): extract shared Pokemon data structures
test(progress): add unit tests for localStorage manager
chore(deps): update development dependencies
content(kanto): add Cerulean City walkthrough content
a11y(nav): improve keyboard navigation for step lists
```

## Code Review Process

### Pull Request Guidelines

#### PR Title and Description Template

```markdown
## Description
Brief summary of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)  
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Content addition/update
- [ ] Accessibility improvement

## Changes Made
- Specific change 1
- Specific change 2
- Specific change 3

## Testing Performed
- [ ] Manual testing completed
- [ ] Automated tests pass
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing
- [ ] Accessibility testing with screen reader
- [ ] Content accuracy verified

## Screenshots
[Include screenshots for UI changes]

## Accessibility Considerations
- Describe any accessibility impacts
- Note screen reader testing results
- List keyboard navigation changes

## Breaking Changes
List any breaking changes and migration steps needed.

## Related Issues  
Closes #123
Related to #456
```

#### Review Checklist

##### Code Quality

- [ ] Code follows established patterns and conventions
- [ ] Functions are focused and testable
- [ ] Variable and function names are descriptive
- [ ] Comments explain "why" not "what"
- [ ] No console.log statements left in production code
- [ ] Error handling is appropriate and user-friendly

##### Functionality

- [ ] Feature works as described in requirements
- [ ] Edge cases are handled appropriately  
- [ ] User input is validated properly
- [ ] Error states provide helpful feedback
- [ ] Performance impact is acceptable

##### Accessibility

- [ ] WCAG 2.1 AA compliance maintained
- [ ] Keyboard navigation works correctly
- [ ] Screen reader announcements are appropriate
- [ ] Focus management is correct
- [ ] Color contrast meets requirements
- [ ] Alternative text for images is descriptive

##### Content (for content PRs)

- [ ] Information is accurate and verified
- [ ] Writing style matches guidelines
- [ ] Tagging is consistent and appropriate
- [ ] Spoiler handling is correct
- [ ] Version differences are documented

##### Testing

- [ ] Automated tests pass
- [ ] Manual testing completed across browsers
- [ ] Mobile responsiveness verified
- [ ] Accessibility tools report no critical issues
- [ ] Performance benchmarks met

#### Review Process

1. **Automated Checks**: All CI checks must pass before review
2. **Self Review**: Author reviews their own changes first
3. **Peer Review**: At least one other developer reviews
4. **Content Review**: Content changes reviewed by domain expert
5. **Accessibility Review**: A11y specialist reviews accessibility changes
6. **Final Approval**: Maintainer provides final approval

### Code Review Guidelines

#### For Reviewers

```markdown
## Review Approach
1. **Understand the Context**: Read the PR description and related issues
2. **Test Locally**: Check out the branch and test the changes
3. **Focus on Impact**: Prioritize user-facing and accessibility impacts
4. **Be Constructive**: Provide specific, actionable feedback
5. **Ask Questions**: Clarify unclear changes rather than assuming

## Feedback Categories
**Critical (Must Fix)**: Security, accessibility, breaking changes
**Important (Should Fix)**: Performance, maintainability, user experience  
**Suggestion (Consider)**: Style preferences, alternative approaches
**Praise**: Highlight good practices and clever solutions

## Review Comments
<!-- GOOD: Specific and actionable -->
This function doesn't handle the case where localStorage is unavailable. 
Consider adding a try-catch block and falling back to memory storage.

<!-- AVOID: Vague criticism -->
This doesn't look right.

<!-- GOOD: Explain the why -->
This approach could cause memory leaks in long sessions. Consider using 
WeakMap instead of Map for automatic garbage collection.

<!-- GOOD: Acknowledge good work -->
Nice use of semantic HTML here! The aria-describedby relationship will 
work really well for screen readers.
```

#### For Authors

```markdown
## Preparing for Review
1. **Self-Review First**: Review your own changes before requesting review
2. **Test Thoroughly**: Ensure all functionality works as expected
3. **Document Changes**: Update relevant documentation
4. **Write Clear Commits**: Use descriptive commit messages
5. **Respond to Feedback**: Address all review comments

## Responding to Feedback  
1. **Thank Reviewers**: Acknowledge the time spent reviewing
2. **Ask for Clarification**: Don't guess what reviewers mean
3. **Explain Decisions**: When declining suggestions, explain why
4. **Make Changes**: Address feedback promptly and thoroughly
5. **Request Re-review**: Ask for another look after making changes
```

## Testing Procedures

### Automated Testing

#### Unit Testing Setup

```javascript
// test/setup.js - Testing environment setup
import { JSDOM } from 'jsdom';
import 'jest-localstorage-mock';

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock CSS.supports for feature detection
window.CSS = { supports: jest.fn(() => true) };

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));
```

#### Core Module Tests

```javascript
// test/progress.test.js
import { ProgressManager } from '../js/modules/progress.js';

describe('ProgressManager', () => {
  let progressManager;
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    progressManager = new ProgressManager();
  });

  describe('Step Management', () => {
    test('should mark step as completed', () => {
      const stepId = 'pallet-town-1';
      const completed = true;
      
      progressManager.updateStepProgress(stepId, completed);
      
      expect(progressManager.getStepProgress(stepId)).toBe(true);
      expect(localStorage.getItem('pokemon-walkthrough-progress')).toContain(stepId);
    });

    test('should handle invalid step IDs gracefully', () => {
      expect(() => {
        progressManager.updateStepProgress(null, true);
      }).not.toThrow();
      
      expect(() => {
        progressManager.updateStepProgress('', true);  
      }).not.toThrow();
    });

    test('should restore progress from localStorage', () => {
      // Setup existing progress
      const existingProgress = {
        'red-blue': {
          steps: { 'pallet-town-1': true, 'pallet-town-2': false }
        }
      };
      localStorage.setItem('pokemon-walkthrough-progress', JSON.stringify(existingProgress));
      
      // Create new manager instance
      const newManager = new ProgressManager();
      
      expect(newManager.getStepProgress('pallet-town-1')).toBe(true);
      expect(newManager.getStepProgress('pallet-town-2')).toBe(false);
    });
  });

  describe('Cross-Game Integration', () => {
    test('should aggregate Pokemon across games', () => {
      progressManager.updatePokemonCaught('red-blue', 'pikachu', { level: 5, location: 'viridian-forest' });
      progressManager.updatePokemonCaught('yellow', 'pikachu', { level: 5, location: 'route-25' });
      
      const globalPokedex = progressManager.getGlobalPokedex();
      
      expect(globalPokedex.pikachu).toBeDefined();
      expect(globalPokedex.pikachu.games).toContain('red-blue');
      expect(globalPokedex.pikachu.games).toContain('yellow');
    });
  });

  describe('Data Persistence', () => {
    test('should export progress data', () => {
      progressManager.updateStepProgress('test-step', true);
      
      const exportData = progressManager.exportProgress();
      
      expect(exportData).toHaveProperty('version');
      expect(exportData).toHaveProperty('timestamp');
      expect(exportData).toHaveProperty('games');
    });

    test('should import valid progress data', () => {
      const importData = {
        version: '1.0.0',
        timestamp: Date.now(),
        games: {
          'red-blue': {
            steps: { 'imported-step': true }
          }
        }
      };
      
      const result = progressManager.importProgress(importData);
      
      expect(result.success).toBe(true);
      expect(progressManager.getStepProgress('imported-step')).toBe(true);
    });
  });
});
```

#### Accessibility Testing

```javascript
// test/accessibility.test.js
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  beforeEach(async () => {
    // Load main application markup
    document.body.innerHTML = await fs.readFile('./index.html', 'utf8');
    
    // Initialize application
    await import('../js/app.js');
  });

  test('should have no accessibility violations on main page', async () => {
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  test('should handle keyboard navigation correctly', () => {
    const firstStep = document.querySelector('.step-checkbox');
    firstStep.focus();
    
    // Simulate Tab key
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
    document.dispatchEvent(tabEvent);
    
    expect(document.activeElement).not.toBe(firstStep);
    expect(document.activeElement.matches('.step-checkbox, button, input')).toBe(true);
  });

  test('should announce step completion to screen readers', () => {
    const liveRegion = document.querySelector('[aria-live="polite"]');
    const checkbox = document.querySelector('.step-checkbox');
    
    // Simulate checking a step
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    
    // Check that announcement was made
    expect(liveRegion.textContent).toContain('completed');
  });
});
```

### Manual Testing Procedures

#### Browser Testing Matrix

```markdown
## Required Browser Support
- **Chrome**: Latest stable version (primary development browser)
- **Firefox**: Latest stable version
- **Safari**: Latest stable version (macOS and iOS)
- **Edge**: Latest stable version
- **Mobile Chrome**: Latest stable version (Android)
- **Mobile Safari**: Latest stable version (iOS)

## Testing Checklist Per Browser
- [ ] Page loads without errors
- [ ] All interactive elements function correctly
- [ ] Responsive design works at different screen sizes
- [ ] JavaScript features work as expected
- [ ] LocalStorage persistence functions correctly
- [ ] No console errors or warnings
- [ ] Performance is acceptable (loading and interaction)
```

#### Device Testing

```markdown
## Desktop Testing
- **Resolution**: Test at 1920x1080, 1366x768, and 1280x720
- **Zoom Levels**: Test at 100%, 125%, 150%, and 200% zoom
- **Window Sizes**: Test responsive breakpoints

## Mobile Testing  
- **Portrait and Landscape**: Both orientations
- **Touch Interactions**: Tap, swipe, pinch-to-zoom
- **Keyboard**: On-screen keyboard behavior
- **Performance**: Smooth scrolling and interactions

## Tablet Testing
- **iPad/Android Tablets**: Test on available devices
- **Hybrid Input**: Touch and keyboard combinations
```

#### Manual Accessibility Testing

```markdown
## Screen Reader Testing
- **NVDA (Windows)**: Primary testing screen reader
- **JAWS (Windows)**: Secondary testing if available  
- **VoiceOver (macOS/iOS)**: Apple device testing
- **TalkBack (Android)**: Android device testing

## Testing Checklist
- [ ] All content is announced correctly
- [ ] Navigation landmarks work properly
- [ ] Form fields have proper labels and descriptions
- [ ] Error messages are announced
- [ ] Progress updates are announced
- [ ] Tables have proper headers
- [ ] Lists are structured correctly

## Keyboard Testing
- [ ] All functionality accessible via keyboard
- [ ] Focus indicators are visible and clear
- [ ] Tab order is logical
- [ ] Keyboard shortcuts work as documented
- [ ] No keyboard traps (except intentional focus traps)
- [ ] Skip links function properly

## Color and Contrast Testing
- [ ] All text meets WCAG AA contrast requirements
- [ ] Information is not conveyed by color alone
- [ ] High contrast mode works correctly
- [ ] Color blind simulation testing completed
```

### Performance Testing

#### Core Web Vitals Monitoring

```javascript
// js/performance-monitoring.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.initializeMonitoring();
  }
  
  initializeMonitoring() {
    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // First Input Delay
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        this.metrics.fid = entry.processingStart - entry.startTime;
      });
    }).observe({ entryTypes: ['first-input'] });
    
    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.metrics.cls = clsValue;
    }).observe({ entryTypes: ['layout-shift'] });
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      // Add custom metrics
      domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
      windowLoad: performance.timing.loadEventEnd - performance.timing.navigationStart
    };
  }
}

// Performance benchmarks
const PERFORMANCE_THRESHOLDS = {
  lcp: 2500,    // Largest Contentful Paint (ms)
  fid: 100,     // First Input Delay (ms)  
  cls: 0.1,     // Cumulative Layout Shift
  domContentLoaded: 1500, // DOM ready (ms)
  windowLoad: 3000        // Full page load (ms)
};
```

## Deployment Process

### GitHub Actions CI/CD

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm test
    
    - name: Run accessibility tests
      run: npm run test:a11y
    
    - name: Content validation
      run: npm run validate:content
    
    - name: Build application
      run: npm run build
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: test-results
        path: test-results/

  accessibility-audit:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Start local server
      run: npm run serve &
      
    - name: Wait for server
      run: sleep 10
    
    - name: Run Lighthouse CI
      run: npx lhci autorun
      env:
        LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

  deploy:
    runs-on: ubuntu-latest
    needs: [test, accessibility-audit]
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build for production
      run: npm run build:prod
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
        cname: pokemon-walkthrough.example.com
```

### Build Process

```json
// package.json scripts
{
  "scripts": {
    "dev": "vite serve",
    "build": "vite build",
    "build:prod": "vite build --mode production",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:a11y": "jest --testPathPattern=accessibility",
    "lint": "eslint js/ --ext .js",
    "lint:fix": "eslint js/ --ext .js --fix",
    "validate:content": "node scripts/validate-content.js",
    "validate:html": "html-validate **/*.html",
    "serve": "http-server dist -p 8080",
    "lighthouse": "lighthouse http://localhost:8080 --chrome-flags=\"--headless\"",
    "clean": "rimraf dist",
    "prepare": "husky install"
  }
}
```

### Pre-commit Hooks

```javascript
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linting
npm run lint

# Run tests
npm test

# Validate content if content files changed
if git diff --cached --name-only | grep -q "content/\|data/"
then
  npm run validate:content
fi

# Check HTML validity if HTML files changed  
if git diff --cached --name-only | grep -q "\.html$"
then
  npm run validate:html
fi
```

### Release Process

```bash
# Release workflow
# 1. Ensure all tests pass on develop branch
git checkout develop
npm test
npm run test:a11y
npm run validate:content

# 2. Create release branch
git checkout -b release/v1.2.0

# 3. Update version numbers and changelog
npm version minor
# Update CHANGELOG.md with release notes

# 4. Merge to main
git checkout main
git merge release/v1.2.0

# 5. Tag the release
git tag -a v1.2.0 -m "Release version 1.2.0

Features:
- Cross-game Pokemon tracking
- Enhanced accessibility support
- Mobile performance improvements

Bug fixes:
- Fixed localStorage persistence in Safari
- Resolved keyboard navigation issues

Breaking changes:
- Changed localStorage data format (automatic migration included)"

# 6. Push to trigger deployment
git push origin main --tags

# 7. Create GitHub release
gh release create v1.2.0 --title "Pokemon Walkthrough v1.2.0" --notes-file RELEASE_NOTES.md
```

### Deployment Environments

```markdown
## Development Environment
- **URL**: localhost:3000 or localhost:8080
- **Purpose**: Local development and testing
- **Database**: Local localStorage only
- **Features**: All development tools enabled

## Staging Environment  
- **URL**: staging.pokemon-walkthrough.example.com
- **Purpose**: Pre-production testing and review
- **Database**: Mirrors production structure
- **Features**: Production-like but with debug information

## Production Environment
- **URL**: pokemon-walkthrough.example.com
- **Purpose**: Live application for users
- **Database**: Production localStorage with backup systems
- **Features**: Optimized builds, error tracking, analytics
```

This comprehensive development workflow ensures code quality, accessibility compliance, and reliable deployments while maintaining a collaborative and efficient development process.
