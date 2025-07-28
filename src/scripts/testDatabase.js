#!/usr/bin/env node

const { testConnection, sequelize } = require('../config/database');
const logger = require('../js/modules/logger');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');

  try {
    // Test basic connection
    const connected = await testConnection();

    if (connected) {
      console.log('✅ Database connection successful!');

      // Test if we can query the database
      try {
        await sequelize.query('SELECT version();');
        console.log('✅ Database query test successful!');

        // List existing tables
        const [results] = await sequelize.query(`
          SELECT tablename FROM pg_tables
          WHERE schemaname = 'public'
          ORDER BY tablename;
        `);

        if (results.length > 0) {
          console.log(
            '📊 Existing tables:',
            results.map(r => r.tablename)
          );
        } else {
          console.log('📊 No tables found - database is empty');
        }
      } catch (queryError) {
        console.log('⚠️  Database connection works but query failed:', queryError.message);
      }
    } else {
      console.log('❌ Database connection failed');
    }
  } catch (error) {
    console.log('❌ Database test failed:', error.message);

    // Show helpful error information
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Hint: Check if PostgreSQL server is running and accessible');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Hint: PostgreSQL might not be running or the port might be incorrect');
    } else if (error.name === 'SequelizeConnectionRefusedError') {
      console.log('💡 Hint: Database connection refused - check credentials and host');
    }

    console.log('\n🔧 Current configuration:');
    console.log('- Host:', process.env.DB_HOST || 'localhost');
    console.log('- Port:', process.env.DB_PORT || '5432');
    console.log('- Database:', process.env.DB_NAME || 'evgenia_art_dev');
    console.log('- User:', process.env.DB_USER || 'postgres');
    console.log('- Password:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');
  } finally {
    await sequelize.close();
  }
}

// Run the test
if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = { testDatabaseConnection };
