// Artwork Detail Page Entry Point
// Lightweight bundle for artwork detail pages with only required modules

// Import essential modules
import './modules/utils.js';
import './modules/error-handler.js';
import './modules/image-utils.js';
import './modules/cart.js';
import './modules/lightbox.js';
import './modules/search.js';
import './modules/ui.js';

// Import artwork loader
import './artwork-loader.js';

// Initialize modules for artwork pages
document.addEventListener('DOMContentLoaded', function () {
  // Initialize essential modules for artwork pages
  try {
    // Initialize search manager if available
    if (window.SearchManager && !window.searchManager) {
      window.searchManager = new SearchManager();
      window.searchManager.init();
    }

    // Initialize UI manager if available
    if (window.UIManager && !window.uiManager) {
      window.uiManager = new UIManager();
      window.uiManager.init();
    }

    console.log('📦 Artwork bundle initialized successfully');
  } catch (error) {
    console.error('Error initializing artwork modules:', error);
  }
});
