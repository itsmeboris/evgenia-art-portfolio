#!/usr/bin/env node

const { PurgeCSS } = require('purgecss');
const fs = require('fs');
const path = require('path');

// Import the configuration
const purgeConfig = require('./purgecss.config.js');

async function runPurgeCSS() {
  console.log('🚀 Starting Unused CSS Removal...\n');

  // Get original file sizes for comparison
  console.log('📊 Original CSS file sizes:');
  let totalOriginalSize = 0;

  for (const cssFile of purgeConfig.css) {
    if (fs.existsSync(cssFile)) {
      const stats = fs.statSync(cssFile);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`  ${cssFile}: ${sizeKB} KB`);
      totalOriginalSize += stats.size;
    }
  }

  console.log(`  Total: ${(totalOriginalSize / 1024).toFixed(2)} KB\n`);

  try {
    // Run PurgeCSS
    console.log('🧹 Purging unused CSS...');
    const purgeCSSResult = await new PurgeCSS().purge(purgeConfig);

    let totalPurgedSize = 0;
    let filesProcessed = 0;

    // Save purged CSS files
    for (const result of purgeCSSResult) {
      const originalFile = result.file;
      const fileName = path.basename(originalFile);
      const purgedFile = path.join(purgeConfig.output, fileName);

      // Write purged CSS
      fs.writeFileSync(purgedFile, result.css, 'utf8');

      const purgedSize = Buffer.byteLength(result.css, 'utf8');
      totalPurgedSize += purgedSize;
      filesProcessed++;

      console.log(`✅ ${fileName}: ${(purgedSize / 1024).toFixed(2)} KB (purged)`);
    }

    // Calculate savings
    const savings = totalOriginalSize - totalPurgedSize;
    const savingsPercent = ((savings / totalOriginalSize) * 100).toFixed(1);

    console.log('\n📈 Purge Results:');
    console.log(`  Original size: ${(totalOriginalSize / 1024).toFixed(2)} KB`);
    console.log(`  Purged size: ${(totalPurgedSize / 1024).toFixed(2)} KB`);
    console.log(`  Savings: ${(savings / 1024).toFixed(2)} KB (${savingsPercent}%)`);
    console.log(`  Files processed: ${filesProcessed}`);

    // Create backup of original files and replace with purged versions
    console.log('\n🔄 Creating backups and applying purged CSS...');

    // Ensure backup directory exists
    const backupDir = './backups/css-optimization/public-css';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    for (const result of purgeCSSResult) {
      const originalFile = result.file;
      const fileName = path.basename(originalFile);
      const backupFile = path.join(backupDir, fileName + '.backup');
      const purgedFile = path.join(purgeConfig.output, fileName);

      // Create backup
      if (!fs.existsSync(backupFile)) {
        fs.copyFileSync(originalFile, backupFile);
        console.log(`📦 Backup created: ${backupFile}`);
      }

      // Replace original with purged version
      fs.copyFileSync(purgedFile, originalFile);
      console.log(`✅ Applied purged CSS: ${originalFile}`);
    }

    console.log('\n✅ CSS Optimization completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test website functionality across all pages');
    console.log('2. Check for any visual regressions');
    console.log('3. Measure performance improvements');
    console.log('4. If issues found, restore from .backup files');

    // Performance measurement suggestions
    console.log('\n🎯 Performance Testing:');
    console.log('- Use Chrome DevTools Lighthouse for Core Web Vitals');
    console.log('- Test First Contentful Paint (FCP) improvements');
    console.log('- Verify CSS bundle size reduction in Network tab');
    console.log('- Test on mobile devices for real-world performance');

  } catch (error) {
    console.error('❌ Error during CSS purging:', error);
    console.log('\nRecommendations:');
    console.log('- Check that all HTML and JS files exist');
    console.log('- Verify PurgeCSS configuration');
    console.log('- Review safelist patterns for dynamic classes');
  }
}

// Helper function to restore from backups if needed
function createRestoreScript() {
  const restoreScript = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Restoring CSS files from backups...');

const cssFiles = [
  './public/css/style.css',
  './public/css/additional-styles.css',
  './public/css/skeleton.css',
  './public/css/search-modal.css'
];

cssFiles.forEach(file => {
  const filename = path.basename(file);
  const backupFile = \`./backups/css-optimization/public-css/\${filename}.backup\`;
  if (fs.existsSync(backupFile)) {
    fs.copyFileSync(backupFile, file);
    console.log(\`✅ Restored: \${file}\`);
  } else {
    console.log(\`⚠️  No backup found for: \${file}\`);
  }
});

console.log('✅ Restore completed!');
`;

  fs.writeFileSync('scripts/css-optimization/restore-css.js', restoreScript, 'utf8');
  console.log('📝 Created restore script: scripts/css-optimization/restore-css.js');
}

// Run the purging process
runPurgeCSS().then(() => {
  createRestoreScript();
}).catch(error => {
  console.error('Failed to complete CSS optimization:', error);
});