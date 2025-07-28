#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Fixing Critical CSS Implementation...\n');

// Function to fix CSS loading in HTML files
function fixCriticalCSS(htmlFile) {
  console.log(`Fixing ${htmlFile}...`);
  
  if (!fs.existsSync(htmlFile)) {
    console.log(`File ${htmlFile} not found, skipping...`);
    return;
  }
  
  let html = fs.readFileSync(htmlFile, 'utf8');
  
  // Update the critical CSS to remove the visibility hidden issue
  // and add proper CSS loading script
  const updatedCriticalCSS = `
/* Critical CSS - Above the fold styles */

:root {
  --primary-color: #40e0d0;
  --primary-dark: #2fb3a8;
  --primary-light: #6bece0;
  --secondary-color: #333333;
  --text-color: #333333;
  --text-light: #666666;
  --background-color: #ffffff;
  --background-light: #f9f9f9;
  --border-color: #e0e0e0;
  --heading-font: 'Cormorant Garamond', serif;
  --body-font: 'Montserrat', sans-serif;
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2.5rem;
  --spacing-xl: 4rem;
  --border-radius: 4px;
  --box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s ease;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: var(--body-font);
  color: var(--text-color);
  line-height: 1.6;
  background-color: var(--background-color);
  /* Remove the visibility hidden - let content show immediately */
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--heading-font);
  font-weight: 500;
  line-height: 1.3;
  margin-bottom: var(--spacing-sm);
}

h1 { font-size: 3rem; }
h2 { font-size: 2.5rem; }

p {
  margin-bottom: var(--spacing-sm);
}

a {
  color: var(--secondary-color);
  text-decoration: none;
  transition: var(--transition);
}

a:hover {
  color: var(--primary-color);
}

ul {
  list-style: none;
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-sm);
}

header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  z-index: 1000;
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: var(--transition);
}

header.scrolled {
  padding: 0.5rem 0;
  background-color: rgba(255, 255, 255, 0.98);
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.logo a {
  font-family: var(--heading-font);
  font-size: 1.8rem;
  font-weight: 500;
  color: var(--secondary-color);
}

.header-logo {
  height: 40px;
  width: auto;
}

.nav-links ul {
  display: flex;
}

.nav-links ul li {
  margin-left: var(--spacing-md);
}

.nav-links ul li a {
  position: relative;
  color: var(--secondary-color);
  font-weight: 500;
}

.shop-icons {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* Basic gallery and page content styles */
.gallery-header, .about-content, .contact-content {
  padding-top: 100px;
  text-align: center;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-md);
  padding: var(--spacing-lg) 0;
}

.main-content {
  min-height: 60vh;
  padding: var(--spacing-xl) 0;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
  
  .mobile-menu-toggle {
    display: block;
  }
  
  h1 { font-size: 2.5rem; }
  
  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

/* CSS loading completed class for any custom animations */
.css-loaded {
  /* Optional: add any animations or transitions when all CSS is loaded */
}
`;

  // Replace the critical CSS block
  html = html.replace(
    /<style>[\s\S]*?<\/style>/,
    `<style>${updatedCriticalCSS}</style>
    <script>
      // Mark CSS as loaded once preloaded stylesheets are applied
      document.addEventListener('DOMContentLoaded', function() {
        // Give a small delay to ensure all preloaded CSS has been applied
        setTimeout(function() {
          document.body.classList.add('css-loaded');
        }, 100);
      });
    </script>`
  );
  
  fs.writeFileSync(htmlFile, html, 'utf8');
  console.log(`✅ Fixed critical CSS in ${htmlFile}`);
}

// Fix all HTML files
const htmlFiles = [
  'index.html',
  'gallery.html',
  'artwork.html',
  'about.html',
  'contact.html',
  '404.html'
];

htmlFiles.forEach(file => {
  fixCriticalCSS(file);
});

console.log('\n✅ Critical CSS fix completed!');
console.log('\nChanges made:');
console.log('- Removed visibility: hidden from body (content shows immediately)');
console.log('- Added basic styles for gallery, about, and contact pages');
console.log('- Added proper CSS loading detection script');
console.log('- Maintained performance benefits of critical CSS');
console.log('\nTest all pages to verify they now render correctly!'); 