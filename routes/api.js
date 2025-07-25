/**
 * API Routes
 * RESTful API endpoints for artwork and category management
 */

const express = require('express');
const router = express.Router();
const Artwork = require('../database/models/Artwork');
const Category = require('../database/models/Category');
const { pool } = require('../database/config');

// Middleware for API response formatting
const apiResponse = (req, res, next) => {
  res.apiSuccess = (data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  };

  res.apiError = (message = 'Error', statusCode = 500, errors = null) => {
    res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  };

  next();
};

// Apply API response middleware
router.use(apiResponse);

// Middleware for pagination
const pagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  req.pagination = {
    page,
    limit,
    offset,
  };

  next();
};

// =============================================================================
// ARTWORK ENDPOINTS
// =============================================================================

/**
 * GET /api/v1/artworks
 * Get all artworks with filtering and pagination
 */
router.get('/artworks', pagination, async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      featured:
        req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
      available:
        req.query.available === 'true' ? true : req.query.available === 'false' ? false : undefined,
      search: req.query.search,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'DESC',
      limit: req.pagination.limit,
      offset: req.pagination.offset,
    };

    const artworks = await Artwork.getAll(filters);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM artworks a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE 1=1
      ${filters.category ? `AND c.name = '${filters.category}'` : ''}
      ${filters.featured !== undefined ? `AND a.featured = ${filters.featured}` : ''}
      ${filters.available !== undefined ? `AND a.available = ${filters.available}` : ''}
      ${filters.search ? `AND (a.title ILIKE '%${filters.search}%' OR a.description ILIKE '%${filters.search}%')` : ''}
    `;

    const countResult = await pool.query(countQuery);
    const totalCount = parseInt(countResult.rows[0].total);

    const response = {
      artworks: artworks.map(artwork => artwork.toJSON()),
      pagination: {
        page: req.pagination.page,
        limit: req.pagination.limit,
        total: totalCount,
        pages: Math.ceil(totalCount / req.pagination.limit),
        hasNext: req.pagination.page < Math.ceil(totalCount / req.pagination.limit),
        hasPrev: req.pagination.page > 1,
      },
    };

    res.apiSuccess(response, 'Artworks fetched successfully');
  } catch (error) {
    console.error('Error fetching artworks:', error);
    res.apiError('Failed to fetch artworks', 500, error.message);
  }
});

/**
 * GET /api/v1/artworks/featured
 * Get featured artworks
 */
router.get('/artworks/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const artworks = await Artwork.getFeatured(limit);

    res.apiSuccess(
      artworks.map(artwork => artwork.toJSON()),
      'Featured artworks fetched successfully'
    );
  } catch (error) {
    console.error('Error fetching featured artworks:', error);
    res.apiError('Failed to fetch featured artworks', 500, error.message);
  }
});

/**
 * GET /api/v1/artworks/search
 * Search artworks with full-text search
 */
router.get('/artworks/search', async (req, res) => {
  try {
    const searchTerm = req.query.q;
    if (!searchTerm) {
      return res.apiError('Search term is required', 400);
    }

    const limit = parseInt(req.query.limit) || 20;
    const artworks = await Artwork.search(searchTerm, { limit });

    res.apiSuccess(
      artworks.map(artwork => artwork.toJSON()),
      `Search results for "${searchTerm}"`
    );
  } catch (error) {
    console.error('Error searching artworks:', error);
    res.apiError('Failed to search artworks', 500, error.message);
  }
});

/**
 * GET /api/v1/artworks/stats
 * Get artwork statistics
 */
router.get('/artworks/stats', async (req, res) => {
  try {
    const stats = await Artwork.getStats();
    res.apiSuccess(stats, 'Artwork statistics fetched successfully');
  } catch (error) {
    console.error('Error fetching artwork statistics:', error);
    res.apiError('Failed to fetch artwork statistics', 500, error.message);
  }
});

/**
 * GET /api/v1/artworks/:id
 * Get single artwork by ID
 */
router.get('/artworks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const artwork = await Artwork.getById(id);

    if (!artwork) {
      return res.apiError('Artwork not found', 404);
    }

    // Increment view count
    await Artwork.incrementViews(id);

    res.apiSuccess(artwork.toJSON(), 'Artwork fetched successfully');
  } catch (error) {
    console.error('Error fetching artwork:', error);
    res.apiError('Failed to fetch artwork', 500, error.message);
  }
});

/**
 * GET /api/v1/artworks/slug/:slug
 * Get single artwork by slug
 */
router.get('/artworks/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const artwork = await Artwork.getBySlug(slug);

    if (!artwork) {
      return res.apiError('Artwork not found', 404);
    }

    // Increment view count
    await Artwork.incrementViews(artwork.id);

    res.apiSuccess(artwork.toJSON(), 'Artwork fetched successfully');
  } catch (error) {
    console.error('Error fetching artwork:', error);
    res.apiError('Failed to fetch artwork', 500, error.message);
  }
});

/**
 * POST /api/v1/artworks
 * Create new artwork (admin only)
 */
router.post('/artworks', async (req, res) => {
  try {
    const artworkData = req.body;

    // Generate slug if not provided
    if (!artworkData.slug && artworkData.title) {
      artworkData.slug = Artwork.generateSlug(artworkData.title);
    }

    const artwork = await Artwork.create(artworkData);
    res.apiSuccess(artwork.toJSON(), 'Artwork created successfully', 201);
  } catch (error) {
    console.error('Error creating artwork:', error);
    res.apiError('Failed to create artwork', 500, error.message);
  }
});

/**
 * PUT /api/v1/artworks/:id
 * Update artwork (admin only)
 */
router.put('/artworks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const artworkData = req.body;

    const artwork = await Artwork.update(id, artworkData);

    if (!artwork) {
      return res.apiError('Artwork not found', 404);
    }

    res.apiSuccess(artwork.toJSON(), 'Artwork updated successfully');
  } catch (error) {
    console.error('Error updating artwork:', error);
    res.apiError('Failed to update artwork', 500, error.message);
  }
});

/**
 * DELETE /api/v1/artworks/:id
 * Delete artwork (admin only)
 */
router.delete('/artworks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const artwork = await Artwork.delete(id);

    if (!artwork) {
      return res.apiError('Artwork not found', 404);
    }

    res.apiSuccess(artwork.toJSON(), 'Artwork deleted successfully');
  } catch (error) {
    console.error('Error deleting artwork:', error);
    res.apiError('Failed to delete artwork', 500, error.message);
  }
});

// =============================================================================
// CATEGORY ENDPOINTS
// =============================================================================

/**
 * GET /api/v1/categories
 * Get all categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.getAll();
    res.apiSuccess(
      categories.map(category => category.toJSON()),
      'Categories fetched successfully'
    );
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.apiError('Failed to fetch categories', 500, error.message);
  }
});

/**
 * GET /api/v1/categories/with-counts
 * Get categories with artwork counts
 */
router.get('/categories/with-counts', async (req, res) => {
  try {
    const categories = await Category.getCategoriesWithArtworkCounts();
    res.apiSuccess(
      categories.map(category => category.toJSON()),
      'Categories with counts fetched successfully'
    );
  } catch (error) {
    console.error('Error fetching categories with counts:', error);
    res.apiError('Failed to fetch categories with counts', 500, error.message);
  }
});

/**
 * GET /api/v1/categories/:id
 * Get single category by ID
 */
router.get('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.getById(id);

    if (!category) {
      return res.apiError('Category not found', 404);
    }

    res.apiSuccess(category.toJSON(), 'Category fetched successfully');
  } catch (error) {
    console.error('Error fetching category:', error);
    res.apiError('Failed to fetch category', 500, error.message);
  }
});

/**
 * GET /api/v1/categories/name/:name
 * Get single category by name
 */
router.get('/categories/name/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const category = await Category.getByName(name);

    if (!category) {
      return res.apiError('Category not found', 404);
    }

    res.apiSuccess(category.toJSON(), 'Category fetched successfully');
  } catch (error) {
    console.error('Error fetching category:', error);
    res.apiError('Failed to fetch category', 500, error.message);
  }
});

/**
 * POST /api/v1/categories
 * Create new category (admin only)
 */
router.post('/categories', async (req, res) => {
  try {
    const categoryData = req.body;
    const category = await Category.create(categoryData);
    res.apiSuccess(category.toJSON(), 'Category created successfully', 201);
  } catch (error) {
    console.error('Error creating category:', error);
    res.apiError('Failed to create category', 500, error.message);
  }
});

/**
 * PUT /api/v1/categories/:id
 * Update category (admin only)
 */
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const categoryData = req.body;

    const category = await Category.update(id, categoryData);

    if (!category) {
      return res.apiError('Category not found', 404);
    }

    res.apiSuccess(category.toJSON(), 'Category updated successfully');
  } catch (error) {
    console.error('Error updating category:', error);
    res.apiError('Failed to update category', 500, error.message);
  }
});

/**
 * DELETE /api/v1/categories/:id
 * Delete category (admin only)
 */
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.delete(id);

    if (!category) {
      return res.apiError('Category not found', 404);
    }

    res.apiSuccess(category.toJSON(), 'Category deleted successfully');
  } catch (error) {
    console.error('Error deleting category:', error);
    res.apiError('Failed to delete category', 500, error.message);
  }
});

// =============================================================================
// ANALYTICS ENDPOINTS
// =============================================================================

/**
 * POST /api/v1/analytics/track
 * Track artwork view or interaction
 */
router.post('/analytics/track', async (req, res) => {
  try {
    const { artwork_id, event_type, user_session } = req.body;

    if (!artwork_id || !event_type) {
      return res.apiError('artwork_id and event_type are required', 400);
    }

    const query = `
      INSERT INTO artwork_analytics (artwork_id, event_type, user_session, ip_address, user_agent, referrer)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const params = [
      artwork_id,
      event_type,
      user_session,
      req.ip,
      req.get('User-Agent'),
      req.get('Referrer'),
    ];

    const result = await pool.query(query, params);

    res.apiSuccess(result.rows[0], 'Analytics event tracked successfully');
  } catch (error) {
    console.error('Error tracking analytics:', error);
    res.apiError('Failed to track analytics', 500, error.message);
  }
});

