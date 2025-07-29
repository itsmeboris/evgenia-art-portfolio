#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Restoring CSS files from backups...');

const cssFiles = [
  './public/css/style.css',
  './public/css/additional-styles.css',
  './public/css/skeleton.css',
  './public/css/search-modal.css',
];

cssFiles.forEach(file => {
  const filename = path.basename(file);
  const backupFile = `./backups/css-optimization/public-css/${filename}.backup`;
  if (fs.existsSync(backupFile)) {
    fs.copyFileSync(backupFile, file);
    console.log(`✅ Restored: ${file}`);
  } else {
    console.log(`⚠️  No backup found for: ${file}`);
  }
});

console.log('✅ Restore completed!');
