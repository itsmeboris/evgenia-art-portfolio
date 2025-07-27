const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// WebP Converter - Convert all JPEG images to WebP with fallbacks
// Run this script to generate WebP versions of all artwork images

async function convertImagesToWebP() {
  const artworkDir = path.join(__dirname, '..', 'public', 'assets', 'images', 'artwork');

  console.log('🖼️  Starting WebP conversion...');
  console.log(`📁 Source directory: ${artworkDir}`);

  if (!fs.existsSync(artworkDir)) {
    console.error('❌ Artwork directory not found:', artworkDir);
    return;
  }

  const stats = {
    processed: 0,
    converted: 0,
    skipped: 0,
    errors: 0,
    totalSaved: 0,
  };

  // Process all subdirectories
  await processDirectory(artworkDir, stats);

  // Report results
  console.log('\n✅ WebP conversion complete!');
  console.log(`📊 Statistics:`);
  console.log(`   • Images processed: ${stats.processed}`);
  console.log(`   • WebP files created: ${stats.converted}`);
  console.log(`   • Files skipped: ${stats.skipped}`);
  console.log(`   • Errors: ${stats.errors}`);
  console.log(`   • Space saved: ${formatBytes(stats.totalSaved)}`);
}

async function processDirectory(dirPath, stats) {
  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const itemStat = fs.statSync(itemPath);

      if (itemStat.isDirectory()) {
        // Recursively process subdirectories
        await processDirectory(itemPath, stats);
      } else if (itemStat.isFile()) {
        await processImage(itemPath, stats);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing directory ${dirPath}:`, error.message);
    stats.errors++;
  }
}

async function processImage(imagePath, stats) {
  const extension = path.extname(imagePath).toLowerCase();

  // Only process JPEG and PNG files
  if (!['.jpg', '.jpeg', '.png'].includes(extension)) {
    return;
  }

  stats.processed++;

  const webpPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

  // Skip if WebP version already exists
  if (fs.existsSync(webpPath)) {
    console.log(`⏭️  Skipping ${path.basename(imagePath)} (WebP exists)`);
    stats.skipped++;
    return;
  }

  try {
    console.log(`🔄 Converting ${path.basename(imagePath)}...`);

    // Get original file size
    const originalSize = fs.statSync(imagePath).size;

    // Convert to WebP
    await sharp(imagePath)
      .webp({
        quality: 85, // Good balance of quality vs size
        effort: 6, // Higher effort for better compression
        lossless: false, // Use lossy compression for smaller files
      })
      .toFile(webpPath);

    // Get new file size
    const webpSize = fs.statSync(webpPath).size;
    const saved = originalSize - webpSize;
    const percentage = ((saved / originalSize) * 100).toFixed(1);

    console.log(
      `✅ ${path.basename(imagePath)} → ${path.basename(webpPath)} (${percentage}% smaller)`
    );

    stats.converted++;
    stats.totalSaved += saved;
  } catch (error) {
    console.error(`❌ Error converting ${path.basename(imagePath)}:`, error.message);
    stats.errors++;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the conversion
if (require.main === module) {
  convertImagesToWebP().catch(console.error);
}

module.exports = { convertImagesToWebP };
