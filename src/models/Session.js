const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Session extends Model {}

Session.init(
  {
    sid: {
      type: DataTypes.STRING,
      primaryKey: true,
      comment: 'Session ID',
    },
    sess: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Session data in JSON format',
    },
    expire: {
      type: DataTypes.DATE,
      allowNull: false,
      index: true,
      comment: 'Session expiration timestamp',
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
      comment: 'Associated user ID if logged in',
    },
  },
  {
    sequelize,
    modelName: 'Session',
    tableName: 'sessions',
    timestamps: false,
    indexes: [
      {
        fields: ['expire'],
      },
    ],
  }
);

module.exports = Session;
