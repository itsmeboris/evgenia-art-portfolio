const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: 'Unique order identifier',
    },
    order_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Human-readable order number',
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
      index: true,
      comment: 'User ID if logged in, null for guest orders',
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'processing',
        'payment_received',
        'shipped',
        'delivered',
        'cancelled',
        'refunded'
      ),
      defaultValue: 'pending',
      allowNull: false,
      index: true,
      comment: 'Current order status',
    },
    payment_status: {
      type: DataTypes.ENUM('unpaid', 'paid', 'refunded', 'partial_refund'),
      defaultValue: 'unpaid',
      allowNull: false,
      index: true,
      comment: 'Payment status',
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: 'Order subtotal before tax and shipping',
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0,
      },
      comment: 'Tax amount',
    },
    shipping_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0,
      },
      comment: 'Shipping cost',
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: 'Total order amount',
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
      comment: 'Currency code (ISO 4217)',
    },
    customer_email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
      comment: 'Customer email for order communications',
    },
    customer_name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Customer full name',
    },
    customer_phone: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Customer phone number',
    },
    billing_address: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Billing address JSON',
    },
    shipping_address: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Shipping address JSON',
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Payment method used',
    },
    payment_details: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Encrypted payment details',
    },
    tracking_number: {
      type: DataTypes.STRING,
      allowNull: true,
      index: true,
      comment: 'Shipping tracking number',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Order notes',
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional order metadata',
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when payment was received',
    },
    shipped_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when order was shipped',
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when order was delivered',
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when order was cancelled',
    },
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true,
    hooks: {
      beforeCreate: async order => {
        // Generate order number if not provided
        if (!order.order_number) {
          const date = new Date();
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const random = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0');
          order.order_number = `ORD-${year}${month}-${random}`;
        }
      },
    },
    indexes: [
      {
        fields: ['status', 'payment_status'],
      },
      {
        fields: ['customer_email'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

module.exports = Order;
