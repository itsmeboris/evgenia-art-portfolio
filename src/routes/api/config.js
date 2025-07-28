const express = require('express');
const logger = require('../../js/modules/logger');

const router = express.Router();

/**
 * GET /api/v1/config
 * Application-wide configuration and settings
 */
router.get('/', async (req, res) => {
  try {
    const config = {
      currency: '₪',
      imagePath: 'public/assets/images/artwork/',
      pagination: {
        default_limit: 20,
        max_limit: 100
      },
      features: {
        search_enabled: true,
        cart_enabled: true,
        admin_enabled: true,
        enhanced_api: true
      },
      cache: {
        ttl: 3600, // 1 hour
        version: '1.0'
      },
      api: {
        version: '1.1',
        endpoints: {
          artworks: '/api/v1/artworks',
          artworks_all: '/api/v1/artworks/all',
          categories: '/api/v1/categories',
          config: '/api/v1/config'
        }
      },
      meta: {
        last_updated: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    };

    // Set aggressive caching for config (rarely changes)
    res.set({
      'Cache-Control': 'public, max-age=86400', // 24 hours cache
      'ETag': `"config-v1.1-${Date.now()}"`,
      'Last-Modified': new Date().toUTCString()
    });

    res.json(config);

    logger.info('Configuration retrieved successfully', {
      environment: config.meta.environment,
      api_version: config.api.version
    });

  } catch (error) {
    logger.error('Error retrieving configuration', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Failed to retrieve configuration',
      message: error.message
    });
  }
});

module.exports = router; 