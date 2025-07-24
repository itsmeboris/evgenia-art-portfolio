// Simplified Main Application - Basic module loading without complex retry logic

export default class AppManager {
  constructor() {
    this.modules = {};
    this.isInitialized = false;
  }

  // Simple initialization
  async init() {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing Evgenia Portnov Art Website...');

      // Simple module loading - just use existing global instances
      this.loadModules();

      this.isInitialized = true;
      console.log('✅ App initialization complete!');
    } catch (error) {
      console.error('❌ App initialization error:', error);
    }
  }

  // Simple module loading
  loadModules() {
    // Map global instances
    const moduleMap = {
      'error-handler': 'errorHandler',
      utils: 'utils',
      'image-utils': 'imageUtils',
      cart: 'cartManager',
      forms: 'formsManager',
      lightbox: 'lightboxManager',
      search: 'searchManager',
      ui: 'uiManager',
    };

    Object.entries(moduleMap).forEach(([moduleName, globalName]) => {
      if (window[globalName]) {
        this.modules[this.toCamelCase(moduleName)] = window[globalName];
        console.log(`✅ Loaded ${moduleName}`);
      } else {
        console.log(`⚠️ ${moduleName} not available`);
      }
    });
  }

  // Utility: Convert kebab-case to camelCase
  toCamelCase(str) {
    return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  // Public API: Get module by name
  getModule(moduleName) {
    return this.modules[this.toCamelCase(moduleName)];
  }
}

// Export for module usage - initialization will be handled by main.js entry point
