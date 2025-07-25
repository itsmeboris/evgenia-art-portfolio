// Main Entry Point - Webpack bundle entry for all pages
// This replaces the old script tag loading pattern with proper ES6 modules

// Import core utilities first (order matters for dependencies)
import './modules/utils.js';
import './modules/error-handler.js';

// Import UI and interaction modules
import './modules/image-utils.js';
import './modules/lazy-loader.js';
import './modules/forms.js';
import './modules/ui.js';

// Import feature modules
import './modules/cart.js';
import './modules/search.js';
import './modules/lightbox.js';
import './modules/skeleton-loader.js';
import './modules/meta-tags.js';
import './modules/sitemap-service.js';

// Import artwork loader
import './artwork-loader.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Initializing Evgenia Portnov Art Website...');

  // Simple module availability check
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

  // Log available modules
  Object.entries(moduleMap).forEach(([moduleName, globalName]) => {
    if (window[globalName]) {
      console.log(`✅ Loaded ${moduleName}`);
    } else {
      console.log(`⚠️ ${moduleName} not available`);
    }
  });

  console.log('📦 Main bundle initialized successfully');
});
