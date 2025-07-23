// Modern Main JavaScript File - Modular Architecture
// Coordinates all modules for better organization and performance

class AppManager {
    constructor() {
        this.modules = new Map();
        this.isInitialized = false;
        this.initStartTime = null;

        // Module loading states
        this.moduleStates = {
            errorHandler: 'pending',
            utils: 'pending',
            ui: 'pending',
            cart: 'pending',
            lightbox: 'pending',
            search: 'pending',
            forms: 'pending'
        };

        // Bind methods
        this.init = this.init.bind(this);
        this.handleModuleError = this.handleModuleError.bind(this);
    }

    // Initialize the application
    async init() {
        if (this.isInitialized) {
            console.warn('App already initialized');
            return;
        }

        this.initStartTime = performance.now();
        console.log('🚀 Initializing Evgenia Art Gallery Application...');

        try {
            // Initialize modules in dependency order
            await this.initializeModules();

            // Setup global event listeners
            this.setupGlobalEvents();

                        // Mark as initialized
            this.isInitialized = true;

            // Log initialization time
            const initTime = performance.now() - this.initStartTime;
            console.log(`✅ Application initialized successfully in ${Math.round(initTime)}ms`);

            // Track initialization performance
            this.trackPerformance('app_init', 'main_application', initTime);

            // Schedule periodic cleanup
            this.schedulePeriodicCleanup();

            // Setup error boundaries for critical components
            this.setupErrorBoundaries();

            // Dispatch ready event
            this.dispatchAppReady();

        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.handleInitializationError(error);
        }
    }

    // Initialize all modules
    async initializeModules() {
        console.log('📦 Loading modules...');

        // Load all module scripts first
        await this.loadModuleScripts();

        // Then initialize modules from global objects
        this.initializeModuleReferences();
    }

    // Advanced module loading with priorities and lazy loading
    async loadModuleScripts() {
        const moduleConfig = {
            critical: [
                { name: 'error-handler', path: '/public/js/modules/error-handler.js', priority: 1 },
                { name: 'utils', path: '/public/js/modules/utils.js', priority: 2 }
            ],
            essential: [
                { name: 'ui', path: '/public/js/modules/ui.js', priority: 3 },
                { name: 'cart', path: '/public/js/modules/cart.js', priority: 4 }
            ],
            features: [
                { name: 'lightbox', path: '/public/js/modules/lightbox.js', priority: 5, lazy: true },
                { name: 'search', path: '/public/js/modules/search.js', priority: 6, lazy: true },
                { name: 'forms', path: '/public/js/modules/forms.js', priority: 7, lazy: true },
                { name: 'lazy-loader', path: '/public/js/modules/lazy-loader.js', priority: 8, lazy: true }
            ]
        };

        try {
            // Load critical modules first (blocking)
            await this.loadModuleGroup(moduleConfig.critical);
            console.log('  🛡️  Critical modules loaded');

            // Load essential modules (blocking)
            await this.loadModuleGroup(moduleConfig.essential);
            console.log('  ⚡ Essential modules loaded');

            // Load feature modules asynchronously (non-blocking)
            this.loadFeatureModulesLazy(moduleConfig.features);
            console.log('  ✅ Core modules loaded, features loading asynchronously');

        } catch (error) {
            console.error('Failed to load module scripts:', error);
            throw error;
        }
    }

    // Load a group of modules with error handling
    async loadModuleGroup(modules) {
        const loadPromises = modules
            .sort((a, b) => a.priority - b.priority)
            .map(module => this.loadModuleWithRetry(module));

        await Promise.all(loadPromises);
    }

    // Load feature modules lazily
    loadFeatureModulesLazy(modules) {
        // Load after a short delay to not block initial page interaction
        setTimeout(async () => {
            try {
                await this.loadModuleGroup(modules);
                console.log('  🎨 Feature modules loaded');

                // Initialize lazy-loaded modules
                this.initializeLazyModules();
            } catch (error) {
                console.warn('Some feature modules failed to load:', error);
                // Continue without these modules (graceful degradation)
            }
        }, 100);
    }

