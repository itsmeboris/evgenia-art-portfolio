/**
 * API Routes
 * RESTful API endpoints for artwork and category management
 */

const express = require('express');
const router = express.Router();
const Artwork = require('../database/models/Artwork');
const Category = require('../database/models/Category');
const { pool, redisClient } = require('../database/config');

// Redis caching utility functions
const cache = {
  async get(key) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('Redis GET error:', error.message);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.warn('Redis SET error:', error.message);
    }
  },

  async del(key) {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.warn('Redis DEL error:', error.message);
    }
  },

  async invalidatePattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.warn('Redis pattern invalidation error:', error.message);
    }
  }
};

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

    // Create cache key based on filters and pagination
    const cacheKey = `artworks:${JSON.stringify(filters)}`;
    
    // Try to get from Redis cache first
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      console.log(`✅ Cache HIT for artworks: ${cacheKey.substring(0, 50)}...`);
      return res.apiSuccess(cachedResult, 'Artworks fetched successfully (cached)');
    }

    console.log(`⚡ Cache MISS for artworks: ${cacheKey.substring(0, 50)}...`);
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

    // Cache the response for 10 minutes (600 seconds)
    await cache.set(cacheKey, response, 600);
    console.log(`💾 Cached artworks result: ${cacheKey.substring(0, 50)}...`);

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
    
    // Invalidate artwork caches when new artwork is created
    await cache.invalidatePattern('artworks:*');
    await cache.del('categories:all');
    console.log('🗑️  Cache invalidated after artwork creation');
    
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

    // Invalidate artwork caches when artwork is updated
    await cache.invalidatePattern('artworks:*');
    await cache.del('categories:all');
    console.log('🗑️  Cache invalidated after artwork update');

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
    const cacheKey = 'categories:all';
    
    // Try Redis cache first
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      console.log('✅ Cache HIT for categories');
      return res.apiSuccess(cachedResult, 'Categories fetched successfully (cached)');
    }

    console.log('⚡ Cache MISS for categories');
    const categories = await Category.getAll();
    const response = categories.map(category => category.toJSON());
    
    // Cache for 30 minutes (1800 seconds)
    await cache.set(cacheKey, response, 1800);
    console.log('💾 Cached categories result');
    
    res.apiSuccess(response, 'Categories fetched successfully');
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

    // Test Redis connection
    let redisStatus = 'disconnected';
    try {
      await redisClient.ping();
      redisStatus = 'connected';
    } catch (redisError) {
      console.warn('Redis health check failed:', redisError.message);
    }

    const healthData = {
      status: 'healthy',
      database: 'connected',
      redis: redisStatus,
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

/**
 * GET /api/v1/cache/stats
 * Redis cache statistics and monitoring
 */
router.get('/cache/stats', async (req, res) => {
  try {
    let cacheStats = {
      status: 'disconnected',
      keys: 0,
      memory: 'unknown',
      hits: 'unknown',
      misses: 'unknown'
    };

    try {
      // Get Redis info
      const info = await redisClient.info();
      const keys = await redisClient.keys('*');
      
      // Parse Redis info for useful stats
      const infoLines = info.split('\r\n');
      const stats = {};
      infoLines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key] = value;
        }
      });

      cacheStats = {
        status: 'connected',
        keys: keys.length,
        keysList: keys.slice(0, 20), // Show first 20 keys
        memory: stats.used_memory_human || 'unknown',
        hits: stats.keyspace_hits || 'unknown',
        misses: stats.keyspace_misses || 'unknown',
        totalConnections: stats.total_connections_received || 'unknown',
        connectedClients: stats.connected_clients || 'unknown',
        uptime: stats.uptime_in_seconds || 'unknown'
      };
    } catch (redisError) {
      console.warn('Redis stats error:', redisError.message);
    }

    res.apiSuccess(cacheStats, 'Cache statistics retrieved');
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.apiError('Failed to get cache statistics', 500, error.message);
  }
});

/**
 * DELETE /api/v1/cache/clear
 * Clear all Redis cache
 */
router.delete('/cache/clear', async (req, res) => {
  try {
    await redisClient.flushAll();
    console.log('🗑️  All Redis cache cleared manually');
    res.apiSuccess({ cleared: true }, 'Cache cleared successfully');
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.apiError('Failed to clear cache', 500, error.message);
  }
});

module.exports = router;
