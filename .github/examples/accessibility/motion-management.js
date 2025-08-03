// Motion Management and Reduced Motion Support for Pokemon Walkthrough Project
// This file contains animation and motion implementations referenced in Accessibility-Standards.md

class MotionManager {
  constructor() {
    this.reducedMotionPreference = null;
    this.manualOverride = null;
    this.animationElements = new Set();
    
    this.detectMotionPreference();
    this.setupMotionControls();
    this.applyMotionSettings();
  }

  detectMotionPreference() {
    // Check system preference
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotionPreference = mediaQuery.matches;
      
      // Listen for changes
      mediaQuery.addEventListener('change', (e) => {
        this.reducedMotionPreference = e.matches;
        this.applyMotionSettings();
      });
    }
    
    // Check for saved user preference
    const savedPreference = localStorage.getItem('motion-preference');
    if (savedPreference) {
      this.manualOverride = savedPreference === 'reduced';
    }
  }

  setupMotionControls() {
    // Add motion preference toggle to settings
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel) {
      this.addMotionToggle(settingsPanel);
    }
  }

  addMotionToggle(container) {
    const motionSection = document.createElement('div');
    motionSection.className = 'settings-section';
    motionSection.innerHTML = `
      <h3>Motion Preferences</h3>
      <div class="motion-controls">
        <label>
          <input type="radio" name="motion-preference" value="system" 
                 ${this.manualOverride === null ? 'checked' : ''}>
          Use system preference ${this.reducedMotionPreference ? '(reduced motion)' : '(normal motion)'}
        </label>
        <label>
          <input type="radio" name="motion-preference" value="normal"
                 ${this.manualOverride === false ? 'checked' : ''}>
          Normal motion (enable animations)
        </label>
        <label>
          <input type="radio" name="motion-preference" value="reduced"
                 ${this.manualOverride === true ? 'checked' : ''}>
          Reduced motion (disable animations)
        </label>
      </div>
    `;
    
    container.appendChild(motionSection);
    
    // Listen for changes
    motionSection.addEventListener('change', (event) => {
      const value = event.target.value;
      
      if (value === 'system') {
        this.manualOverride = null;
        localStorage.removeItem('motion-preference');
      } else {
        this.manualOverride = value === 'reduced';
        localStorage.setItem('motion-preference', value);
      }
      
      this.applyMotionSettings();
    });
  }

  applyMotionSettings() {
    const shouldReduceMotion = this.shouldReduceMotion();
    
    // Update body class
    document.body.classList.toggle('reduce-motion', shouldReduceMotion);
    document.body.classList.toggle('enable-motion', !shouldReduceMotion);
    
    // Apply to CSS custom property
    document.documentElement.style.setProperty(
      '--motion-duration', 
      shouldReduceMotion ? '0.01ms' : '0.2s'
    );
    
    // Notify other components
    document.dispatchEvent(new CustomEvent('motion-preference-changed', {
      detail: { reducedMotion: shouldReduceMotion }
    }));
  }

  shouldReduceMotion() {
    // Manual override takes precedence
    if (this.manualOverride !== null) {
      return this.manualOverride;
    }
    
    // Fall back to system preference
    return this.reducedMotionPreference || false;
  }

  // Safe animation utilities
  safeAnimate(element, keyframes, options = {}) {
    if (this.shouldReduceMotion()) {
      // Skip animation, apply final state immediately
      const finalKeyframe = keyframes[keyframes.length - 1];
      Object.assign(element.style, finalKeyframe);
      return Promise.resolve();
    }
    
    // Normal animation
    const animation = element.animate(keyframes, {
      duration: 200,
      easing: 'ease-out',
      fill: 'forwards',
      ...options
    });
    
    return animation.finished;
  }

  safeTransition(element, property, finalValue, duration = 200) {
    if (this.shouldReduceMotion()) {
      // Apply immediately
      element.style[property] = finalValue;
      return Promise.resolve();
    }
    
    // Set up transition
    element.style.transition = `${property} ${duration}ms ease-out`;
    element.style[property] = finalValue;
    
    return new Promise(resolve => {
      const cleanup = () => {
        element.style.transition = '';
        element.removeEventListener('transitionend', cleanup);
        resolve();
      };
      element.addEventListener('transitionend', cleanup);
      
      // Fallback timeout
      setTimeout(cleanup, duration + 50);
    });
  }

  // Step completion animation
  animateStepCompletion(stepElement) {
    if (this.shouldReduceMotion()) {
      // Simple scale effect that's safe for vestibular sensitivity
      stepElement.style.transform = 'scale(1.01)';
      setTimeout(() => {
        stepElement.style.transform = '';
      }, 50);
      return;
    }
    
    // Full animation for users who prefer motion
    return this.safeAnimate(stepElement, [
      { transform: 'scale(1)', opacity: '1' },
      { transform: 'scale(1.02)', opacity: '0.9' },
      { transform: 'scale(1)', opacity: '1' }
    ], { duration: 300 });
  }

  // Progress bar animation
  animateProgressBar(progressBar, newValue) {
    const progressFill = progressBar.querySelector('.progress-fill');
    if (!progressFill) return;
    
    if (this.shouldReduceMotion()) {
      // Instant update
      progressFill.style.width = `${newValue}%`;
      return;
    }
    
    // Animated update
    return this.safeTransition(progressFill, 'width', `${newValue}%`, 500);
  }

  // Filter transition
  animateFilterChange(elements, shouldShow) {
    const promises = elements.map(element => {
      if (this.shouldReduceMotion()) {
        // Instant show/hide
        element.style.display = shouldShow ? '' : 'none';
        return Promise.resolve();
      }
      
      if (shouldShow) {
        // Show animation
        element.style.display = '';
        return this.safeAnimate(element, [
          { opacity: '0', transform: 'translateY(-10px)' },
          { opacity: '1', transform: 'translateY(0)' }
        ], { duration: 200 });
      } else {
        // Hide animation
        return this.safeAnimate(element, [
          { opacity: '1', transform: 'translateY(0)' },
          { opacity: '0', transform: 'translateY(-10px)' }
        ], { duration: 150 }).then(() => {
          element.style.display = 'none';
        });
      }
    });
    
    return Promise.all(promises);
  }

  // Settings panel animation
  animateSettingsPanel(panel, isOpening) {
    if (this.shouldReduceMotion()) {
      // Instant show/hide
      panel.style.display = isOpening ? 'block' : 'none';
      return Promise.resolve();
    }
    
    if (isOpening) {
      panel.style.display = 'block';
      return this.safeAnimate(panel, [
        { opacity: '0', transform: 'translateX(100%)' },
        { opacity: '1', transform: 'translateX(0)' }
      ], { duration: 300 });
    } else {
      return this.safeAnimate(panel, [
        { opacity: '1', transform: 'translateX(0)' },
        { opacity: '0', transform: 'translateX(100%)' }
      ], { duration: 250 }).then(() => {
        panel.style.display = 'none';
      });
    }
  }

  // Location section expand/collapse
  animateLocationToggle(detailsElement, isOpening) {
    if (this.shouldReduceMotion()) {
      // Let native details/summary handle it
      return;
    }
    
    const content = detailsElement.querySelector('.location-content');
    if (!content) return;
    
    if (isOpening) {
      return this.safeAnimate(content, [
        { maxHeight: '0', opacity: '0' },
        { maxHeight: '1000px', opacity: '1' }
      ], { duration: 300 });
    } else {
      return this.safeAnimate(content, [
        { maxHeight: '1000px', opacity: '1' },
        { maxHeight: '0', opacity: '0' }
      ], { duration: 250 });
    }
  }

  // Focus indicator animation (always safe)
  animateFocusIndicator(element) {
    // Focus indicators should always be visible, even with reduced motion
    // Use a gentle pulse that doesn't trigger vestibular issues
    const ring = document.createElement('div');
    ring.className = 'focus-ring';
    ring.style.cssText = `
      position: absolute;
      top: -3px;
      left: -3px;
      right: -3px;
      bottom: -3px;
      border: 3px solid var(--focus-color);
      border-radius: 4px;
      pointer-events: none;
      z-index: 1000;
    `;
    
    element.style.position = 'relative';
    element.appendChild(ring);
    
    // Very gentle animation that's safe for all users
    if (!this.shouldReduceMotion()) {
      this.safeAnimate(ring, [
        { opacity: '0.5' },
        { opacity: '1' },
        { opacity: '0.8' }
      ], { duration: 150 });
    }
    
    // Clean up on blur
    const cleanup = () => {
      if (ring.parentNode) {
        ring.parentNode.removeChild(ring);
      }
      element.removeEventListener('blur', cleanup);
    };
    element.addEventListener('blur', cleanup);
  }

  // Utility to register elements that use animation
  registerAnimatedElement(element) {
    this.animationElements.add(element);
  }

  unregisterAnimatedElement(element) {
    this.animationElements.delete(element);
  }

  // Apply motion preferences to all registered elements
  updateAllAnimatedElements() {
    const shouldReduce = this.shouldReduceMotion();
    
    this.animationElements.forEach(element => {
      element.classList.toggle('reduce-motion', shouldReduce);
    });
  }
}

// CSS Custom Properties for Motion Control
const motionCSS = `
  :root {
    --motion-duration: 0.2s;
    --motion-easing: ease-out;
  }
  
  /* Safe motion classes */
  .reduce-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .enable-motion {
    --motion-duration: 0.2s;
  }
  
  /* Essential animations that are always safe */
  .focus-ring {
    transition: opacity 0.15s ease-out;
  }
  
  /* Respect system preferences by default */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
    
    /* Preserve essential focus indicators */
    :focus {
      transition: outline-color 0.01ms;
    }
  }
`;

// Inject CSS if not already present
if (!document.getElementById('motion-management-css')) {
  const style = document.createElement('style');
  style.id = 'motion-management-css';
  style.textContent = motionCSS;
  document.head.appendChild(style);
}

// Initialize motion management
document.addEventListener('DOMContentLoaded', () => {
  window.motionManager = new MotionManager();
});

export default MotionManager;
