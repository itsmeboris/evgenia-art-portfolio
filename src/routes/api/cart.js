const express = require('express');
const { Cart, CartItem, Artwork } = require('../../models');
const logger = require('../../js/modules/logger');

const router = express.Router();

/**
 * Helper function to get or create cart for user/session
 */
async function getOrCreateCart(userId, sessionId) {
  let cart = await Cart.findOne({
    where: userId ? { user_id: userId } : { session_id: sessionId },
    include: [
      {
        model: CartItem,
        as: 'items',
        include: [
          {
            model: Artwork,
            as: 'artwork',
          },
        ],
      },
    ],
  });

  if (!cart) {
    cart = await Cart.create({
      user_id: userId || null,
      session_id: sessionId || null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Reload with includes
    cart = await Cart.findByPk(cart.id, {
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Artwork,
              as: 'artwork',
            },
          ],
        },
      ],
    });
  }

  return cart;
}

/**
 * GET /api/cart
 * Get current user's cart
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    const sessionId = req.session?.id;

    if (!userId && !sessionId) {
      return res.status(400).json({
        error: 'No user or session identified',
      });
    }

    const cart = await getOrCreateCart(userId, sessionId);

    res.json({
      cart: {
        id: cart.id,
        items: cart.items || [],
        itemCount: cart.items?.length || 0,
        totalAmount:
          cart.items?.reduce(
            (sum, item) => sum + parseFloat(item.price_at_time) * item.quantity,
            0
          ) || 0,
      },
    });

    logger.info('Cart retrieved successfully', {
      cartId: cart.id,
      userId,
      itemCount: cart.items?.length || 0,
    });
  } catch (error) {
    logger.error('Error retrieving cart', {
      error: error.message,
      userId: req.session?.user?.id,
    });
    res.status(500).json({
      error: 'Failed to retrieve cart',
      message: error.message,
    });
  }
});

/**
 * POST /api/cart/items
 * Add item to cart
 */
router.post('/items', async (req, res) => {
  try {
    const { artwork_id, quantity = 1 } = req.body;
    const userId = req.session?.user?.id;
    const sessionId = req.session?.id;

    if (!artwork_id) {
      return res.status(400).json({
        error: 'artwork_id is required',
      });
    }

    // Check if artwork exists and is available
    const artwork = await Artwork.findByPk(artwork_id);
    if (!artwork) {
      return res.status(404).json({
        error: 'Artwork not found',
      });
    }

    if (artwork.availability !== 'available') {
      return res.status(400).json({
        error: 'Artwork is not available for purchase',
        availability: artwork.availability,
      });
    }

    const cart = await getOrCreateCart(userId, sessionId);

    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      where: {
        cart_id: cart.id,
        artwork_id: artwork_id,
      },
    });

    if (cartItem) {
      // Update quantity
      cartItem.quantity += parseInt(quantity);
      await cartItem.save();
    } else {
      // Create new cart item
      cartItem = await CartItem.create({
        cart_id: cart.id,
        artwork_id: artwork_id,
        quantity: parseInt(quantity),
        price_at_time: artwork.price,
      });
    }

    // Reload cart with items
    const updatedCart = await Cart.findByPk(cart.id, {
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Artwork,
              as: 'artwork',
            },
          ],
        },
      ],
    });

    res.json({
      message: 'Item added to cart successfully',
      cart: {
        id: updatedCart.id,
        items: updatedCart.items,
        itemCount: updatedCart.items.length,
        totalAmount: updatedCart.items.reduce(
          (sum, item) => sum + parseFloat(item.price_at_time) * item.quantity,
          0
        ),
      },
    });

    logger.info('Item added to cart', {
      cartId: cart.id,
      artworkId: artwork_id,
      quantity,
      userId,
    });
  } catch (error) {
    logger.error('Error adding item to cart', {
      error: error.message,
      body: req.body,
      userId: req.session?.user?.id,
    });
    res.status(500).json({
      error: 'Failed to add item to cart',
      message: error.message,
    });
  }
});

/**
 * PUT /api/cart/items/:itemId
 * Update cart item quantity
 */
router.put('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.session?.user?.id;
    const sessionId = req.session?.id;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        error: 'Valid quantity is required',
      });
    }

    // Find cart item and verify ownership
    const cartItem = await CartItem.findOne({
      where: { id: itemId },
      include: [
        {
          model: Cart,
          as: 'cart',
          where: userId ? { user_id: userId } : { session_id: sessionId },
        },
      ],
    });

    if (!cartItem) {
      return res.status(404).json({
        error: 'Cart item not found',
      });
    }

    cartItem.quantity = parseInt(quantity);
    await cartItem.save();

    // Reload cart with items
    const cart = await Cart.findByPk(cartItem.cart_id, {
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [
            {
              model: Artwork,
              as: 'artwork',
            },
          ],
        },
      ],
    });

    res.json({
      message: 'Cart item updated successfully',
      cart: {
        id: cart.id,
        items: cart.items,
        itemCount: cart.items.length,
        totalAmount: cart.items.reduce(
          (sum, item) => sum + parseFloat(item.price_at_time) * item.quantity,
          0
        ),
      },
    });

    logger.info('Cart item updated', {
      itemId,
      quantity,
      userId,
    });
  } catch (error) {
    logger.error('Error updating cart item', {
      error: error.message,
      itemId: req.params.itemId,
      userId: req.session?.user?.id,
    });
    res.status(500).json({
      error: 'Failed to update cart item',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/cart/items/:itemId
 * Remove item from cart
 */
router.delete('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.session?.user?.id;
    const sessionId = req.session?.id;

    // Find and delete cart item, verify ownership
    const deleted = await CartItem.destroy({
      where: { id: itemId },
      include: [
        {
          model: Cart,
          as: 'cart',
          where: userId ? { user_id: userId } : { session_id: sessionId },
        },
      ],
    });

    if (deleted === 0) {
      return res.status(404).json({
        error: 'Cart item not found',
      });
    }

    res.status(204).send();

    logger.info('Cart item removed', {
      itemId,
      userId,
    });
  } catch (error) {
    logger.error('Error removing cart item', {
      error: error.message,
      itemId: req.params.itemId,
      userId: req.session?.user?.id,
    });
    res.status(500).json({
      error: 'Failed to remove cart item',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/cart
 * Clear entire cart
 */
router.delete('/', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    const sessionId = req.session?.id;

    const cart = await Cart.findOne({
      where: userId ? { user_id: userId } : { session_id: sessionId },
    });

    if (!cart) {
      return res.status(404).json({
        error: 'Cart not found',
      });
    }

    // Delete all cart items
    await CartItem.destroy({
      where: { cart_id: cart.id },
    });

    res.status(204).send();

    logger.info('Cart cleared', {
      cartId: cart.id,
      userId,
    });
  } catch (error) {
    logger.error('Error clearing cart', {
      error: error.message,
      userId: req.session?.user?.id,
    });
    res.status(500).json({
      error: 'Failed to clear cart',
      message: error.message,
    });
  }
});

module.exports = router;
