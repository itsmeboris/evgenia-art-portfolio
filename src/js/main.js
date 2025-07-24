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

// Import artwork loader
import './artwork-loader.js';

// Import main application logic
import AppManager from './main-app.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Create global app instance
  window.app = new AppManager();

  // Initialize the app
  await window.app.init();

  console.log('📦 Main bundle initialized successfully');
});
