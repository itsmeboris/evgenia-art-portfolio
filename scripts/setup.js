#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('🎨 Evgenia Art Portfolio - Interactive Setup');
console.log('==========================================\n');

async function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, answer => {
      resolve(answer);
    });
  });
}

async function setup() {
  try {
    console.log('This script will help you set up the development environment.\n');

    // Get server configuration
    const serverIP = (await question('Enter server IP (default: localhost): ')) || 'localhost';
    const serverPort = (await question('Enter server port (default: 3000): ')) || '3000';

    // Get admin credentials
    const adminUsername = (await question('Enter admin username (default: admin): ')) || 'admin';
    const adminPassword = (await question('Enter admin password (default: admin): ')) || 'admin';

    // Get database configuration
    console.log('\n🗄️  Database Configuration:');
    const dbUser = (await question('Enter database username (default: postgres): ')) || 'postgres';
    const dbPassword =
      (await question('Enter database password (default: postgres): ')) || 'postgres';
    const dbName =
      (await question('Enter database name (default: evgenia_art_dev): ')) || 'evgenia_art_dev';
    const dbHost = (await question('Enter database host (default: localhost): ')) || 'localhost';
    const dbPort = (await question('Enter database port (default: 5432): ')) || '5432';

    // No need to ask about PM2 - it's now a local dependency

    console.log('\n🔧 Setting up project...\n');

    // Create necessary directories
    console.log('1. Creating directories...');
    const dirs = ['logs', 'pids', 'sessions', 'certs', 'public/dist'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`   ✅ Created ${dir}`);
      } else {
        console.log(`   ✅ ${dir} already exists`);
      }
    });

    // Generate SSL certificates
    console.log('\n2. Generating SSL certificates...');
    if (!fs.existsSync('certs/key.pem') || !fs.existsSync('certs/cert.pem')) {
      try {
        execSync(
          `openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=${serverIP}"`,
          { stdio: 'inherit' }
        );
        console.log('   ✅ SSL certificates generated');
      } catch (error) {
        console.log('   ⚠️  SSL certificate generation failed, HTTPS may not work');
      }
    } else {
      console.log('   ✅ SSL certificates already exist');
    }

    // Generate environment file
    console.log('\n3. Creating environment configuration...');
    const sessionSecret = crypto.randomBytes(32).toString('hex');
    const passwordHash = bcrypt.hashSync(adminPassword, 10);

    const envContent = `# Server Configuration
PORT=${serverPort}
NODE_ENV=development
HOST=${serverIP}

# Admin Authentication
ADMIN_USERNAME=${adminUsername}
ADMIN_PASSWORD_HASH=${passwordHash}

# Session Security
SESSION_SECRET=${sessionSecret}

# Email Configuration (optional)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=public/uploads

# Image Processing
WEBP_QUALITY=80
JPEG_QUALITY=85

# Security
CORS_ORIGIN=http://${serverIP}:${serverPort}
SECURE_COOKIES=false

# Performance
COMPRESSION_LEVEL=6
STATIC_CACHE_MAX_AGE=86400000

# Database Configuration
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
`;

    fs.writeFileSync('.env', envContent);
    console.log('   ✅ Environment file created');

    // Install dependencies
    console.log('\n4. Installing dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('   ✅ Dependencies installed');
    } catch (error) {
      console.log('   ❌ Failed to install dependencies');
      throw error;
    }

    // Setup PostgreSQL Database
    console.log('\n5. Setting up PostgreSQL database...');
    try {
      // Check if PostgreSQL is installed
      try {
        execSync('which psql', { stdio: 'pipe' });
        console.log('   ✅ PostgreSQL is installed');
      } catch {
        console.log('   ⚠️  PostgreSQL not found. Installing...');
        execSync(
          'sudo apt update && sudo apt install -y postgresql postgresql-contrib postgresql-client-common',
          { stdio: 'inherit' }
        );
        console.log('   ✅ PostgreSQL installed');
      }

      // Check if PostgreSQL is running
      try {
        execSync('pg_isready', { stdio: 'pipe' });
        console.log('   ✅ PostgreSQL is running');
      } catch {
        console.log(
          '   ⚠️  PostgreSQL is not running. Please run: sudo systemctl start postgresql'
        );
        const startNow = await question('   Would you like to start PostgreSQL now? (y/N): ');
        if (startNow.toLowerCase() === 'y' || startNow.toLowerCase() === 'yes') {
          try {
            execSync('sudo systemctl start postgresql', { stdio: 'inherit' });
            console.log('   ✅ PostgreSQL started');
          } catch (error) {
            console.log(
              '   ⚠️  Could not start PostgreSQL automatically. Please run manually: sudo systemctl start postgresql'
            );
          }
        }
      }

      // Create database user if it doesn't exist, or update password
      try {
        execSync(
          `sudo -u postgres psql -c "CREATE USER ${dbUser} WITH SUPERUSER PASSWORD '${dbPassword}';" 2>/dev/null`,
          { stdio: 'pipe' }
        );
        console.log(`   ✅ Created database user: ${dbUser}`);
      } catch {
        console.log(`   ✅ Database user ${dbUser} already exists, updating password...`);
        execSync(
          `sudo -u postgres psql -c "ALTER USER ${dbUser} PASSWORD '${dbPassword}';" 2>/dev/null`,
          { stdio: 'pipe' }
        );
        console.log(`   ✅ Password updated for user: ${dbUser}`);
      }

      // Create database if it doesn't exist
      try {
        execSync(`sudo -u postgres createdb ${dbName} -O ${dbUser} 2>/dev/null`, { stdio: 'pipe' });
        console.log(`   ✅ Created database: ${dbName}`);
      } catch {
        console.log(`   ✅ Database ${dbName} already exists`);
      }

      // Test database connection
      console.log('   🔧 Testing database connection...');
      execSync('node src/scripts/testDatabase.js', { stdio: 'inherit' });
      console.log('   ✅ Database connection verified');

      // Initialize database schema
      console.log('   🔧 Initializing database schema...');
      execSync('node src/scripts/initDatabase.js', { stdio: 'inherit' });
      console.log('   ✅ Database schema initialized');

      // Migrate artwork data
      console.log('   🔧 Migrating artwork data...');
      execSync('node src/scripts/migrateArtworkData.js', { stdio: 'inherit' });
      console.log('   ✅ Artwork data migrated');
    } catch (error) {
      console.log('   ❌ PostgreSQL setup failed');
      console.log('   💡 Manual setup required:');
      console.log(
        '      1. Install PostgreSQL: sudo apt-get install postgresql postgresql-contrib'
      );
      console.log('      2. Start PostgreSQL: sudo systemctl start postgresql');
      console.log(
        `      3. Create user: sudo -u postgres psql -c "CREATE USER ${dbUser} WITH SUPERUSER PASSWORD '${dbPassword}';"`
      );
      console.log(`      4. Create database: sudo -u postgres createdb ${dbName} -O ${dbUser}`);
      console.log('      5. Run: node src/scripts/initDatabase.js');
      console.log('      6. Run: node src/scripts/migrateArtworkData.js');
    }

    // Build development bundles
    console.log('\n6. Building development bundles...');
    try {
      execSync('npm run build:dev', { stdio: 'inherit' });
      console.log('   ✅ Development bundles built');
    } catch (error) {
      console.log('   ❌ Failed to build development bundles');
      throw error;
    }

    // PM2 is now a local dependency - no global installation needed
    console.log('\n7. PM2 setup complete (included as local dependency)');

    console.log('\n🎉 Setup completed successfully!\n');
    console.log('📋 Next Steps:');
    console.log('==============');
    console.log(`🚀 Development: npm run dev:server`);
    console.log(`🔗 Local URL: http://${serverIP}:${serverPort}`);
    console.log(`🔐 Admin Panel: http://${serverIP}:${serverPort}/admin/`);
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n🔄 Available Commands:');
    console.log('   npm run dev:server    - Start development server');
    console.log('   npm run dev:watch     - Watch for file changes');
    console.log('   npm run build         - Build for production');
    console.log('   npm run start:prod    - Start production server');
    console.log('   npm run pm2:start     - Deploy with PM2 (local dependency)');
    console.log('   npm run pm2:status    - Check PM2 status');
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run setup
setup().catch(console.error);
