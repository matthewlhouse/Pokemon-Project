/**
 * Performance Architecture Examples
 * Demonstrates lazy loading, code splitting, and caching strategies
 */

// Lazy loading and code splitting
class ApplicationLoader {
    constructor() {
        this.modules = new Map();
        this.loadingState = 'initial';
    }

    async initialize() {
        this.loadingState = 'loading';

        // Load critical modules first
        await this.loadCriticalModules();

        // Load secondary modules after initial render
        requestIdleCallback(() => {
            this.loadSecondaryModules();
        });

        // Load content modules on demand
        this.setupLazyLoading();

        this.loadingState = 'ready';
    }

    async loadCriticalModules() {
        const critical = [
            () => import('./modules/progress.js'),
            () => import('./modules/ui.js'),
            () => import('./modules/accessibility.js'),
        ];

        const modules = await Promise.all(critical.map(loader => loader()));

        for (const module of modules) {
            const instance = new module.default();
            await instance.initialize();
            this.modules.set(module.default.name, instance);
        }
    }

    async loadSecondaryModules() {
        const secondary = [
            () => import('./modules/filter.js'),
            () => import('./modules/pokedex.js'),
            () => import('./modules/items.js'),
        ];

        for (const loader of secondary) {
            try {
                const module = await loader();
                const instance = new module.default();
                await instance.initialize();
                this.modules.set(module.default.name, instance);
            } catch (error) {
                console.warn('Failed to load secondary module:', error);
            }
        }
    }

    setupLazyLoading() {
        // Intersection Observer for content sections
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadContentSection(entry.target);
                    }
                });
            },
            { rootMargin: '100px' }
        );

        // Observe location sections for lazy loading
        document.querySelectorAll('.location-section').forEach(section => {
            observer.observe(section);
        });
    }

    async loadContentSection(sectionElement) {
        const locationId = sectionElement.dataset.locationId;

        if (sectionElement.dataset.loaded === 'true') {
            return; // Already loaded
        }

        try {
            // Load location-specific data
            const locationData = await this.loadLocationData(locationId);

            // Populate section with data
            this.populateLocationSection(sectionElement, locationData);

            // Mark as loaded
            sectionElement.dataset.loaded = 'true';
        } catch (error) {
            console.error(`Failed to load content for ${locationId}:`, error);
        }
    }

    async loadLocationData(locationId) {
        const response = await fetch(`/data/locations/${locationId}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load location data: ${response.status}`);
        }
        return response.json();
    }

    populateLocationSection(sectionElement, locationData) {
        const stepsContainer = sectionElement.querySelector('.steps-container');
        if (!stepsContainer) return;

        // Create step elements from data
        locationData.steps?.forEach(stepData => {
            const stepElement = this.createStepElement(stepData);
            stepsContainer.appendChild(stepElement);
        });
    }

    createStepElement(stepData) {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step';
        stepDiv.dataset.stepId = stepData.id;
        stepDiv.dataset.category = stepData.category;
        stepDiv.dataset.tags = stepData.tags.join(',');

        stepDiv.innerHTML = `
      <input type="checkbox" class="step-checkbox" id="${stepData.id}">
      <label for="${stepData.id}" class="step-text">${stepData.text}</label>
    `;

        return stepDiv;
    }
}

// Service Worker for caching (future enhancement)
class CacheManager {
    constructor() {
        this.cacheName = 'pokemon-walkthrough-v1';
        this.staticAssets = ['/', '/css/main.css', '/js/app.js', '/data/shared/pokemon-base.json'];
    }

    async initialize() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully');
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    // Cache static assets
    async cacheStaticAssets() {
        const cache = await caches.open(this.cacheName);
        await cache.addAll(this.staticAssets);
    }

    // Cache dynamic content
    async cacheDynamicContent(request, response) {
        const cache = await caches.open(this.cacheName);
        await cache.put(request, response.clone());
    }

    // Retrieve from cache with fallback
    async getCachedResponse(request) {
        const cache = await caches.open(this.cacheName);
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Fallback to network
        try {
            const networkResponse = await fetch(request);

            // Cache successful responses
            if (networkResponse.ok) {
                await this.cacheDynamicContent(request, networkResponse);
            }

            return networkResponse;
        } catch (error) {
            console.error('Network request failed:', error);
            throw error;
        }
    }

    // Clear old cache versions
    async clearOldCaches() {
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(
            name => name.startsWith('pokemon-walkthrough-') && name !== this.cacheName
        );

        await Promise.all(oldCaches.map(name => caches.delete(name)));
    }
}

// Performance monitoring
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.observers = [];
    }

    initialize() {
        this.observeCoreWebVitals();
        this.observeResourceLoading();
        this.observeUserInteractions();
    }

    observeCoreWebVitals() {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver(entryList => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.lcp = lastEntry.startTime;
            this.reportMetric('lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // First Input Delay
        const fidObserver = new PerformanceObserver(entryList => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                this.metrics.fid = entry.processingStart - entry.startTime;
                this.reportMetric('fid', this.metrics.fid);
            });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);

        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver(entryList => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            this.metrics.cls = clsValue;
            this.reportMetric('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
    }

    observeResourceLoading() {
        const resourceObserver = new PerformanceObserver(entryList => {
            const entries = entryList.getEntries();

            entries.forEach(entry => {
                if (entry.name.includes('pokemon-base.json')) {
                    this.metrics.pokemonDataLoadTime = entry.duration;
                    this.reportMetric('pokemonDataLoadTime', entry.duration);
                }
            });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
    }

    observeUserInteractions() {
        const measureStepToggle = stepId => {
            const startTime = performance.now();

            // Return a function to measure completion
            return () => {
                const duration = performance.now() - startTime;
                this.metrics.stepToggleDuration = duration;
                this.reportMetric('stepToggleDuration', duration);
            };
        };

        // Make measurement function available globally
        window.measureStepToggle = measureStepToggle;
    }

    reportMetric(name, value) {
        console.log(`Performance metric ${name}: ${value}`);

        // Send to analytics service (future enhancement)
        // analytics.track('performance', { metric: name, value });
    }

    getMetrics() {
        return {
            ...this.metrics,
            // Add standard navigation timing metrics
            domContentLoaded: this.getNavigationTiming('domContentLoadedEventEnd'),
            windowLoad: this.getNavigationTiming('loadEventEnd'),
            firstByte: this.getNavigationTiming('responseStart'),
        };
    }

    getNavigationTiming(metric) {
        const navigation = performance.getEntriesByType('navigation')[0];
        return navigation ? navigation[metric] - navigation.navigationStart : null;
    }

    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
    }
}

// Resource preloading utility
class ResourcePreloader {
    constructor() {
        this.preloadedResources = new Set();
    }

    preloadCriticalResources() {
        const criticalResources = [
            { href: '/data/shared/pokemon-base.json', as: 'fetch' },
            { href: '/css/main.css', as: 'style' },
            { href: '/js/modules/progress.js', as: 'script' },
        ];

        criticalResources.forEach(resource => {
            this.preloadResource(resource.href, resource.as);
        });
    }

    preloadResource(href, as) {
        if (this.preloadedResources.has(href)) {
            return; // Already preloaded
        }

        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;

        if (as === 'fetch') {
            link.crossOrigin = 'anonymous';
        }

        document.head.appendChild(link);
        this.preloadedResources.add(href);
    }

    preloadLocationData(locationId) {
        const href = `/data/locations/${locationId}.json`;
        this.preloadResource(href, 'fetch');
    }
}

export { ApplicationLoader, CacheManager, PerformanceMonitor, ResourcePreloader };
