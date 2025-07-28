const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Cart extends Model {}

Cart.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: 'Unique cart identifier',
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      index: true,
      comment: 'User ID if logged in, null for guest carts',
    },
    session_id: {
      type: DataTypes.STRING,
      allowNull: true,
      index: true,
      comment: 'Session ID for guest carts',
    },
    status: {
      type: DataTypes.ENUM('active', 'abandoned', 'converted'),
      defaultValue: 'active',
      index: true,
      comment: 'Cart status',
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      index: true,
      comment: 'Cart expiration for cleanup',
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional cart metadata',
    },
  },
  {
    sequelize,
    modelName: 'Cart',
    tableName: 'carts',
    timestamps: true,
  }
);

module.exports = Cart;
