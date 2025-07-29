#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Critical CSS content that needs to be inlined for above-the-fold rendering
const criticalCSS = `
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
  visibility: hidden;
}

body.loaded {
  visibility: visible;
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

.hero {
  padding-top: 80px;
  position: relative;
  overflow: hidden;
}

.hero-slider {
  position: relative;
}

.slide {
  display: flex;
  align-items: center;
  min-height: 600px;
  display: none;
}

.slide.active {
  display: flex;
}

.slide-content {
  flex: 1;
  padding: var(--spacing-xl) 0;
}

.slide-content h1 {
  margin-bottom: var(--spacing-sm);
}

.slide-content p {
  font-size: 1.2rem;
  margin-bottom: var(--spacing-md);
}

.cta-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.btn {
  display: inline-block;
  padding: 12px 24px;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: var(--transition);
  text-decoration: none;
}

.primary-btn {
  background-color: var(--primary-color);
  color: white;
}

.primary-btn:hover {
  background-color: var(--primary-dark);
  color: white;
}

.secondary-btn {
  background-color: transparent;
  color: var(--secondary-color);
  border: 2px solid var(--secondary-color);
}

.secondary-btn:hover {
  background-color: var(--secondary-color);
  color: white;
}

/* Mobile menu toggle - visible only on mobile */
.mobile-menu-toggle {
  display: none;
  cursor: pointer;
  font-size: 1.2rem;
}

/* Basic responsive styles for mobile */
@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
  
  .mobile-menu-toggle {
    display: block;
  }
  
  h1 { font-size: 2.5rem; }
  
  .slide {
    flex-direction: column;
    text-align: center;
  }
  
  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }
}
`;

// Function to inline critical CSS in HTML files
function inlineCriticalCSS(htmlFile) {
  console.log(`Processing ${htmlFile}...`);

  if (!fs.existsSync(htmlFile)) {
    console.log(`File ${htmlFile} not found, skipping...`);
    return;
  }

  let html = fs.readFileSync(htmlFile, 'utf8');

  // Check if critical CSS is already inlined
  if (html.includes('/* Critical CSS - Above the fold styles */')) {
    console.log(`Critical CSS already inlined in ${htmlFile}, skipping...`);
    return;
  }

  // Remove the old inline style that only had visibility hidden
  html = html.replace(
    /<style>\s*body\s*\{\s*visibility:\s*hidden;\s*\}\s*\.loaded\s*\{\s*visibility:\s*visible;\s*\}\s*<\/style>/,
    ''
  );

  // Find the location to insert critical CSS (before closing </head>)
  const headCloseIndex = html.indexOf('</head>');
  if (headCloseIndex === -1) {
    console.log(`No </head> tag found in ${htmlFile}, skipping...`);
    return;
  }

  // Insert critical CSS
  const beforeHead = html.substring(0, headCloseIndex);
  const afterHead = html.substring(headCloseIndex);

  const criticalCSSBlock = `    <style>${criticalCSS}</style>\n`;

  const newHTML = beforeHead + criticalCSSBlock + afterHead;

  // Write the updated HTML
  fs.writeFileSync(htmlFile, newHTML, 'utf8');
  console.log(`✅ Critical CSS inlined in ${htmlFile}`);
}

// Function to defer non-critical CSS loading
function deferNonCriticalCSS(htmlFile) {
  console.log(`Deferring non-critical CSS in ${htmlFile}...`);

  let html = fs.readFileSync(htmlFile, 'utf8');

  // Convert CSS links to defer loading (except for fonts and external CSS)
  html = html.replace(
    /<link rel="stylesheet" href="(public\/css\/[^"]+)"\s*\/?>/g,
    '<link rel="preload" href="$1" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">\n    <noscript><link rel="stylesheet" href="$1"></noscript>'
  );

  fs.writeFileSync(htmlFile, html, 'utf8');
  console.log(`✅ Non-critical CSS deferred in ${htmlFile}`);
}

// Main execution
const htmlFiles = [
  'index.html',
  'gallery.html',
  'artwork.html',
  'about.html',
  'contact.html',
  '404.html',
];

console.log('🚀 Starting Critical CSS Implementation...\n');

htmlFiles.forEach(file => {
  inlineCriticalCSS(file);
  deferNonCriticalCSS(file);
  console.log('');
});

console.log('✅ Critical CSS implementation completed!');
console.log('\nNext steps:');
console.log('1. Test all pages for visual regressions');
console.log('2. Measure performance improvements');
console.log('3. Proceed with unused CSS removal');
