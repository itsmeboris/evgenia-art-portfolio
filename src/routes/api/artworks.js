const express = require('express');
const { Op } = require('sequelize');
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

// Application settings (matching JSON structure)
const applicationSettings = {
  currency: '₪',
  imagePath: 'public/assets/images/artwork/'
};

/**
 * Helper function to generate categories from artwork data
 */
async function generateCategories() {
  try {
    // Get category counts using proper Sequelize syntax
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
 * GET /api/v1/artworks/all
 * Unified endpoint providing all data for frontend initialization
 */
router.get('/all', async (req, res) => {
  try {
    const startTime = Date.now();

    // Get all artworks
    const artworks = await Artwork.findAll({
      order: [['createdAt', 'DESC']],
      attributes: {
        exclude: ['metadata'] // Exclude metadata for frontend compatibility
      }
    });

    // Generate categories from artwork data
    const categories = await generateCategories();

    // Build response structure matching JSON format
    const response = {
      artworks,
      categories,
      settings: applicationSettings,
      meta: {
        total_artworks: artworks.length,
        total_categories: categories.length,
        last_updated: new Date().toISOString(),
        api_version: '1.1',
        response_time_ms: Date.now() - startTime
      }
    };

    // Add cache headers for performance
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes cache
      'ETag': `"artworks-all-${artworks.length}-${Date.now()}"`,
      'Last-Modified': new Date().toUTCString()
    });

    res.json(response);

    logger.info('All artworks retrieved successfully', {
      count: artworks.length,
      categories: categories.length,
      response_time_ms: Date.now() - startTime
    });

  } catch (error) {
    logger.error('Error retrieving all artworks', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Failed to retrieve artworks',
      message: error.message
    });
  }
});

/**
 * GET /api/artworks
 * Get all artworks with optional filtering and pagination
 * Enhanced with optional includes
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      subcategory,
      featured,
      availability = 'available',
      sort = 'createdAt',
      order = 'DESC',
      search,
      include_categories,
      include_settings
    } = req.query;

    // Build where clause
    const where = {};

    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;
    if (featured !== undefined) where.featured = featured === 'true';
    if (availability) where.availability = availability;

    // Search functionality
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { tags: { [Op.contains]: [search] } },
      ];
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: artworks, count: total } = await Artwork.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[sort, order.toUpperCase()]],
      attributes: {
        exclude: ['metadata'], // Don't include metadata in list view
      },
    });

    // Build base response
    const response = {
      artworks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };

    // Add optional includes
    if (include_categories === 'true') {
      response.categories = await generateCategories();
    }

    if (include_settings === 'true') {
      response.settings = applicationSettings;
    }

    // Add cache headers
    res.set({
      'Cache-Control': 'public, max-age=60', // 1 minute cache for paginated results
      'ETag': `"artworks-${page}-${limit}-${total}"`,
    });

    res.json(response);

    logger.info('Artworks retrieved successfully', {
      count: artworks.length,
      total,
      filters: { category, subcategory, featured, availability, search },
      includes: { categories: !!include_categories, settings: !!include_settings }
    });
  } catch (error) {
    logger.error('Error retrieving artworks', {
      error: error.message,
      query: req.query,
    });
    res.status(500).json({
      error: 'Failed to retrieve artworks',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/artworks/search
 * Enhanced search endpoint with highlighting and suggestions
 */
