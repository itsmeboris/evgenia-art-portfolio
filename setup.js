#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎨 Evgenia Art Portfolio - Interactive Setup');
console.log('==========================================\n');

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function setup() {
  try {
    console.log('This script will help you set up the development environment.\n');

    // Get server configuration
    const serverIP = await question('Enter server IP (default: localhost): ') || 'localhost';
    const serverPort = await question('Enter server port (default: 3000): ') || '3000';
    
    // Get admin credentials
    const adminUsername = await question('Enter admin username (default: admin): ') || 'admin';
    const adminPassword = await question('Enter admin password (default: admin): ') || 'admin';
    
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
        execSync(`openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=${serverIP}"`, { stdio: 'inherit' });
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

    // Build development bundles
    console.log('\n5. Building development bundles...');
    try {
      execSync('npm run dev:build', { stdio: 'inherit' });
      console.log('   ✅ Development bundles built');
    } catch (error) {
      console.log('   ❌ Failed to build development bundles');
      throw error;
    }

    // PM2 is now a local dependency - no global installation needed
    console.log('\n6. PM2 setup complete (included as local dependency)');

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