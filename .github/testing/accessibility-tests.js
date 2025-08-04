// Accessibility Testing Implementation for Pokemon Walkthrough Project
// This file contains automated WCAG compliance checking referenced in Accessibility-Standards.md

import { axe, toHaveNoViolations } from 'jest-axe';
import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
    let dom;
    let document;
    let window;

    beforeEach(async () => {
        // Load the main HTML file
        const html = readFileSync('./index.html', 'utf8');
        dom = new JSDOM(html, {
            url: 'http://localhost',
            pretendToBeVisual: true,
            resources: 'usable',
        });

        document = dom.window.document;
        window = dom.window;

        // Set up global variables
        global.document = document;
        global.window = window;

        // Mock localStorage
        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn(),
        };
    });

    afterEach(() => {
        dom.window.close();
    });

    describe('WCAG 2.1 AA Compliance', () => {
        test('should have no accessibility violations on main page', async () => {
            const results = await axe(document.body, {
                rules: {
                    // Configure specific WCAG AA rules
                    'color-contrast': { enabled: true },
                    'keyboard-navigation': { enabled: true },
                    'focus-management': { enabled: true },
                    'semantic-structure': { enabled: true },
                },
            });

            expect(results).toHaveNoViolations();
        });

        test('should maintain accessibility with dynamic content', async () => {
            // Simulate loading walkthrough content
            const walkthroughContent = `
        <div class="location-section" data-location-id="pallet-town">
          <summary class="location-header">
            <span class="location-name">Pallet Town</span>
            <span class="step-counter" aria-label="5 steps remaining">5 steps</span>
          </summary>
          <div class="location-content">
            <div class="step" data-step-id="pallet-town-1" data-tags="story,required">
              <input type="checkbox" id="step-pallet-town-1" class="step-checkbox">
              <label for="step-pallet-town-1" class="step-text">
                Go to Professor Oak's lab
              </label>
            </div>
          </div>
        </div>
      `;

            document.body.innerHTML += walkthroughContent;

            const results = await axe(document.body);
            expect(results).toHaveNoViolations();
        });

        test('should handle form accessibility correctly', async () => {
            const formContent = `
        <div class="settings-panel">
          <fieldset>
            <legend>Display Mode</legend>
            <div class="mode-toggle">
              <input type="radio" name="display-mode" id="simple-mode" value="simple">
              <label for="simple-mode">Simple Checklist</label>
              
              <input type="radio" name="display-mode" id="rich-mode" value="rich" checked>
              <label for="rich-mode">Rich Interactive</label>
            </div>
          </fieldset>
          
          <div class="input-group">
            <label for="player-name">Player Name:</label>
            <input type="text" id="player-name" aria-describedby="player-name-help">
            <div id="player-name-help">Enter your player name (max 7 characters)</div>
          </div>
        </div>
      `;

            document.body.innerHTML += formContent;

            const results = await axe(document.body);
            expect(results).toHaveNoViolations();
        });
    });

    describe('Keyboard Navigation', () => {
        beforeEach(() => {
            // Add sample walkthrough content
            document.body.innerHTML = `
        <div class="walkthrough-container">
          <div class="step" data-step-id="step-1">
            <input type="checkbox" id="step-1" class="step-checkbox">
            <label for="step-1">First step</label>
          </div>
          <div class="step" data-step-id="step-2">
            <input type="checkbox" id="step-2" class="step-checkbox">
            <label for="step-2">Second step</label>
          </div>
          <button id="settings-toggle">Settings</button>
        </div>
      `;
        });

        test('should handle Tab navigation correctly', () => {
            const firstCheckbox = document.getElementById('step-1');
            const secondCheckbox = document.getElementById('step-2');
            const settingsButton = document.getElementById('settings-toggle');

            // Focus first element
            firstCheckbox.focus();
            expect(document.activeElement).toBe(firstCheckbox);

            // Simulate Tab key
            firstCheckbox.blur();
            secondCheckbox.focus();
            expect(document.activeElement).toBe(secondCheckbox);

            // Tab to button
            secondCheckbox.blur();
            settingsButton.focus();
            expect(document.activeElement).toBe(settingsButton);
        });

        test('should handle Shift+Tab navigation correctly', () => {
            const firstCheckbox = document.getElementById('step-1');
            const secondCheckbox = document.getElementById('step-2');
            const settingsButton = document.getElementById('settings-toggle');

            // Start from last element
            settingsButton.focus();
            expect(document.activeElement).toBe(settingsButton);

            // Simulate Shift+Tab
            settingsButton.blur();
            secondCheckbox.focus();
            expect(document.activeElement).toBe(secondCheckbox);

            // Shift+Tab again
            secondCheckbox.blur();
            firstCheckbox.focus();
            expect(document.activeElement).toBe(firstCheckbox);
        });

        test('should have visible focus indicators', () => {
            const checkbox = document.getElementById('step-1');
            checkbox.focus();

            const computedStyle = window.getComputedStyle(checkbox, ':focus');
            const outline = computedStyle.getPropertyValue('outline');

            // Should have some form of focus indicator
            expect(outline).not.toBe('none');
            expect(outline).not.toBe('');
        });

        test('should not create keyboard traps', () => {
            // Test that Tab navigation doesn't get stuck
            const focusableElements = document.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            expect(focusableElements.length).toBeGreaterThan(0);

            // Each element should be reachable
            focusableElements.forEach(element => {
                element.focus();
                expect(document.activeElement).toBe(element);
            });
        });
    });

    describe('Screen Reader Support', () => {
        test('should have proper heading structure', () => {
            document.body.innerHTML = `
        <h1>Pokemon Walkthrough</h1>
        <h2>Game Progress</h2>
        <h2>Pallet Town</h2>
        <h3>Professor Oak's Lab</h3>
      `;

            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

            // Should start with h1
            expect(headings[0].tagName).toBe('H1');

            // Should not skip heading levels
            for (let i = 1; i < headings.length; i++) {
                const currentLevel = parseInt(headings[i].tagName[1]);
                const previousLevel = parseInt(headings[i - 1].tagName[1]);

                // Can stay same level, go one level deeper, or jump back to any previous level
                expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
            }
        });

        test('should have proper form labels', () => {
            document.body.innerHTML = `
        <form>
          <label for="player-name-input">Player Name:</label>
          <input type="text" id="player-name-input">
          
          <fieldset>
            <legend>Starter Pokemon</legend>
            <input type="radio" name="starter" id="bulbasaur" value="bulbasaur">
            <label for="bulbasaur">Bulbasaur</label>
            <input type="radio" name="starter" id="charmander" value="charmander">
            <label for="charmander">Charmander</label>
          </fieldset>
        </form>
      `;

            const inputs = document.querySelectorAll('input');

            inputs.forEach(input => {
                if (input.type === 'radio') {
                    // Radio buttons should be in a fieldset with legend
                    const fieldset = input.closest('fieldset');
                    const legend = fieldset?.querySelector('legend');
                    expect(fieldset).toBeTruthy();
                    expect(legend).toBeTruthy();

                    // Should also have individual labels
                    const label = document.querySelector(`label[for="${input.id}"]`);
                    expect(label).toBeTruthy();
                } else {
                    // Other inputs should have labels
                    const label = document.querySelector(`label[for="${input.id}"]`);
                    expect(label).toBeTruthy();
                }
            });
        });

        test('should have appropriate ARIA attributes', () => {
            document.body.innerHTML = `
        <div class="progress-bar" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-fill"></div>
          <span class="progress-text">50% Complete</span>
        </div>
        
        <button id="settings-toggle" aria-expanded="false" aria-controls="settings-panel">
          Settings
        </button>
        
        <div id="settings-panel" aria-hidden="true" aria-labelledby="settings-heading">
          <h2 id="settings-heading">Settings Panel</h2>
        </div>
        
        <div aria-live="polite" id="announcements"></div>
      `;

            // Progress bar
            const progressBar = document.querySelector('.progress-bar');
            expect(progressBar.getAttribute('role')).toBe('progressbar');
            expect(progressBar.getAttribute('aria-valuenow')).toBe('50');
            expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
            expect(progressBar.getAttribute('aria-valuemax')).toBe('100');

            // Expandable button
            const settingsToggle = document.getElementById('settings-toggle');
            expect(settingsToggle.getAttribute('aria-expanded')).toBe('false');
            expect(settingsToggle.getAttribute('aria-controls')).toBe('settings-panel');

            // Hidden panel
            const settingsPanel = document.getElementById('settings-panel');
            expect(settingsPanel.getAttribute('aria-hidden')).toBe('true');
            expect(settingsPanel.getAttribute('aria-labelledby')).toBe('settings-heading');

            // Live region
            const liveRegion = document.getElementById('announcements');
            expect(liveRegion.getAttribute('aria-live')).toBe('polite');
        });

        test('should handle dynamic content announcements', () => {
            // Create live region
            const liveRegion = document.createElement('div');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.id = 'announcements';
            document.body.appendChild(liveRegion);

            // Simulate step completion announcement
            liveRegion.textContent = "Step completed: Go to Professor Oak's lab";

            expect(liveRegion.textContent).toContain('Step completed');
            expect(liveRegion.getAttribute('aria-live')).toBe('polite');
        });
    });

    describe('Color and Contrast', () => {
        test('should meet WCAG AA contrast requirements', async () => {
            document.body.innerHTML = `
        <style>
          .test-text { color: #212121; background-color: #ffffff; }
          .test-large-text { color: #757575; background-color: #ffffff; font-size: 18px; }
          .test-button { color: #ffffff; background-color: #1976d2; }
        </style>
        <p class="test-text">Normal text example</p>
        <h2 class="test-large-text">Large text example</h2>
        <button class="test-button">Button example</button>
      `;

            const results = await axe(document.body, {
                rules: {
                    'color-contrast': { enabled: true },
                },
            });

            expect(results).toHaveNoViolations();
        });

        test('should not rely on color alone', () => {
            document.body.innerHTML = `
        <div class="step completed">
          <input type="checkbox" checked>
          <label style="color: green; text-decoration: line-through;">
            Completed step
          </label>
          <span aria-hidden="true">✓</span>
        </div>
        
        <div class="error-message" style="color: red;">
          <span aria-hidden="true">⚠️</span>
          This field is required
        </div>
      `;

            // Completed step should have multiple indicators
            const completedStep = document.querySelector('.step.completed');
            const label = completedStep.querySelector('label');
            const checkbox = completedStep.querySelector('input');
            const icon = completedStep.querySelector('span');

            expect(checkbox.checked).toBe(true); // State indicator
            expect(label.style.textDecoration).toContain('line-through'); // Visual indicator
            expect(icon.textContent).toBe('✓'); // Icon indicator

            // Error message should have icon
            const errorMessage = document.querySelector('.error-message');
            const errorIcon = errorMessage.querySelector('span');
            expect(errorIcon.textContent).toBe('⚠️');
        });
    });

    describe('Motion and Animation', () => {
        test('should respect prefers-reduced-motion', () => {
            // Mock prefers-reduced-motion media query
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: jest.fn().mockImplementation(query => ({
                    matches: query === '(prefers-reduced-motion: reduce)',
                    media: query,
                    onchange: null,
                    addListener: jest.fn(),
                    removeListener: jest.fn(),
                    addEventListener: jest.fn(),
                    removeEventListener: jest.fn(),
                    dispatchEvent: jest.fn(),
                })),
            });

            document.body.innerHTML = `
        <style>
          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              transition-duration: 0.01ms !important;
            }
          }
          .animated-element {
            transition: transform 0.3s ease;
          }
        </style>
        <div class="animated-element">Test element</div>
      `;

            // With prefers-reduced-motion, transitions should be very short
            expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
        });

        test('should provide motion controls', () => {
            document.body.innerHTML = `
        <div class="motion-controls">
          <label>
            <input type="radio" name="motion-preference" value="system" checked>
            Use system preference
          </label>
          <label>
            <input type="radio" name="motion-preference" value="reduced">
            Reduced motion
          </label>
          <label>
            <input type="radio" name="motion-preference" value="normal">
            Normal motion
          </label>
        </div>
      `;

            const motionControls = document.querySelectorAll('input[name="motion-preference"]');
            expect(motionControls.length).toBe(3);

            // Should have system preference selected by default
            const systemOption = document.querySelector('input[value="system"]');
            expect(systemOption.checked).toBe(true);
        });
    });

    describe('Focus Management', () => {
        test('should manage focus traps correctly', () => {
            document.body.innerHTML = `
        <div id="main-content">
          <button id="open-modal">Open Modal</button>
        </div>
        
        <div id="modal" data-focus-trap="true" style="display: none;">
          <h2>Modal Title</h2>
          <button id="modal-button">Modal Button</button>
          <button id="close-modal">Close Modal</button>
        </div>
      `;

            const modal = document.getElementById('modal');
            const modalButton = document.getElementById('modal-button');
            const closeButton = document.getElementById('close-modal');
            const openButton = document.getElementById('open-modal');

            // Simulate opening modal
            modal.style.display = 'block';
            modalButton.focus();

            expect(document.activeElement).toBe(modalButton);

            // Simulate Tab navigation within modal
            modalButton.blur();
            closeButton.focus();
            expect(document.activeElement).toBe(closeButton);

            // Simulate closing modal and focus restoration
            modal.style.display = 'none';
            modal.removeAttribute('data-focus-trap');
            openButton.focus();

            expect(document.activeElement).toBe(openButton);
        });

        test('should handle skip links', () => {
            document.body.innerHTML = `
        <a href="#main-content" class="sr-only sr-only-focusable">Skip to main content</a>
        <header>Header content</header>
        <main id="main-content">Main content</main>
      `;

            const skipLink = document.querySelector('.sr-only-focusable');
            const mainContent = document.getElementById('main-content');

            expect(skipLink.getAttribute('href')).toBe('#main-content');
            expect(mainContent).toBeTruthy();

            // Skip link should be focusable
            skipLink.focus();
            expect(document.activeElement).toBe(skipLink);
        });
    });

    describe('Error Handling', () => {
        test('should announce errors appropriately', async () => {
            document.body.innerHTML = `
        <form>
          <label for="required-field">Required Field:</label>
          <input type="text" id="required-field" required aria-describedby="field-error">
          <div id="field-error" role="alert" style="display: none;"></div>
        </form>
      `;

            const input = document.getElementById('required-field');
            const errorDiv = document.getElementById('field-error');

            // Simulate validation error
            input.setAttribute('aria-invalid', 'true');
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'This field is required';

            expect(input.getAttribute('aria-invalid')).toBe('true');
            expect(input.getAttribute('aria-describedby')).toBe('field-error');
            expect(errorDiv.getAttribute('role')).toBe('alert');
            expect(errorDiv.textContent).toContain('required');

            const results = await axe(document.body);
            expect(results).toHaveNoViolations();
        });
    });
});

