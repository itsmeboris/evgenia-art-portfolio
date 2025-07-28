const express = require('express');
const artworksRoutes = require('./artworks');
const cartRoutes = require('./cart');
const ordersRoutes = require('./orders');
const configRoutes = require('./config');
const categoriesRoutes = require('./categories');

const router = express.Router();

// Health check for API
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    api: 'v1',
    version: '1.1',
    database: 'connected', // TODO: Add actual database health check
  });
});

// Mount route modules
router.use('/artworks', artworksRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', ordersRoutes);
router.use('/config', configRoutes);
router.use('/categories', categoriesRoutes);

module.exports = router;
