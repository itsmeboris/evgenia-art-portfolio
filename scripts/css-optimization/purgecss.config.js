module.exports = {
  content: [
    './index.html',
    './gallery.html', 
    './artwork.html',
    './about.html',
    './contact.html',
    './404.html',
    './admin/index.html',
    './admin/login.html',
    './src/js/**/*.js',
    './admin/js/**/*.js'
  ],
  css: [
    './public/css/style.css',
    './public/css/additional-styles.css',
    './public/css/skeleton.css',
    './public/css/search-modal.css'
  ],
  output: './public/css/purged/',
  
  // Safelist - classes that should never be removed even if not found in content
  safelist: {
    standard: [
      // Dynamic classes added by JavaScript
      'loaded',
      'active',
      'scrolled',
      'visible',
      'hidden',
      'open',
      'closed',
      'disabled',
      'loading',
      'error',
      'success',
      
      // Animation classes
      'fade-in',
      'fade-out',
      'slide-in',
      'slide-out',
      
      // Modal and overlay classes
      'modal-open',
      'overlay-active',
      
      // Cart and shop related
      'cart-open',
      'cart-item',
      'cart-count',
      
      // Responsive utility classes
      'mobile-hidden',
      'desktop-hidden',
      'tablet-hidden',
      
      // Search functionality
      'search-active',
      'search-results',
      'search-open',
      
      // Lightbox and gallery
      'lightbox-active',
      'gallery-loading',
      
      // Form states
      'form-error',
      'form-success',
      'form-loading'
    ],
    
    // Pattern-based safelist for dynamic classes
    deep: [
      /^slide-/,
      /^nav-/,
      /^btn-/,
      /^cart-/,
      /^search-/,
      /^modal-/,
      /^gallery-/,
      /^artwork-/,
      /^filter-/,
      /^category-/,
      /^lightbox-/,
      /^form-/,
      /^admin-/,
      /^fa-/,  // Font Awesome icons
      /^fas-/, 
      /^far-/,
      /^fab-/
    ],
    
    // Keyframes that should be preserved
    keyframes: true,
    
    // Font faces that should be preserved  
    fontFace: true
  },
  
  // File extensions to process
  extractors: [
    {
      extractor: content => content.match(/[A-Za-z0-9-_:\/]+/g) || [],
      extensions: ['html', 'js']
    }
  ],
  
  // Options
  rejected: false, // Don't output rejected selectors for debugging
  
  // Variables to keep (CSS custom properties)
  variables: true
}; 