/**
 * GET /api/v1/analytics/popular
 * Get most popular artworks
 */
router.get('/analytics/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 30;

    const query = `
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.image_path,
        COUNT(aa.id) as view_count,
        a.views_count as total_views
      FROM artworks a
      LEFT JOIN artwork_analytics aa ON a.id = aa.artwork_id 
        AND aa.event_type = 'view'
        AND aa.created_at >= NOW() - INTERVAL '${days} days'
      WHERE a.available = true
      GROUP BY a.id, a.title, a.slug, a.image_path, a.views_count
      ORDER BY view_count DESC, total_views DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    res.apiSuccess(result.rows, 'Popular artworks fetched successfully');
  } catch (error) {
    console.error('Error fetching popular artworks:', error);
    res.apiError('Failed to fetch popular artworks', 500, error.message);
  }
});

// =============================================================================
// HEALTH CHECK ENDPOINT
// =============================================================================

/**
 * GET /api/v1/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const dbResult = await pool.query('SELECT NOW()');

    // Get basic stats
    const artworkCount = await pool.query('SELECT COUNT(*) FROM artworks');
    const categoryCount = await pool.query('SELECT COUNT(*) FROM categories');

    const healthData = {
      status: 'healthy',
      database: 'connected',
      timestamp: dbResult.rows[0].now,
      counts: {
        artworks: parseInt(artworkCount.rows[0].count),
        categories: parseInt(categoryCount.rows[0].count),
      },
    };

    res.apiSuccess(healthData, 'API is healthy');
  } catch (error) {
    console.error('Health check failed:', error);
    res.apiError('API is unhealthy', 500, error.message);
  }
});

module.exports = router;
