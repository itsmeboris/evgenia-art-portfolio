#!/usr/bin/env node

const { sequelize } = require('../models');
const logger = require('../js/modules/logger');

/**
 * Initialize the database by creating all tables
 * This script will:
 * 1. Test database connection
 * 2. Sync all models to create tables
 * 3. Handle any errors gracefully
 */
async function initializeDatabase() {
  try {
    logger.info('Starting database initialization...');

    // Test database connection
    logger.info('Testing database connection...');
    await sequelize.authenticate();
    logger.info('Database connection successful');

    // Drop existing tables if --force flag is provided
    const forceSync = process.argv.includes('--force');
    if (forceSync) {
      logger.warn('Force sync enabled - all existing data will be lost!');
    }

    // Sync all models (create tables)
    logger.info('Synchronizing database models...');
    await sequelize.sync({
      force: forceSync,
      alter: !forceSync, // Use alter mode if not forcing (safer for existing data)
    });

    logger.info('Database initialization completed successfully!');
    logger.info('Tables created:', {
      tables: ['users', 'sessions', 'artworks', 'carts', 'cart_items', 'orders', 'order_items'],
    });

    // Create default admin user if none exists
    const { User } = require('../models');
    const adminExists = await User.findOne({ where: { role: 'admin' } });

    if (!adminExists) {
      logger.info('Creating default admin user...');
      await User.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        email: process.env.ADMIN_EMAIL || 'admin@evgenia-art.com',
        password_hash: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User',
        is_active: true,
      });
      logger.info('Default admin user created successfully');
    } else {
      logger.info('Admin user already exists, skipping creation');
    }
  } catch (error) {
    logger.error('Database initialization failed:', {
      error: error.message,
      stack: error.stack,
    });
    console.error('❌ Database initialization failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    logger.info('Database connection closed');
  }
}

// Run the initialization if this script is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database initialization completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Database initialization failed:', error.message);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
