#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { Artwork, sequelize } = require('../models');
const logger = require('../js/modules/logger');

/**
 * Migrate artwork data from JSON file to database
 * This script will:
 * 1. Read existing artwork-data.json
 * 2. Transform data to match database schema
 * 3. Insert artworks into database
 * 4. Handle duplicates gracefully
 */
async function migrateArtworkData() {
  try {
    logger.info('Starting artwork data migration...');

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Read artwork data from JSON file
    const artworkDataPath = path.join(__dirname, '../../public/data/artwork-data.json');
    logger.info('Reading artwork data from:', { path: artworkDataPath });

    const rawData = await fs.readFile(artworkDataPath, 'utf8');
    const artworkData = JSON.parse(rawData);

    if (!artworkData.artworks || !Array.isArray(artworkData.artworks)) {
      throw new Error('Invalid artwork data format - expected "artworks" array');
    }

    logger.info('Found artworks to migrate:', { count: artworkData.artworks.length });

    // Transform and insert artworks
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const artwork of artworkData.artworks) {
      try {
        // Transform data to match database schema
        const artworkRecord = {
          id: artwork.id,
          title: artwork.title,
          category: artwork.category,
          subcategory: artwork.subcategory || '',
          dimensions: artwork.dimensions,
          medium: artwork.medium,
          price: parseFloat(artwork.price),
          description: artwork.description || '',
          image: artwork.image,
          featured: artwork.featured || false,
          availability: 'available', // Default availability
          year_created: artwork.year_created || null,
          view_count: 0, // Start with 0 views
          tags: artwork.tags || [], // Tags array for search
          metadata: {
            // Store any additional data from JSON
            original_data: artwork,
            migrated_at: new Date().toISOString(),
          },
        };

        // Use upsert to handle potential duplicates
        const [record, created] = await Artwork.upsert(artworkRecord, {
          returning: true,
        });

        if (created) {
          successCount++;
          logger.debug('Artwork migrated successfully:', { id: artwork.id });
        } else {
          skipCount++;
          logger.debug('Artwork already exists, updated:', { id: artwork.id });
        }
      } catch (error) {
        errorCount++;
        logger.error('Failed to migrate artwork:', {
          artworkId: artwork.id,
          error: error.message,
        });
      }
    }

    // Summary
    logger.info('Artwork migration completed:', {
      total: artworkData.artworks.length,
      successful: successCount,
      skipped: skipCount,
      errors: errorCount,
    });

    if (errorCount > 0) {
      logger.warn('Some artworks failed to migrate. Check logs for details.');
    }

    // Create backup of original file
    const backupPath = artworkDataPath + '.backup.' + Date.now();
    await fs.copyFile(artworkDataPath, backupPath);
    logger.info('Created backup of original file:', { backupPath });

    return {
      total: artworkData.artworks.length,
      successful: successCount,
      skipped: skipCount,
      errors: errorCount,
    };
  } catch (error) {
    logger.error('Artwork migration failed:', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    await sequelize.close();
    logger.info('Database connection closed');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateArtworkData()
    .then(result => {
      console.log('✅ Artwork migration completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Artwork migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { migrateArtworkData };
