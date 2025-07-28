const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Session = require('./Session');
const Artwork = require('./Artwork');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

// Define associations
// User associations
User.hasMany(Cart, { foreignKey: 'user_id', as: 'carts' });
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });

// Cart associations
Cart.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Cart.hasMany(CartItem, { foreignKey: 'cart_id', as: 'items' });

// CartItem associations
CartItem.belongsTo(Cart, { foreignKey: 'cart_id', as: 'cart' });
CartItem.belongsTo(Artwork, { foreignKey: 'artwork_id', as: 'artwork' });

// Order associations
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });

// OrderItem associations
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderItem.belongsTo(Artwork, { foreignKey: 'artwork_id', as: 'artwork' });

// Artwork associations
Artwork.hasMany(CartItem, { foreignKey: 'artwork_id', as: 'cartItems' });
Artwork.hasMany(OrderItem, { foreignKey: 'artwork_id', as: 'orderItems' });

// Session associations (if needed for user sessions)
Session.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Session, { foreignKey: 'user_id', as: 'sessions' });

// Export all models with their associations
module.exports = {
  sequelize,
  User,
  Session,
  Artwork,
  Cart,
  CartItem,
  Order,
  OrderItem,
};
