#!/usr/bin/env node

// DEPRECATED: This script has been replaced by the automated bundle updater
// Please use the new automated system instead:

const { execSync } = require('child_process');

console.log('⚠️  This script is deprecated!');
console.log('🔄 Redirecting to the new automated bundle updater...\n');

try {
  // Run the new automated script
  execSync('node scripts/update-html-bundles.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to run the new bundle updater:', error.message);
  console.log('\n💡 Please use: npm run update-bundles');
  process.exit(1);
}
