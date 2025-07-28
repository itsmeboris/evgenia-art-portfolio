const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');

class User extends Model {
  // Instance method to check password
  async validatePassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  // Instance method to get safe user data (without password)
  toSafeObject() {
    const { password_hash, ...safeUser } = this.toJSON();
    return safeUser;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: 'Unique user identifier',
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        isAlphanumeric: true,
      },
      comment: 'Unique username for login',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      comment: 'User email address',
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Bcrypt hashed password',
    },
    role: {
      type: DataTypes.ENUM('admin', 'customer', 'artist'),
      defaultValue: 'customer',
      allowNull: false,
      index: true,
      comment: 'User role for access control',
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User first name',
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User last name',
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Contact phone number',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      index: true,
      comment: 'Whether the user account is active',
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp of last successful login',
    },
    login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of failed login attempts',
    },
    locked_until: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Account locked until this timestamp',
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        notifications: true,
        newsletter: false,
        theme: 'light',
      },
      comment: 'User preferences in JSON format',
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional user metadata',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async user => {
        if (user.changed('password_hash')) {
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      },
      beforeUpdate: async user => {
        if (user.changed('password_hash')) {
          const salt = await bcrypt.genSalt(10);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      },
    },
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        unique: true,
        fields: ['username'],
      },
      {
        fields: ['role', 'is_active'],
      },
    ],
  }
);

module.exports = User;
