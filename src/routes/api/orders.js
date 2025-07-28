const express = require('express');
const { Order, OrderItem, Cart, CartItem, Artwork, User } = require('../../models');
const logger = require('../../js/modules/logger');

const router = express.Router();

/**
 * GET /api/orders
 * Get user's orders (customer) or all orders (admin)
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    const userRole = req.session?.user?.role;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    const { page = 1, limit = 10, status, payment_status } = req.query;

    // Build where clause
    const where = {};

    // Non-admin users can only see their own orders
    if (userRole !== 'admin') {
      where.user_id = userId;
    }

    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: orders, count: total } = await Order.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'first_name', 'last_name'],
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Artwork,
              as: 'artwork',
              attributes: ['id', 'title', 'image', 'category'],
            },
          ],
        },
      ],
    });

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });

    logger.info('Orders retrieved successfully', {
      count: orders.length,
      total,
      userId,
      userRole,
    });
  } catch (error) {
    logger.error('Error retrieving orders', {
      error: error.message,
      userId: req.session?.user?.id,
    });
    res.status(500).json({
      error: 'Failed to retrieve orders',
      message: error.message,
    });
  }
});

/**
 * GET /api/orders/:id
 * Get specific order details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session?.user?.id;
    const userRole = req.session?.user?.role;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    const where = { id };

    // Non-admin users can only see their own orders
    if (userRole !== 'admin') {
      where.user_id = userId;
    }

    const order = await Order.findOne({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'first_name', 'last_name'],
        },
        {
          model: OrderItem,
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

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    res.json(order);

    logger.info('Order retrieved successfully', {
      orderId: id,
      userId,
    });
  } catch (error) {
    logger.error('Error retrieving order', {
      error: error.message,
      orderId: req.params.id,
      userId: req.session?.user?.id,
    });
    res.status(500).json({
      error: 'Failed to retrieve order',
      message: error.message,
    });
  }
});

/**
 * POST /api/orders
 * Create new order from cart
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    const sessionId = req.session?.id;

    const {
      customer_email,
      customer_name,
      customer_phone,
      billing_address,
      shipping_address,
      notes,
    } = req.body;

    // Validate required fields
    if (!customer_email || !customer_name || !billing_address || !shipping_address) {
      return res.status(400).json({
        error:
          'Missing required fields: customer_email, customer_name, billing_address, shipping_address',
      });
    }

    // Find user's cart
    const cart = await Cart.findOne({
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

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        error: 'Cart is empty',
      });
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + parseFloat(item.price_at_time) * item.quantity,
      0
    );

    // TODO: Calculate tax and shipping based on address
    const tax_amount = 0;
    const shipping_amount = 0;
    const total_amount = subtotal + tax_amount + shipping_amount;

    // Create order
    const order = await Order.create({
      user_id: userId || null,
      status: 'pending',
      payment_status: 'unpaid',
      subtotal,
      tax_amount,
      shipping_amount,
      total_amount,
      customer_email,
      customer_name,
      customer_phone,
      billing_address,
      shipping_address,
      notes,
    });

    // Create order items
    for (const cartItem of cart.items) {
      await OrderItem.create({
        order_id: order.id,
        artwork_id: cartItem.artwork_id,
        quantity: cartItem.quantity,
        unit_price: cartItem.price_at_time,
        artwork_details: {
          title: cartItem.artwork.title,
          category: cartItem.artwork.category,
          medium: cartItem.artwork.medium,
          dimensions: cartItem.artwork.dimensions,
          image: cartItem.artwork.image,
        },
      });

      // Mark artwork as reserved
      await Artwork.update({ availability: 'reserved' }, { where: { id: cartItem.artwork_id } });
    }

    // Clear cart after creating order
    await CartItem.destroy({
      where: { cart_id: cart.id },
    });

    // Load complete order with items
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
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

    res.status(201).json({
      message: 'Order created successfully',
      order: completeOrder,
    });

    logger.info('Order created successfully', {
      orderId: order.id,
      orderNumber: order.order_number,
      userId,
      itemCount: cart.items.length,
      totalAmount: total_amount,
    });
  } catch (error) {
    logger.error('Error creating order', {
      error: error.message,
      userId: req.session?.user?.id,
      body: req.body,
    });
    res.status(500).json({
      error: 'Failed to create order',
      message: error.message,
    });
  }
});

/**
 * PUT /api/orders/:id/status (Admin only)
 * Update order status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status, tracking_number, notes } = req.body;
    const userRole = req.session?.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required',
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (payment_status) updateData.payment_status = payment_status;
    if (tracking_number) updateData.tracking_number = tracking_number;
    if (notes) updateData.notes = notes;

    // Set timestamps based on status changes
    if (status === 'shipped' && !updateData.shipped_at) {
      updateData.shipped_at = new Date();
    }
    if (status === 'delivered' && !updateData.delivered_at) {
      updateData.delivered_at = new Date();
    }
    if (status === 'cancelled' && !updateData.cancelled_at) {
      updateData.cancelled_at = new Date();
    }
    if (payment_status === 'paid' && !updateData.paid_at) {
      updateData.paid_at = new Date();
    }

    const [updated] = await Order.update(updateData, {
      where: { id },
    });

    if (updated === 0) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    // If order is cancelled, return artworks to available status
    if (status === 'cancelled') {
      const orderItems = await OrderItem.findAll({
        where: { order_id: id },
      });

      for (const item of orderItems) {
        await Artwork.update({ availability: 'available' }, { where: { id: item.artwork_id } });
      }
    }

    // If payment is confirmed, mark artworks as sold
    if (payment_status === 'paid') {
      const orderItems = await OrderItem.findAll({
        where: { order_id: id },
      });

      for (const item of orderItems) {
        await Artwork.update({ availability: 'sold' }, { where: { id: item.artwork_id } });
      }
    }

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
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
      message: 'Order updated successfully',
      order,
    });

    logger.info('Order status updated', {
      orderId: id,
      status,
      payment_status,
      userId: req.session?.user?.id,
    });
  } catch (error) {
    logger.error('Error updating order status', {
      error: error.message,
      orderId: req.params.id,
      userId: req.session?.user?.id,
    });
    res.status(500).json({
      error: 'Failed to update order status',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/orders/:id (Admin only)
 * Cancel/delete an order
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.session?.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required',
      });
    }

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    // Return artworks to available status
    for (const item of order.items) {
      await Artwork.update({ availability: 'available' }, { where: { id: item.artwork_id } });
    }

    // Delete order (cascade will delete order items)
    await Order.destroy({ where: { id } });

    res.status(204).send();

    logger.info('Order deleted successfully', {
      orderId: id,
      userId: req.session?.user?.id,
    });
  } catch (error) {
    logger.error('Error deleting order', {
      error: error.message,
      orderId: req.params.id,
      userId: req.session?.user?.id,
    });
    res.status(500).json({
      error: 'Failed to delete order',
      message: error.message,
    });
  }
});

module.exports = router;
