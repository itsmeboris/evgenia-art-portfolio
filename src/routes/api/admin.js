const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Artwork, sequelize } = require('../../models');
const logger = require('../../js/modules/logger');
const { requireAdminAuth } = require('../../middleware/adminAuth');

const router = express.Router();

/**
 * GET /api/v1/admin/session
 * Check admin session status
 */
router.get('/session', (req, res) => {
  if (req.session && req.session.user && req.session.user.authenticated) {
    res.json({
      authenticated: true,
      user: {
        username: req.session.user.username,
        loginTime: req.session.user.loginTime,
      },
      sessionId: req.sessionID,
    });
  } else {
    res.status(401).json({
      authenticated: false,
      error: 'No valid admin session',
      session: req.session
        ? {
            exists: true,
            hasUser: !!req.session.user,
            userAuthenticated: req.session.user ? req.session.user.authenticated : false,
          }
        : { exists: false },
    });
  }
});

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const category = req.body.category || 'misc';
    const uploadPath = path.join('public', 'assets', 'images', 'artwork', category);

    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      logger.error('Error creating upload directory', {
        error: error.message,
        uploadPath,
      });
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * POST /api/v1/admin/upload (Admin only)
 * Upload images for artworks
 */
router.post('/upload', requireAdminAuth, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select at least one image file',
      });
    }

    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      relativePath: path.relative('public', file.path),
      size: file.size,
      mimetype: file.mimetype,
    }));

    res.json({
      message: 'Images uploaded successfully',
      files: uploadedFiles,
      count: uploadedFiles.length,
    });

    logger.info('Images uploaded successfully', {
      fileCount: uploadedFiles.length,
      files: uploadedFiles.map(f => f.filename),
    });
  } catch (error) {
    logger.error('Error uploading images', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: 'Failed to upload images',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/admin/artworks/batch (Admin only)
 * Create or update multiple artworks in batch (upsert)
 */
router.post('/artworks/batch', requireAdminAuth, async (req, res) => {
  try {
    const { artworks } = req.body;

    if (!Array.isArray(artworks) || artworks.length === 0) {
      return res.status(400).json({
        error: 'Invalid batch data',
        message: 'Please provide an array of artworks',
      });
    }

    // Validate each artwork
    const errors = [];
    artworks.forEach((artwork, index) => {
      if (!artwork.title || !artwork.category) {
        errors.push(`Artwork ${index + 1}: title and category are required`);
      }
      if (!artwork.id) {
        // Generate ID if not provided
        artwork.id = artwork.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-');
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Some artworks have validation errors',
        errors,
      });
    }

    // Process artworks in transaction (upsert - update or create)
    const transaction = await sequelize.transaction();
    try {
      const processedArtworks = [];

      for (const artwork of artworks) {
        const [instance, created] = await Artwork.upsert(artwork, {
          transaction,
          returning: true,
        });

        processedArtworks.push({
          ...instance.toJSON(),
          _operation: created ? 'created' : 'updated',
        });
      }

      await transaction.commit();

      const createdCount = processedArtworks.filter(a => a._operation === 'created').length;
      const updatedCount = processedArtworks.filter(a => a._operation === 'updated').length;

      res.json({
        message: `Artworks processed successfully: ${createdCount} created, ${updatedCount} updated`,
        artworks: processedArtworks,
        count: processedArtworks.length,
        operations: { created: createdCount, updated: updatedCount },
      });

      logger.info('Batch artworks processed successfully', {
        count: processedArtworks.length,
        created: createdCount,
        updated: updatedCount,
        artworkIds: processedArtworks.map(a => a.id),
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    logger.error('Error processing batch artworks', {
      error: error.message,
      data: req.body,
    });
    res.status(500).json({
      error: 'Failed to process artworks',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/admin/stats (Admin only)
 * Get admin dashboard statistics
 */
router.get('/stats', requireAdminAuth, async (req, res) => {
  try {
    // Get artwork statistics
    const totalArtworks = await Artwork.count();
    const featuredArtworks = await Artwork.count({ where: { featured: true } });

    // Get category statistics
    const categoryStats = await Artwork.findAll({
      attributes: ['category', [sequelize.fn('COUNT', sequelize.col('category')), 'count']],
      group: ['category'],
      raw: true,
    });

    // Get recent artworks
    const recentArtworks = await Artwork.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'title', 'category', 'createdAt'],
    });

    const stats = {
      artworks: {
        total: totalArtworks,
        featured: featuredArtworks,
        byCategory: categoryStats.reduce((acc, stat) => {
          acc[stat.category] = parseInt(stat.count);
          return acc;
        }, {}),
      },
      categories: {
        total: categoryStats.length,
        list: categoryStats.map(stat => ({
          id: stat.category,
          name: stat.category.charAt(0).toUpperCase() + stat.category.slice(1),
          count: parseInt(stat.count),
        })),
      },
      recent: recentArtworks,
      lastUpdated: new Date().toISOString(),
    };

    res.json(stats);

    logger.info('Admin stats retrieved successfully', {
      totalArtworks,
      categoriesCount: categoryStats.length,
    });
  } catch (error) {
    logger.error('Error retrieving admin stats', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/admin/export (Admin only)
 * Export all data as JSON
 */
router.post('/export', requireAdminAuth, async (req, res) => {
  try {
    // Get all artworks
    const artworks = await Artwork.findAll({
      order: [
        ['category', 'ASC'],
        ['title', 'ASC'],
      ],
    });

    // Get categories
    const categoryStats = await Artwork.findAll({
      attributes: ['category', [sequelize.fn('COUNT', sequelize.col('category')), 'count']],
      group: ['category'],
      raw: true,
    });

    const categories = categoryStats.map(stat => ({
      id: stat.category,
      name: stat.category.charAt(0).toUpperCase() + stat.category.slice(1),
      description: `Beautiful ${stat.category} collection`,
      artwork_count: parseInt(stat.count),
    }));

    const exportData = {
      artworks: artworks.map(artwork => artwork.toJSON()),
      categories,
      settings: {
        currency: '₪',
        imagePath: 'public/assets/images/artwork/',
      },
      meta: {
        exportDate: new Date().toISOString(),
        version: '2.0',
        totalArtworks: artworks.length,
        totalCategories: categories.length,
      },
    };

    res.json(exportData);

    logger.info('Data exported successfully', {
      artworkCount: artworks.length,
      categoryCount: categories.length,
    });
  } catch (error) {
    logger.error('Error exporting data', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: 'Failed to export data',
      message: error.message,
    });
  }
});

module.exports = router;
