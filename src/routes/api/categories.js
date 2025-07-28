const express = require('express');
const { Artwork, sequelize } = require('../../models');
const logger = require('../../js/modules/logger');

const router = express.Router();

// Category descriptions mapping (from JSON structure)
const categoryDescriptions = {
  'birds': 'Freedom and grace captured in acrylic',
  'floral': 'Vibrant expressions of nature\'s beauty',
  'towns': 'Dreamlike urban landscapes',
  'landscapes': 'Serene natural vistas',
  'abstracts': 'Emotional expressions in color',
  'portraits': 'Capturing human essence'
};

/**
 * Helper function to generate categories from artwork data
 */
async function generateCategories() {
  try {
    // Get category counts using direct query to avoid Sequelize grouping issues
    const categoryStats = await Artwork.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('category')), 'artwork_count']
      ],
      group: ['category'],
      raw: true
    });

    // Get featured artwork for each category
    const featuredArtworks = await Artwork.findAll({
      where: { featured: true },
      attributes: ['id', 'title', 'image', 'category']
    });

    // Create featured artwork lookup
    const featuredByCategory = {};
    featuredArtworks.forEach(artwork => {
      if (!featuredByCategory[artwork.category]) {
        featuredByCategory[artwork.category] = artwork;
      }
    });

    // Build categories array
    const categories = categoryStats.map(stat => ({
      id: stat.category,
      name: stat.category.charAt(0).toUpperCase() + stat.category.slice(1),
      description: categoryDescriptions[stat.category] || `Beautiful ${stat.category} collection`,
      image: `public/assets/images/categories/${stat.category}.webp`,
      artwork_count: parseInt(stat.artwork_count),
      featured_artwork: featuredByCategory[stat.category] ? {
        id: featuredByCategory[stat.category].id,
        title: featuredByCategory[stat.category].title,
        image: featuredByCategory[stat.category].image
      } : null
    }));

    return categories;
  } catch (error) {
    logger.error('Error generating categories', {
      error: error.message,
      function: 'generateCategories'
    });
    return [];
  }
}

/**
 * GET /api/v1/categories
 * Enhanced categories endpoint with rich data
 */
router.get('/', async (req, res) => {
  try {
    const categories = await generateCategories();

    // Add cache headers for categories (changes infrequently)
    res.set({
      'Cache-Control': 'public, max-age=1800', // 30 minutes cache
      'ETag': `"categories-${categories.length}"`,
      'Last-Modified': new Date().toUTCString()
    });

    res.json({
      categories,
      total: categories.length,
      meta: {
        last_updated: new Date().toISOString(),
        api_version: '1.1'
      }
    });

    logger.info('Enhanced categories retrieved successfully', {
      categoriesCount: categories.length
    });

  } catch (error) {
    logger.error('Error retrieving enhanced categories', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Failed to retrieve categories',
      message: error.message
    });
  }
});

module.exports = router; 