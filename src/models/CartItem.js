const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class CartItem extends Model {}

CartItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: 'Unique cart item identifier',
    },
    cart_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'carts',
        key: 'id',
      },
      onDelete: 'CASCADE',
      index: true,
      comment: 'Associated cart ID',
    },
    artwork_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'artworks',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      index: true,
      comment: 'Associated artwork ID',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
      comment: 'Quantity of this artwork in cart',
    },
    price_at_time: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Price when added to cart',
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional item metadata',
    },
  },
  {
    sequelize,
    modelName: 'CartItem',
    tableName: 'cart_items',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['cart_id', 'artwork_id'],
      },
    ],
  }
);

module.exports = CartItem;
