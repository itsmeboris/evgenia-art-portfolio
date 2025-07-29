const express = require('express');
const { Artwork, sequelize } = require('../../models');
const logger = require('../../js/modules/logger');
const { requireAdminAuth, optionalAdminAuth } = require('../../middleware/adminAuth');

const router = express.Router();

// Category descriptions mapping (from JSON structure)
const categoryDescriptions = {
  birds: 'Freedom and grace captured in acrylic',
  floral: "Vibrant expressions of nature's beauty",
  towns: 'Dreamlike urban landscapes',
  landscapes: 'Serene natural vistas',
  abstracts: 'Emotional expressions in color',
  portraits: 'Capturing human essence',
};

/**
 * Helper function to generate categories from artwork data
 */
async function generateCategories() {
  try {
    // Get category counts using direct query to avoid Sequelize grouping issues
    const categoryStats = await Artwork.findAll({
      attributes: ['category', [sequelize.fn('COUNT', sequelize.col('category')), 'artwork_count']],
      group: ['category'],
      raw: true,
    });

    // Get featured artwork for each category
    const featuredArtworks = await Artwork.findAll({
      where: { featured: true },
      attributes: ['id', 'title', 'image', 'category'],
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
      featured_artwork: featuredByCategory[stat.category]
        ? {
            id: featuredByCategory[stat.category].id,
            title: featuredByCategory[stat.category].title,
            image: featuredByCategory[stat.category].image,
          }
        : null,
    }));

    return categories;
  } catch (error) {
    logger.error('Error generating categories', {
      error: error.message,
      function: 'generateCategories',
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
      ETag: `"categories-${categories.length}"`,
      'Last-Modified': new Date().toUTCString(),
    });

    res.json({
      categories,
      total: categories.length,
      meta: {
        last_updated: new Date().toISOString(),
        api_version: '1.1',
      },
    });

    logger.info('Enhanced categories retrieved successfully', {
      categoriesCount: categories.length,
    });
  } catch (error) {
    logger.error('Error retrieving enhanced categories', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: 'Failed to retrieve categories',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/categories (Admin only)
 * Create or update a category description
 */
router.post('/', requireAdminAuth, async (req, res) => {
  try {
    const { id, name, description } = req.body;

    // Validate required fields
    if (!id || !name) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Category id and name are required',
      });
    }

    // Update category descriptions mapping
    categoryDescriptions[id] = description || `Beautiful ${name.toLowerCase()} collection`;

    // Generate updated categories to return
    const categories = await generateCategories();
    const updatedCategory = categories.find(cat => cat.id === id);

    if (updatedCategory) {
      res.status(200).json(updatedCategory);
    } else {
      // Category doesn't exist yet (no artworks), return a placeholder
      res.status(201).json({
        id,
        name,
        description: categoryDescriptions[id],
        image: `public/assets/images/categories/${id}.webp`,
        artwork_count: 0,
        featured_artwork: null,
      });
    }

    logger.info('Category created/updated successfully', {
      categoryId: id,
      name,
      description,
    });
  } catch (error) {
    logger.error('Error creating/updating category', {
      error: error.message,
      data: req.body,
    });
    res.status(500).json({
      error: 'Failed to create/update category',
      message: error.message,
    });
  }
});

/**
 * PUT /api/v1/categories/:id (Admin only)
 * Update a category description
 */
router.put('/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if category has artworks
    const artworkCount = await Artwork.count({
      where: { category: id },
    });

    if (artworkCount === 0) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'Category has no artworks and cannot be updated',
      });
    }

    // Update category description
    if (description !== undefined) {
      categoryDescriptions[id] = description;
    }

    // Return updated category
    const categories = await generateCategories();
    const updatedCategory = categories.find(cat => cat.id === id);

    res.json(updatedCategory);

    logger.info('Category updated successfully', {
      categoryId: id,
      changes: { name, description },
    });
  } catch (error) {
    logger.error('Error updating category', {
      error: error.message,
      categoryId: req.params.id,
      data: req.body,
    });
    res.status(500).json({
      error: 'Failed to update category',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/v1/categories/:id (Admin only)
 * Delete a category (only if no artworks use it)
 */
router.delete('/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has artworks
    const artworkCount = await Artwork.count({
      where: { category: id },
    });

    if (artworkCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete category',
        message: `Category has ${artworkCount} artworks. Move or delete artworks first.`,
        artworkCount,
      });
    }

    // Remove from category descriptions
    delete categoryDescriptions[id];

    res.status(204).send();

    logger.info('Category deleted successfully', {
      categoryId: id,
    });
  } catch (error) {
    logger.error('Error deleting category', {
      error: error.message,
      categoryId: req.params.id,
    });
    res.status(500).json({
      error: 'Failed to delete category',
      message: error.message,
    });
  }
});

module.exports = router;