router.get('/search', async (req, res) => {
  try {
    const {
      q: query,
      category,
      featured,
      page = 1,
      limit = 20,
      highlight = false,
      suggestions = false
    } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'Search query is required',
        message: 'Please provide a search query using the "q" parameter'
      });
    }

    const startTime = Date.now();

    // Build where clause for search
    const where = {
      [Op.or]: [
        { title: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } },
        { tags: { [Op.contains]: [query] } },
        { medium: { [Op.iLike]: `%${query}%` } }
      ]
    };

    // Add additional filters
    if (category) where.category = category;
    if (featured !== undefined) where.featured = featured === 'true';

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: artworks, count: total } = await Artwork.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      attributes: {
        exclude: ['metadata']
      }
    });

    // Build response
    const response = {
      artworks,
      query,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      performance: {
        response_time_ms: Date.now() - startTime,
        query_analyzed: true
      }
    };

    // Add highlighting if requested
    if (highlight === 'true') {
      response.highlights = artworks.reduce((acc, artwork) => {
        const highlights = [];
        if (artwork.title.toLowerCase().includes(query.toLowerCase())) {
          highlights.push('title');
        }
        if (artwork.description.toLowerCase().includes(query.toLowerCase())) {
          highlights.push('description');
        }
        if (artwork.medium.toLowerCase().includes(query.toLowerCase())) {
          highlights.push('medium');
        }
        if (highlights.length > 0) {
          acc[artwork.id] = highlights;
        }
        return acc;
      }, {});
    }

    // Add suggestions if requested
    if (suggestions === 'true') {
      // Get related categories
      const categories = [...new Set(artworks.map(a => a.category))];
      response.suggestions = {
        categories,
        related_terms: [] // Could be enhanced with more sophisticated suggestion logic
      };
    }

    // Add category filters
    if (artworks.length > 0) {
      const categoryStats = artworks.reduce((acc, artwork) => {
        acc[artwork.category] = (acc[artwork.category] || 0) + 1;
        return acc;
      }, {});

      response.filters = {
        categories: Object.keys(categoryStats),
        total_by_category: categoryStats
      };
    }

    // Add cache headers for search results
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes cache
      'ETag': `"search-${query}-${total}-${page}"`
    });

    res.json(response);

    logger.info('Search completed successfully', {
      query,
      total_results: total,
      page,
      response_time_ms: Date.now() - startTime,
      filters: { category, featured }
    });

  } catch (error) {
    logger.error('Error performing search', {
      error: error.message,
      query: req.query
    });
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

/**
 * GET /api/artworks/:id
 * Get a specific artwork by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const artwork = await Artwork.findByPk(id);

    if (!artwork) {
      return res.status(404).json({
        error: 'Artwork not found',
        id,
      });
    }

    // Increment view count
    await artwork.increment('view_count');

    res.json(artwork);

    logger.info('Artwork retrieved successfully', {
      artworkId: id,
      title: artwork.title,
    });
  } catch (error) {
    logger.error('Error retrieving artwork', {
      error: error.message,
      artworkId: req.params.id,
    });
    res.status(500).json({
      error: 'Failed to retrieve artwork',
      message: error.message,
    });
  }
});

/**
 * GET /api/artworks/categories/list
 * Get all available categories and subcategories (legacy endpoint)
 */
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Artwork.findAll({
      attributes: ['category', 'subcategory'],
      group: ['category', 'subcategory'],
      raw: true,
    });

    // Group by category
    const grouped = categories.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      if (item.subcategory && !acc[item.category].includes(item.subcategory)) {
        acc[item.category].push(item.subcategory);
      }
      return acc;
    }, {});

    // Add basic cache headers
    res.set({
      'Cache-Control': 'public, max-age=1800', // 30 minutes cache
    });

    res.json(grouped);

    logger.info('Legacy categories retrieved successfully', {
      categoriesCount: Object.keys(grouped).length,
    });
  } catch (error) {
    logger.error('Error retrieving categories', {
      error: error.message,
    });
    res.status(500).json({
      error: 'Failed to retrieve categories',
      message: error.message,
    });
  }
});


/**
 * POST /api/artworks (Admin only)
 * Create a new artwork
 */
router.post('/', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    const artworkData = req.body;

    const artwork = await Artwork.create(artworkData);

    res.status(201).json(artwork);

    logger.info('Artwork created successfully', {
      artworkId: artwork.id,
      title: artwork.title,
    });
  } catch (error) {
    logger.error('Error creating artwork', {
      error: error.message,
      data: req.body,
    });
    res.status(500).json({
      error: 'Failed to create artwork',
      message: error.message,
    });
  }
});

/**
 * PUT /api/artworks/:id (Admin only)
 * Update an existing artwork
 */
router.put('/:id', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    const { id } = req.params;
    const updateData = req.body;

    const [updated] = await Artwork.update(updateData, {
      where: { id },
      returning: true,
    });

    if (updated === 0) {
      return res.status(404).json({
        error: 'Artwork not found',
        id,
      });
    }

    const artwork = await Artwork.findByPk(id);
    res.json(artwork);

    logger.info('Artwork updated successfully', {
      artworkId: id,
      fields: Object.keys(updateData),
    });
  } catch (error) {
    logger.error('Error updating artwork', {
      error: error.message,
      artworkId: req.params.id,
      data: req.body,
    });
    res.status(500).json({
      error: 'Failed to update artwork',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/artworks/:id (Admin only)
 * Delete an artwork
 */
router.delete('/:id', async (req, res) => {
  try {
    // TODO: Add admin authentication middleware
    const { id } = req.params;

    const deleted = await Artwork.destroy({
      where: { id },
    });

    if (deleted === 0) {
      return res.status(404).json({
        error: 'Artwork not found',
        id,
      });
    }

    res.status(204).send();

    logger.info('Artwork deleted successfully', {
      artworkId: id,
    });
  } catch (error) {
    logger.error('Error deleting artwork', {
      error: error.message,
      artworkId: req.params.id,
    });
    res.status(500).json({
      error: 'Failed to delete artwork',
      message: error.message,
    });
  }
});

module.exports = router;
