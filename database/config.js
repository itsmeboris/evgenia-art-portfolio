/**
 * Database Configuration
 * Handles PostgreSQL connection setup and management
 */

const { Pool } = require('pg');
const Redis = require('redis');

// Database configuration
const dbConfig = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'evgenia_art',
    username: process.env.DB_USER || 'evgenia',
    password: process.env.DB_PASSWORD || 'art_gallery_2025',
    ssl: process.env.DB_SSL === 'true',
    max: 20, // Maximum number of connections
    idleTimeoutMillis: 30000, // How long a client can sit idle
    connectionTimeoutMillis: 2000, // How long to wait for a connection
  },
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};

// Redis configuration
const redisConfig = {
  development: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
  },
  production: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },
};

const environment = process.env.NODE_ENV || 'development';
const currentDbConfig = dbConfig[environment];
const currentRedisConfig = redisConfig[environment];

// Create PostgreSQL connection pool
const pool = new Pool({
  host: currentDbConfig.host,
  port: currentDbConfig.port,
  database: currentDbConfig.database,
  user: currentDbConfig.username,
  password: currentDbConfig.password,
  ssl: currentDbConfig.ssl,
  max: currentDbConfig.max,
  idleTimeoutMillis: currentDbConfig.idleTimeoutMillis,
  connectionTimeoutMillis: currentDbConfig.connectionTimeoutMillis,
});

// Create Redis connection
const redisClient = Redis.createClient({
  host: currentRedisConfig.host,
  port: currentRedisConfig.port,
  password: currentRedisConfig.password,
});

// Handle database connection events
pool.on('connect', client => {
  console.log('🔗 New PostgreSQL client connected');
});

pool.on('error', err => {
  console.error('❌ PostgreSQL pool error:', err);
  process.exit(-1);
});

pool.on('remove', client => {
  console.log('🔌 PostgreSQL client removed');
});

// Handle Redis connection events
redisClient.on('connect', () => {
  console.log('🔗 Redis connected');
});

redisClient.on('error', err => {
  console.error('❌ Redis error:', err);
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful:', result.rows[0]);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Test Redis connection
async function testRedisConnection() {
  try {
    await redisClient.ping();
    console.log('✅ Redis connection successful');
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    return false;
  }
}

// Initialize connections
async function initializeDatabase() {
  console.log('🚀 Initializing database connections...');

  const dbConnected = await testConnection();
  const redisConnected = await testRedisConnection();

  if (dbConnected) {
    if (!redisConnected) {
      console.warn('⚠️  Redis connection failed - continuing without cache features');
    }
    console.log('✅ All database connections initialized successfully');
    return true;
  } else {
    console.error('❌ Failed to initialize database connections');
    return false;
  }
}

// Graceful shutdown
async function closeConnections() {
  console.log('🔌 Closing database connections...');

  try {
    await pool.end();
    try {
      await redisClient.quit();
    } catch (redisError) {
      console.warn('⚠️  Redis close failed:', redisError.message);
    }
    console.log('✅ Database connections closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
}

// Handle process termination
process.on('SIGINT', closeConnections);
process.on('SIGTERM', closeConnections);

module.exports = {
  pool,
  redisClient,
  testConnection,
  testRedisConnection,
  initializeDatabase,
  closeConnections,
  dbConfig: currentDbConfig,
  redisConfig: currentRedisConfig,
  environment,
};