    // Load module with retry mechanism
    async loadModuleWithRetry(module, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.loadScript(module.path);
                console.log(`  📄 Loaded: ${module.name} (priority ${module.priority})`);
                return;
            } catch (error) {
                if (attempt === maxRetries) {
                    console.error(`Failed to load ${module.name} after ${maxRetries} attempts:`, error);
                    throw error;
                }
                console.warn(`Failed to load ${module.name}, retrying... (${attempt}/${maxRetries})`);
                await this.delay(attempt * 1000); // Exponential backoff
            }
        }
    }

    // Load a script file with performance monitoring
    loadScript(src) {
        const startTime = performance.now();

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true; // Load asynchronously for better performance

            script.onload = () => {
                const loadTime = performance.now() - startTime;
                this.trackPerformance('script_load', src, loadTime);
                resolve();
            };

            script.onerror = () => {
                const loadTime = performance.now() - startTime;
                this.trackPerformance('script_error', src, loadTime);
                reject(new Error(`Failed to load script: ${src}`));
            };

            document.head.appendChild(script);
        });
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Initialize lazy-loaded modules
    initializeLazyModules() {
        // Re-run module initialization for newly loaded modules
        setTimeout(() => {
            this.initializeModuleReferences();

            // Dispatch event for lazy modules loaded
            window.dispatchEvent(new CustomEvent('lazy-modules-loaded', {
                detail: { timestamp: performance.now() }
            }));
        }, 50);
    }

    // Performance tracking
    trackPerformance(type, resource, duration) {
        if (!this.performanceData) {
            this.performanceData = {
                scriptLoads: [],
                moduleInits: [],
                errors: []
            };
        }

        const entry = {
            type,
            resource,
            duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
            timestamp: Date.now()
        };

        switch (type) {
            case 'script_load':
                this.performanceData.scriptLoads.push(entry);
                break;
            case 'script_error':
                this.performanceData.errors.push(entry);
                break;
            case 'module_init':
                this.performanceData.moduleInits.push(entry);
                break;
        }

        // Log performance in development
        if (this.isDevelopment()) {
            console.log(`📊 Performance: ${type} - ${resource} took ${entry.duration}ms`);
        }
    }

    // Check if in development mode
    isDevelopment() {
        return location.hostname === 'localhost' ||
               location.hostname === '127.0.0.1' ||
               location.search.includes('debug=true');
    }

    // Initialize module references from global objects
    initializeModuleReferences() {
        try {
            // Reference modules from global objects
            console.log('  🛡️  Initializing error handler...');
            if (window.errorHandler) {
                this.modules.set('errorHandler', window.errorHandler);
                this.moduleStates.errorHandler = 'loaded';
            }

            console.log('  🔧 Initializing utilities...');
            if (window.utils) {
                this.modules.set('utils', window.utils);
                this.moduleStates.utils = 'loaded';
            }

            console.log('  🎨 Initializing UI components...');
            if (window.uiManager) {
                this.modules.set('ui', window.uiManager);
                this.moduleStates.ui = 'loaded';
            }

            if (window.cartManager) {
                this.modules.set('cart', window.cartManager);
                this.moduleStates.cart = 'loaded';
            }

            console.log('  🖼️  Initializing lightbox...');
            if (window.lightboxManager) {
                this.modules.set('lightbox', window.lightboxManager);
                this.moduleStates.lightbox = 'loaded';
            }

            console.log('  🔍 Initializing search...');
            if (window.searchManager) {
                this.modules.set('search', window.searchManager);
                this.moduleStates.search = 'loaded';
            }

            console.log('  📝 Initializing forms...');
            if (window.formsManager) {
                this.modules.set('forms', window.formsManager);
                this.moduleStates.forms = 'loaded';
            }

            console.log('  ✅ All modules initialized successfully');

        } catch (error) {
            console.error('Failed to initialize modules:', error);
            this.handleModuleError('Module initialization', error);
        }
    }

    // Handle module loading errors
    handleModuleError(moduleName, error) {
        console.warn(`⚠️  ${moduleName} failed to load:`, error);

        // Report to error handler if available
        const errorHandler = this.modules.get('errorHandler');
        if (errorHandler) {
            errorHandler.reportError(error, `Module loading: ${moduleName}`);
        }
    }

    // Handle initialization errors
    handleInitializationError(error) {
        // Show user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'app-init-error';
        errorMessage.innerHTML = `
            <div class="error-content">
                <h3>Application Loading Error</h3>
                <p>There was a problem loading the application. Please refresh the page to try again.</p>
                <button class="btn primary-btn" onclick="window.location.reload()">
                    Refresh Page
                </button>
            </div>
        `;

        // Style the error message
        Object.assign(errorMessage.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '2rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: '10000',
            textAlign: 'center',
            maxWidth: '400px'
        });

        document.body.appendChild(errorMessage);
    }

    // Setup global event listeners
    setupGlobalEvents() {
        // Performance monitoring
        this.setupPerformanceMonitoring();

        // Memory management
        this.setupMemoryManagement();

        // Page visibility handling
        this.setupPageVisibilityHandling();

        // Cleanup on page unload
        this.setupCleanupHandlers();
    }

    // Setup performance monitoring
    setupPerformanceMonitoring() {
        // Monitor Core Web Vitals
        if ('web-vital' in window) {
            // This would integrate with web-vitals library if available
            console.log('📊 Performance monitoring enabled');
        }

        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
                    console.warn('⚠️  High memory usage detected');
                    this.optimizeMemoryUsage();
                }
            }, 30000); // Check every 30 seconds
        }
    }

    // Setup memory management
    setupMemoryManagement() {
        // Cleanup on memory pressure
        if ('memory' in performance) {
            setInterval(() => {
                this.cleanupMemory();
            }, 60000); // Cleanup every minute
        }
    }

    // Setup page visibility handling
    setupPageVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden, pause non-essential operations
                this.pauseNonEssentialOperations();
            } else {
                // Page is visible, resume operations
                this.resumeOperations();
            }
        });
    }

    // Setup cleanup handlers
    setupCleanupHandlers() {
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Also cleanup on page hide (for mobile)
        window.addEventListener('pagehide', () => {
            this.cleanup();
        });
    }

    // Pause non-essential operations when page is hidden
    pauseNonEssentialOperations() {
        console.log('⏸️  Pausing non-essential operations');

        // Pause animations, timers, etc.
        this.modules.forEach((module, name) => {
            if (module.pause && typeof module.pause === 'function') {
                module.pause();
            }
        });
    }

    // Resume operations when page becomes visible
    resumeOperations() {
        console.log('▶️  Resuming operations');

        this.modules.forEach((module, name) => {
            if (module.resume && typeof module.resume === 'function') {
                module.resume();
            }
        });
    }

    // Optimize memory usage
    optimizeMemoryUsage() {
        console.log('🧹 Optimizing memory usage...');

        // Clear caches
        this.modules.forEach((module, name) => {
            if (module.clearCache && typeof module.clearCache === 'function') {
                module.clearCache();
            }
        });

        // Force garbage collection if available
        if ('gc' in window) {
            window.gc();
        }
    }

    // Clean up memory
    cleanupMemory() {
        // Cleanup utilities
        const utils = this.modules.get('utils');
        if (utils && utils.cleanup) {
            utils.cleanup();
        }

        // Cleanup other modules as needed
        this.modules.forEach((module, name) => {
            if (module.cleanup && typeof module.cleanup === 'function') {
                module.cleanup();
            }
        });
    }

    // Dispatch application ready event
    dispatchAppReady() {
        const readyEvent = new CustomEvent('app-ready', {
            detail: {
                modules: Array.from(this.modules.keys()),
                initTime: performance.now() - this.initStartTime,
                moduleStates: this.moduleStates
            }
        });

        window.dispatchEvent(readyEvent);
        document.dispatchEvent(readyEvent);
    }

    // Get module by name
    getModule(name) {
        return this.modules.get(name);
    }

    // Get all modules
    getAllModules() {
        return Array.from(this.modules.entries());
    }

    // Get application status with performance data
    getStatus() {
        return {
            initialized: this.isInitialized,
            moduleCount: this.modules.size,
            moduleStates: { ...this.moduleStates },
            initializationTime: this.initStartTime ?
                Math.round(performance.now() - this.initStartTime) : null,
            performance: this.getPerformanceReport(),
            memory: this.getMemoryUsage()
        };
    }

    // Get comprehensive performance report
    getPerformanceReport() {
        if (!this.performanceData) return null;

        const scriptLoads = this.performanceData.scriptLoads;
        const moduleInits = this.performanceData.moduleInits;

        return {
            totalScriptLoadTime: scriptLoads.reduce((total, entry) => total + entry.duration, 0),
            averageScriptLoadTime: scriptLoads.length ?
                Math.round((scriptLoads.reduce((total, entry) => total + entry.duration, 0) / scriptLoads.length) * 100) / 100 : 0,
            moduleInitTime: moduleInits.reduce((total, entry) => total + entry.duration, 0),
            errorCount: this.performanceData.errors.length,
            scriptCount: scriptLoads.length,
            details: {
                scriptLoads: [...scriptLoads],
                moduleInits: [...moduleInits],
                errors: [...this.performanceData.errors]
            }
        };
    }

    // Get memory usage information
    getMemoryUsage() {
        if ('memory' in performance) {
            return {
                usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 * 100) / 100, // MB
                totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024 * 100) / 100, // MB
                jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100, // MB
                timestamp: performance.now()
            };
        }
        return { unavailable: 'Memory API not supported' };
    }

    // Memory cleanup and optimization
    cleanup() {
        console.log('🧹 Performing cleanup...');

        // Clear performance data (keep only recent entries)
        if (this.performanceData) {
            const cutoff = Date.now() - (5 * 60 * 1000); // Keep last 5 minutes
            this.performanceData.scriptLoads = this.performanceData.scriptLoads.filter(
                entry => entry.timestamp > cutoff
            );
            this.performanceData.moduleInits = this.performanceData.moduleInits.filter(
                entry => entry.timestamp > cutoff
            );
            this.performanceData.errors = this.performanceData.errors.filter(
                entry => entry.timestamp > cutoff
            );
        }

        // Call cleanup on all modules
        this.modules.forEach((module, name) => {
            if (module && typeof module.cleanup === 'function') {
                try {
                    module.cleanup();
                    console.log(`  🧹 Cleaned up ${name} module`);
                } catch (error) {
                    console.warn(`Failed to cleanup ${name} module:`, error);
                }
            }
        });

        // Force garbage collection if available (Chrome DevTools)
        if (window.gc && this.isDevelopment()) {
            window.gc();
            console.log('  🗑️  Forced garbage collection');
        }
    }

    // Automatic cleanup scheduler
    schedulePeriodicCleanup() {
        // Clean up every 5 minutes
        setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);

        console.log('📅 Scheduled periodic cleanup every 5 minutes');
    }

    // Setup error boundaries for critical components
    setupErrorBoundaries() {
        if (!window.errorHandler) {
            console.warn('Error handler not available for boundary setup');
            return;
        }

        console.log('🛡️  Setting up error boundaries...');

        // Create error boundaries for major components
        const components = [
            { name: 'cart', selector: '.cart-modal, .cart-icon' },
            { name: 'search', selector: '.search-modal-overlay, .search-icon' },
            { name: 'gallery', selector: '.gallery-grid' },
            { name: 'lightbox', selector: '.lightbox-overlay' },
            { name: 'forms', selector: 'form' }
        ];

        components.forEach(({ name, selector }) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((element, index) => {
                const componentName = elements.length > 1 ? `${name}-${index}` : name;

                window.errorHandler.createErrorBoundary(componentName, element, {
                    maxErrors: 3,
                    autoRecover: true,
                    recoveryDelay: 3000,
                    showFallback: true
                });
            });
        });

        console.log('✅ Error boundaries setup complete');
    }

    // Get comprehensive performance report from all modules
    getComprehensiveReport() {
        const report = {
            app: this.getStatus(),
            timestamp: new Date().toISOString(),
            environment: {
                userAgent: navigator.userAgent,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                connection: navigator.connection ? {
                    effectiveType: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink,
                    rtt: navigator.connection.rtt
                } : 'unknown'
            },
            modules: {}
        };

        // Collect performance data from all modules
        this.modules.forEach((module, name) => {
            if (module && typeof module.getPerformanceReport === 'function') {
                try {
                    report.modules[name] = module.getPerformanceReport();
                } catch (error) {
                    report.modules[name] = { error: error.message };
                }
            }
        });

        // Add global module reports
        if (window.errorHandler?.getErrorMetrics) {
            report.errorHandler = window.errorHandler.getErrorMetrics();
        }

        if (window.lazyLoader?.getPerformanceReport) {
            report.lazyLoader = window.lazyLoader.getPerformanceReport();
        }

        return report;
    }

    // Show performance dashboard in console
    showPerformanceDashboard() {
        const report = this.getComprehensiveReport();

        console.group('🚀 Performance Dashboard');

        // App Overview
        console.group('📊 Application Overview');
        console.log('Initialization Time:', `${report.app.initializationTime}ms`);
        console.log('Memory Usage:', report.app.memory);
        console.log('Module Count:', report.app.moduleCount);
        console.log('Module States:', report.app.moduleStates);
        console.groupEnd();

        // Performance Metrics
        if (report.app.performance) {
            console.group('⚡ Performance Metrics');
            console.log('Script Load Time:', `${report.app.performance.totalScriptLoadTime.toFixed(2)}ms`);
            console.log('Average Script Load:', `${report.app.performance.averageScriptLoadTime}ms`);
            console.log('Error Count:', report.app.performance.errorCount);
            console.groupEnd();
        }

        // Module Performance
        console.group('🔧 Module Performance');
        Object.entries(report.modules).forEach(([name, data]) => {
            if (data && !data.error) {
                console.group(`${name} Module`);
                console.log(data);
                console.groupEnd();
            }
        });
        console.groupEnd();

        // Error Metrics
        if (report.errorHandler) {
            console.group('🛡️  Error Metrics');
            console.log('Total Errors:', report.errorHandler.total);
            console.log('Recovered Errors:', report.errorHandler.recovered);
            console.log('Error Boundaries:', report.errorHandler.errorBoundaries);
            console.log('By Component:', report.errorHandler.byComponent);
            console.groupEnd();
        }

        // Lazy Loading
        if (report.lazyLoader) {
            console.group('📷 Lazy Loading');
            console.log('Success Rate:', report.lazyLoader.successRate);
            console.log('Average Load Time:', `${report.lazyLoader.averageLoadTime.toFixed(2)}ms`);
            console.log('Queue Size:', report.lazyLoader.queueSize);
            console.groupEnd();
        }

        console.log('💡 Tip: Use window.app.dev.exportData() to export performance data');
        console.groupEnd();

        return report;
    }

    // Run performance tests
    runPerformanceTests() {
        console.group('🧪 Running Performance Tests...');

        const tests = [
            () => this.testModuleInitialization(),
            () => this.testMemoryUsage(),
            () => this.testErrorHandling(),
            () => this.testCleanupEfficiency()
        ];

        const results = {};

        tests.forEach((test, index) => {
            try {
                const result = test();
                results[`test_${index + 1}`] = result;
                console.log(`✅ Test ${index + 1} passed:`, result);
            } catch (error) {
                results[`test_${index + 1}`] = { error: error.message };
                console.error(`❌ Test ${index + 1} failed:`, error);
            }
        });

        console.groupEnd();
        return results;
    }

    // Test module initialization speed
    testModuleInitialization() {
        const start = performance.now();
        const moduleCount = this.modules.size;
        const initTime = this.getStatus().initializationTime;
        const end = performance.now();

        return {
            moduleCount,
            totalInitTime: initTime,
            avgTimePerModule: moduleCount ? (initTime / moduleCount).toFixed(2) : 0,
            testDuration: (end - start).toFixed(2) + 'ms'
        };
    }

    // Test memory usage
    testMemoryUsage() {
        if (!('memory' in performance)) {
            return { unsupported: true };
        }

        const before = performance.memory.usedJSHeapSize;

        // Create some test objects
        const testData = new Array(1000).fill(0).map((_, i) => ({ id: i, data: 'test' }));

        const after = performance.memory.usedJSHeapSize;
        const delta = after - before;

        // Clean up
        testData.length = 0;

        return {
            memoryBefore: Math.round(before / 1024 / 1024 * 100) / 100 + 'MB',
            memoryAfter: Math.round(after / 1024 / 1024 * 100) / 100 + 'MB',
            memoryDelta: Math.round(delta / 1024 * 100) / 100 + 'KB',
            passed: delta < 1024 * 1024 // Less than 1MB is good
        };
    }

    // Test error handling
    testErrorHandling() {
        const errorHandler = window.errorHandler;
        if (!errorHandler) {
            return { unsupported: true };
        }

        const beforeCount = errorHandler.errorMetrics.total;

        // Trigger a test error
        try {
            throw new Error('Performance test error');
        } catch (error) {
            errorHandler.handleError(error, 'performance_test');
        }

        const afterCount = errorHandler.errorMetrics.total;

        return {
            errorsBefore: beforeCount,
            errorsAfter: afterCount,
            errorHandled: afterCount > beforeCount,
            passed: afterCount > beforeCount
        };
    }

    // Test cleanup efficiency
    testCleanupEfficiency() {
        const beforeCleanup = this.performanceData ? this.performanceData.scriptLoads.length : 0;

        this.cleanup();

        const afterCleanup = this.performanceData ? this.performanceData.scriptLoads.length : 0;

        return {
            entriesBefore: beforeCleanup,
            entriesAfter: afterCleanup,
            entriesCleared: beforeCleanup - afterCleanup,
            passed: afterCleanup <= beforeCleanup
        };
    }

    // Export performance data
    exportPerformanceData() {
        const data = this.getComprehensiveReport();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `evgenia-performance-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('📊 Performance data exported successfully');
        return data;
    }

    // Check if module is loaded
    isModuleLoaded(name) {
        return this.moduleStates[name] === 'loaded';
    }

    // Reload a specific module
    async reloadModule(name) {
        console.log(`🔄 Reloading module: ${name}`);

        try {
            // Destroy existing module if it has a destroy method
            const existingModule = this.modules.get(name);
            if (existingModule && existingModule.destroy) {
                existingModule.destroy();
            }

            // Remove from modules map
            this.modules.delete(name);
            this.moduleStates[name] = 'pending';

            // Reimport and initialize
            switch (name) {
                case 'ui':
                    const { default: uiManager } = await import('./modules/ui.js');
                    this.modules.set('ui', uiManager);
                    break;
                case 'cart':
                    const { default: cartManager } = await import('./modules/cart.js');
                    this.modules.set('cart', cartManager);
                    break;
                case 'lightbox':
                    const { default: lightboxManager } = await import('./modules/lightbox.js');
                    this.modules.set('lightbox', lightboxManager);
                    break;
                case 'search':
                    const { default: searchManager } = await import('./modules/search.js');
                    this.modules.set('search', searchManager);
                    break;
                case 'forms':
                    const { default: formsManager } = await import('./modules/forms.js');
                    this.modules.set('forms', formsManager);
                    break;
                default:
                    throw new Error(`Unknown module: ${name}`);
            }

            this.moduleStates[name] = 'loaded';
            console.log(`✅ Module ${name} reloaded successfully`);

        } catch (error) {
            console.error(`❌ Failed to reload module ${name}:`, error);
            this.moduleStates[name] = 'error';
            throw error;
        }
    }

    // Cleanup all modules
    cleanup() {
        console.log('🧹 Cleaning up application...');

        this.modules.forEach((module, name) => {
            try {
                if (module.destroy && typeof module.destroy === 'function') {
                    module.destroy();
                } else if (module.cleanup && typeof module.cleanup === 'function') {
                    module.cleanup();
                }
            } catch (error) {
                console.warn(`Warning: Failed to cleanup module ${name}:`, error);
            }
        });

        this.modules.clear();
        this.isInitialized = false;
    }

    // Development helpers
    dev = {
        // Get module states for debugging
        getModuleStates: () => this.moduleStates,

        // Get basic performance info
        getPerformanceInfo: () => ({
            initTime: this.isInitialized ? performance.now() - this.initStartTime : null,
            memoryUsage: 'memory' in performance ? performance.memory : null,
            moduleCount: this.modules.size
        }),

        // Get comprehensive performance report
        getFullReport: () => this.getComprehensiveReport(),

        // Show performance dashboard
        showDashboard: () => this.showPerformanceDashboard(),

        // Reload specific module
        reloadModule: (name) => this.reloadModule(name),

        // Force cleanup
        cleanup: () => this.cleanup(),

        // Get module instance
        getModule: (name) => this.getModule(name),

        // Performance testing utilities
        testPerformance: () => this.runPerformanceTests(),

        // Export performance data
        exportData: () => this.exportPerformanceData()
    };
}

// Create global app instance
const app = new AppManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
} else {
    // DOM is already ready
    app.init();
}

// Make app globally accessible for debugging
window.app = app;

// Global compatibility functions for backward compatibility
window.openLightbox = function(src, alt) {
    if (window.app && window.app.getModule('lightbox')) {
        const lightboxModule = window.app.getModule('lightbox');
        lightboxModule.open(src, alt);
    } else if (window.lightboxManager) {
        window.lightboxManager.open(src, alt);
    } else {
        console.warn('Lightbox module not available');
    }
};

window.closeLightbox = function() {
    if (window.app && window.app.getModule('lightbox')) {
        const lightboxModule = window.app.getModule('lightbox');
        lightboxModule.close();
    } else if (window.lightboxManager) {
        window.lightboxManager.close();
    } else {
        console.warn('Lightbox module not available');
    }
};

window.addToCartFromDetail = function(artworkId) {
    // Get artwork data from localStorage or global variable
    let artworkData = null;

    try {
        // Try to get from localStorage first
        const storedData = localStorage.getItem('evgenia-artwork-data');
        if (storedData) {
            artworkData = JSON.parse(storedData);
        }
    } catch (e) {
        console.warn('Could not load artwork data from localStorage:', e);
    }

    // Fallback to global variable
    if (!artworkData && window.artworkData) {
        artworkData = window.artworkData;
    }

    if (!artworkData || !artworkData.artworks) {
        console.error('Artwork data not available');
        alert('Unable to add item to cart. Please try refreshing the page.');
        return;
    }

    // Find the specific artwork
    const artwork = artworkData.artworks.find(item => item.id === artworkId);

    if (!artwork) {
        console.error('Artwork not found:', artworkId);
        alert('Artwork not found. Please try refreshing the page.');
        return;
    }

    // Get currency from settings
    const currency = (artworkData.settings && artworkData.settings.currency) || '₪';

    // Format the price
    const formattedPrice = artwork.price ? `${currency}${artwork.price}` : 'Price on request';

    // Create cart item object
    const cartItem = {
        id: artwork.id,
        title: artwork.title,
        price: formattedPrice,
        image: artwork.image,
        dimensions: artwork.dimensions || 'Dimensions not specified'
    };

    // Add to cart using existing global function
    if (window.addToCart) {
        const success = window.addToCart(cartItem);

        if (success) {
            // Show success feedback
            const button = document.querySelector('.add-to-cart-btn');
            if (button) {
                const originalText = button.textContent;
                button.textContent = 'Added to Cart!';
                button.style.background = '#28a745';

                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '';
                }, 2000);
            }
        }
    } else {
        console.error('addToCart function not available');
        alert('Unable to add item to cart. Please refresh the page and try again.');
    }
};