const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Artwork extends Model {}

Artwork.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
      comment: 'Unique identifier for the artwork (e.g., "hummingbird")',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Display title of the artwork',
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      index: true,
      comment: 'Main category (e.g., "birds", "landscapes")',
    },
    subcategory: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
      index: true,
      comment: 'Subcategory within the main category',
    },
    dimensions: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Physical dimensions (e.g., "20cm X 20cm")',
    },
    medium: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Art medium used (e.g., "Acrylic on Canvas")',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: 'Price in USD',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
      comment: 'Detailed description of the artwork',
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Path to the artwork image file',
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      index: true,
      comment: 'Whether this artwork is featured',
    },
    availability: {
      type: DataTypes.ENUM('available', 'sold', 'reserved', 'not_for_sale'),
      defaultValue: 'available',
      index: true,
      comment: 'Current availability status',
    },
    year_created: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1900,
        max: new Date().getFullYear(),
      },
      comment: 'Year the artwork was created',
    },
    view_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of times the artwork has been viewed',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Tags for search and categorization',
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional metadata in JSON format',
    },
  },
  {
    sequelize,
    modelName: 'Artwork',
    tableName: 'artworks',
    timestamps: true,
    indexes: [
      {
        fields: ['category', 'subcategory'],
      },
      {
        fields: ['price'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

module.exports = Artwork;
