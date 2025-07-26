// Core Entry Point - Essential modules loaded on every page
// This bundle contains utilities and core functionality needed everywhere

// Core utilities (always needed)
import './modules/browser-logger.js'; // Must be first for global logger availability
import './modules/utils.js';
import './modules/error-handler.js';
import './modules/image-utils.js';

// Make core utilities available globally for backwards compatibility
// These will be tree-shaken if not used
window.addEventListener('load', () => {
  logger.info(
    'Core bundle loaded successfully',
    { module: 'core-entry', function: 'load' },
    { bundleSize: document.querySelectorAll('script').length }
  );
});
