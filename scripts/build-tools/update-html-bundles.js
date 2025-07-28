#!/usr/bin/env node

// Automated HTML Bundle Updater
// This script reads the webpack manifest and updates HTML files with correct bundle references

const fs = require('fs');
const path = require('path');

class HtmlBundleUpdater {
  constructor() {
    this.manifestPath = path.join(__dirname, '../../public/dist/manifest.json');
    this.htmlConfigs = [
      {
        file: 'index.html',
        bundles: ['common', 'core', 'lightbox', 'search', 'main'],
        comment: 'Webpack Bundles - Optimized and minified',
      },
      {
        file: 'gallery.html',
        bundles: ['common', 'core', 'lightbox', 'search', 'main'],
        comment: 'Webpack Bundles - Optimized and minified',
      },
      {
        file: 'about.html',
        bundles: ['common', 'core', 'lightbox', 'search', 'main'],
        comment: 'Webpack Bundles - Optimized and minified',
      },
      {
        file: 'contact.html',
        bundles: ['common', 'core', 'lightbox', 'search', 'main'],
        comment: 'Webpack Bundles - Optimized and minified',
      },
      {
        file: 'artwork.html',
        bundles: ['common', 'core', 'lightbox', 'search', 'artwork'],
        comment: 'Webpack Bundles - Artwork specific bundle',
      },
      {
        file: 'admin/index.html',
        bundles: ['admin'],
        comment: 'Admin Bundle',
      },
    ];
  }

  // Read webpack manifest file
  readManifest() {
    try {
      if (!fs.existsSync(this.manifestPath)) {
        throw new Error(
          `Manifest file not found at ${this.manifestPath}. Run webpack build first.`
        );
      }

      const manifestContent = fs.readFileSync(this.manifestPath, 'utf8');
      return JSON.parse(manifestContent);
    } catch (error) {
      console.error('❌ Error reading manifest:', error.message);
      process.exit(1);
    }
  }

  // Generate script tags for bundles
  generateScriptTags(bundles, manifest) {
    const scriptTags = [];

    bundles.forEach(bundleName => {
      // Look for the bundle in manifest (try different patterns)
      const bundleKey = Object.keys(manifest).find(
        key => key.includes(bundleName) && key.endsWith('.js')
      );

      if (bundleKey) {
        const bundlePath = manifest[bundleKey];
        scriptTags.push(`    <script src="${bundlePath}"></script>`);
      } else {
        console.warn(`⚠️  Bundle '${bundleName}' not found in manifest`);
      }
    });

    return scriptTags;
  }

  // Update HTML file with new bundle references
  updateHtmlFile(config, manifest) {
          const filePath = path.join(__dirname, '../..', config.file);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  HTML file not found: ${filePath}`);
      return false;
    }

    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const scriptTags = this.generateScriptTags(config.bundles, manifest);

      if (scriptTags.length === 0) {
        console.warn(`⚠️  No valid bundles found for ${config.file}`);
        return false;
      }

      // Create the new bundle section
      const newBundleSection = [`    <!-- ${config.comment} -->`, ...scriptTags].join('\n');

      // Remove ALL existing bundle script tags (more aggressive cleanup)
      // This pattern matches any webpack bundle comment followed by any number of bundle scripts
      content = content.replace(
        /\s*<!-- (?:Webpack Bundles|Admin Bundle)[^>]*-->\s*(?:<script src="\/public\/dist\/js\/[^"]+"><\/script>\s*)*/g,
        ''
      );

      // Also remove standalone bundle script tags that might be left over
      content = content.replace(/<script src="\/public\/dist\/js\/[^"]+"><\/script>\s*/g, '');

      // Inject the new bundle section before closing body tag
      const bodyEndPattern = /(\s*<\/body>)/;
      if (bodyEndPattern.test(content)) {
        const finalContent = content.replace(bodyEndPattern, `\n${newBundleSection}\n$1`);
        fs.writeFileSync(filePath, finalContent, 'utf8');
        console.log(`✅ Updated ${config.file} with bundles: ${config.bundles.join(', ')}`);
        return true;
      }

      console.warn(`⚠️  Could not update ${config.file} - no suitable injection point found`);
      return false;
    } catch (error) {
      console.error(`❌ Error updating ${config.file}:`, error.message);
      return false;
    }
  }

  // Main update process
  updateAllFiles() {
    console.log('🔄 Starting HTML bundle update process...\n');

    const manifest = this.readManifest();
    console.log('📦 Found bundles in manifest:');
    Object.entries(manifest).forEach(([key, path]) => {
      console.log(`   ${key} → ${path}`);
    });
    console.log();

    let successCount = 0;
    let totalFiles = this.htmlConfigs.length;

    this.htmlConfigs.forEach(config => {
      if (this.updateHtmlFile(config, manifest)) {
        successCount++;
      }
    });

    console.log(`\n📊 Update Summary:`);
    console.log(`   ✅ Successfully updated: ${successCount}/${totalFiles} files`);

    if (successCount === totalFiles) {
      console.log('🎉 All HTML files updated successfully!');
      return true;
    } else {
      console.log('⚠️  Some files could not be updated. Check warnings above.');
      return false;
    }
  }
}

// Run the updater if called directly
if (require.main === module) {
  const updater = new HtmlBundleUpdater();
  const success = updater.updateAllFiles();
  process.exit(success ? 0 : 1);
}

module.exports = HtmlBundleUpdater;
