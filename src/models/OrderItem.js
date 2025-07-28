const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class OrderItem extends Model {}

OrderItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: 'Unique order item identifier',
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
      onDelete: 'CASCADE',
      index: true,
      comment: 'Associated order ID',
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
      comment: 'Quantity of this artwork in order',
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: 'Unit price at time of purchase',
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: 'Total price for this line item (unit_price * quantity)',
    },
    artwork_details: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Snapshot of artwork details at time of purchase',
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional item metadata',
    },
  },
  {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'order_items',
    timestamps: true,
    hooks: {
      beforeCreate: orderItem => {
        // Automatically calculate total_price
        orderItem.total_price = orderItem.unit_price * orderItem.quantity;
      },
      beforeUpdate: orderItem => {
        // Recalculate total_price if unit_price or quantity changed
        if (orderItem.changed('unit_price') || orderItem.changed('quantity')) {
          orderItem.total_price = orderItem.unit_price * orderItem.quantity;
        }
      },
    },
    indexes: [
      {
        fields: ['order_id', 'artwork_id'],
      },
      {
        fields: ['artwork_id'],
      },
    ],
  }
);

module.exports = OrderItem;