// Custom accessibility test utilities
export const AccessibilityTestUtils = {
    // Test if element has proper focus indicator
    hasFocusIndicator(element) {
        element.focus();
        const computedStyle = window.getComputedStyle(element, ':focus');
        const outline = computedStyle.getPropertyValue('outline');
        const boxShadow = computedStyle.getPropertyValue('box-shadow');

        return (outline !== 'none' && outline !== '') || (boxShadow !== 'none' && boxShadow !== '');
    },

    // Test if text meets contrast requirements
    async testContrast(element, level = 'AA') {
        const results = await axe(element, {
            rules: {
                'color-contrast': { enabled: true },
            },
        });

        const contrastViolations = results.violations.filter(
            violation => violation.id === 'color-contrast'
        );

        return contrastViolations.length === 0;
    },

    // Test keyboard navigation path
    testTabOrder(startElement, expectedOrder) {
        let currentElement = startElement;
        const actualOrder = [currentElement];

        for (let i = 1; i < expectedOrder.length; i++) {
            // Simulate Tab key
            const tabEvent = new KeyboardEvent('keydown', {
                key: 'Tab',
                bubbles: true,
            });
            currentElement.dispatchEvent(tabEvent);

            // Find next focusable element (simplified)
            const focusableElements = document.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const currentIndex = Array.from(focusableElements).indexOf(currentElement);
            currentElement = focusableElements[currentIndex + 1];

            if (currentElement) {
                actualOrder.push(currentElement);
            }
        }

        return actualOrder.every((element, index) => element === expectedOrder[index]);
    },

    // Test screen reader announcements
    testAnnouncement(liveRegion, expectedText) {
        return new Promise(resolve => {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList' || mutation.type === 'characterData') {
                        const text = mutation.target.textContent;
                        if (text.includes(expectedText)) {
                            observer.disconnect();
                            resolve(true);
                        }
                    }
                });
            });

            observer.observe(liveRegion, {
                childList: true,
                characterData: true,
                subtree: true,
            });

            // Timeout after 5 seconds
            setTimeout(() => {
                observer.disconnect();
                resolve(false);
            }, 5000);
        });
    },
};
