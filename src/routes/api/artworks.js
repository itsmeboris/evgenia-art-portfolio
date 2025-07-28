const express = require('express');
const { Op } = require('sequelize');
const { Artwork } = require('../../models');
const logger = require('../../js/modules/logger');

const router = express.Router();

/**
 * GET /api/artworks
 * Get all artworks with optional filtering and pagination
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

    res.json({
      artworks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });

    logger.info('Artworks retrieved successfully', {
      count: artworks.length,
      total,
      filters: { category, subcategory, featured, availability, search },
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
 * Get all available categories and subcategories
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

    res.json(grouped);

    logger.info('Categories retrieved successfully', {
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
