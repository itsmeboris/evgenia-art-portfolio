const express = require('express');
const artworksRoutes = require('./artworks');
const cartRoutes = require('./cart');
const ordersRoutes = require('./orders');

const router = express.Router();

// Health check for API
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    api: 'v1',
    database: 'connected', // TODO: Add actual database health check
  });
});

// Mount route modules
router.use('/artworks', artworksRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', ordersRoutes);

module.exports = router;
