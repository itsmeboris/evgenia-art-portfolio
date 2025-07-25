#!/usr/bin/env node

/**
 * Database Migration Script
 * Migrates artwork data from JSON file to PostgreSQL database
 */

const fs = require('fs');
const path = require('path');
const { pool, initializeDatabase } = require('./config');
const Artwork = require('./models/Artwork');
const Category = require('./models/Category');

class DatabaseMigrator {
  constructor() {
    this.jsonDataPath = path.join(__dirname, '../public/data/artwork-data.json');
    this.backupPath = path.join(__dirname, '../database/backup');
    this.migrationLog = [];
  }

  /**
   * Main migration function
   */
  async migrate() {
    try {
      console.log('🚀 Starting database migration...');

      // Initialize database connection
      const dbReady = await initializeDatabase();
      if (!dbReady) {
        throw new Error('Database connection failed');
      }

      // Load JSON data
      const jsonData = await this.loadJsonData();

      // Create backup of existing data
      await this.createBackup();

      // Migrate categories
      await this.migrateCategories(jsonData);

      // Migrate artworks
      await this.migrateArtworks(jsonData);

      // Verify migration
      await this.verifyMigration();

      // Create migration log
      await this.createMigrationLog();

      console.log('✅ Migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Load JSON data from file
   */
  async loadJsonData() {
    try {
      if (!fs.existsSync(this.jsonDataPath)) {
        throw new Error(`JSON data file not found: ${this.jsonDataPath}`);
      }

      const rawData = fs.readFileSync(this.jsonDataPath, 'utf8');
      const data = JSON.parse(rawData);

      console.log(
        `📄 Loaded JSON data: ${data.artworks?.length || 0} artworks, ${data.categories?.length || 0} categories`
      );

      return data;
    } catch (error) {
      console.error('Error loading JSON data:', error);
      throw error;
    }
  }

  /**
   * Create backup of existing database data
   */
  async createBackup() {
    try {
      console.log('💾 Creating backup of existing data...');

      // Ensure backup directory exists
      if (!fs.existsSync(this.backupPath)) {
        fs.mkdirSync(this.backupPath, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupPath, `backup-${timestamp}.sql`);

      // Export existing data as SQL INSERT statements
      const categoriesResult = await pool.query('SELECT * FROM categories ORDER BY id');
      const artworksResult = await pool.query('SELECT * FROM artworks ORDER BY id');

      let backupContent = `-- Database backup created on ${new Date().toISOString()}\n\n`;

      // Backup categories
      backupContent += `-- Categories backup\n`;
      categoriesResult.rows.forEach(row => {
        const values = Object.values(row)
          .map(val => (val === null ? 'NULL' : `'${val.toString().replace(/'/g, "''")}'`))
          .join(', ');
        backupContent += `INSERT INTO categories VALUES (${values});\n`;
      });

      // Backup artworks
      backupContent += `\n-- Artworks backup\n`;
      artworksResult.rows.forEach(row => {
        const values = Object.values(row)
          .map(val => (val === null ? 'NULL' : `'${val.toString().replace(/'/g, "''")}'`))
          .join(', ');
        backupContent += `INSERT INTO artworks VALUES (${values});\n`;
      });

      fs.writeFileSync(backupFile, backupContent);
      console.log(`✅ Backup created: ${backupFile}`);

      this.migrationLog.push(`Backup created: ${backupFile}`);
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Migrate categories from JSON to database
   */
  async migrateCategories(jsonData) {
    try {
      console.log('📁 Migrating categories...');

      // Clear existing categories (if any)
      await pool.query('DELETE FROM categories');

      // Reset category ID sequence
      await pool.query('ALTER SEQUENCE categories_id_seq RESTART WITH 1');

      let categoriesProcessed = 0;

      // Handle categories from JSON data
      if (jsonData.categories && jsonData.categories.length > 0) {
        for (const category of jsonData.categories) {
          const categoryData = {
            name: category.id || category.name,
            title: category.title || category.name,
            description: category.description || `${category.title} artwork collection`,
            image_path: category.image || null,
            display_order: category.display_order || categoriesProcessed,
          };

          await Category.create(categoryData);
          categoriesProcessed++;
        }
      }

      // Add default categories if none exist
      if (categoriesProcessed === 0) {
        const defaultCategories = [
          {
            name: 'birds',
            title: 'Birds',
            description: 'Beautiful bird paintings',
            display_order: 1,
          },
          {
            name: 'floral',
            title: 'Floral',
            description: 'Vibrant floral compositions',
            display_order: 2,
          },
          {
            name: 'towns',
            title: 'Towns & Landscapes',
            description: 'Charming townscapes',
            display_order: 3,
          },
        ];

        for (const category of defaultCategories) {
          await Category.create(category);
          categoriesProcessed++;
        }
      }

      console.log(`✅ Migrated ${categoriesProcessed} categories`);
      this.migrationLog.push(`Categories migrated: ${categoriesProcessed}`);
    } catch (error) {
      console.error('Error migrating categories:', error);
      throw error;
    }
  }

  /**
   * Migrate artworks from JSON to database
   */
  async migrateArtworks(jsonData) {
    try {
      console.log('🎨 Migrating artworks...');

      // Clear existing artworks (if any)
      await pool.query('DELETE FROM artworks');

      // Reset artwork ID sequence
      await pool.query('ALTER SEQUENCE artworks_id_seq RESTART WITH 1');

      if (!jsonData.artworks || jsonData.artworks.length === 0) {
        console.log('⚠️  No artworks found in JSON data');
        return;
      }

      // Get categories for mapping
      const categories = await Category.getAll();
      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat.name] = cat.id;
      });

      let artworksProcessed = 0;
      let artworksSkipped = 0;

      for (const artwork of jsonData.artworks) {
        try {
          // Skip if missing required fields
          if (!artwork.title || !artwork.id) {
            console.log(
              `⚠️  Skipping artwork with missing title or ID: ${artwork.title || 'Unknown'}`
            );
            artworksSkipped++;
            continue;
          }

          // Find category ID
          const categoryId = categoryMap[artwork.category] || categoryMap['birds'] || 1;

          // Generate slug from title or use existing ID
          const slug = artwork.id || Artwork.generateSlug(artwork.title);

          // Parse price
          let price = null;
          if (artwork.price !== null && artwork.price !== undefined) {
            price =
              typeof artwork.price === 'string'
                ? parseFloat(artwork.price.replace(/[^\d.]/g, ''))
                : parseFloat(artwork.price);
          }

          const artworkData = {
            slug: slug,
            title: artwork.title,
            category_id: categoryId,
            subcategory: artwork.subcategory || null,
            dimensions: artwork.dimensions || null,
            medium: artwork.medium || null,
            price: price,
            currency: jsonData.settings?.currency || 'USD',
            description: artwork.description || null,
            image_path: artwork.image || null,
            thumbnail_path: artwork.thumbnail || artwork.image || null,
            featured: artwork.featured || false,
            available: artwork.available !== undefined ? artwork.available : true,
          };

          await Artwork.create(artworkData);
          artworksProcessed++;
        } catch (error) {
          console.error(`❌ Error processing artwork "${artwork.title}":`, error.message);
          artworksSkipped++;
        }
      }

      console.log(`✅ Migrated ${artworksProcessed} artworks (${artworksSkipped} skipped)`);
      this.migrationLog.push(`Artworks migrated: ${artworksProcessed}`);
      this.migrationLog.push(`Artworks skipped: ${artworksSkipped}`);
    } catch (error) {
      console.error('Error migrating artworks:', error);
      throw error;
    }
  }

  /**
   * Verify migration results
   */
  async verifyMigration() {
    try {
      console.log('🔍 Verifying migration...');

      // Check categories
      const categories = await Category.getAll();
      console.log(`📁 Categories in database: ${categories.length}`);

      // Check artworks
      const artworks = await Artwork.getAll();
      console.log(`🎨 Artworks in database: ${artworks.length}`);

      // Check featured artworks
      const featuredArtworks = await Artwork.getFeatured();
      console.log(`⭐ Featured artworks: ${featuredArtworks.length}`);

      // Check artwork statistics
      const stats = await Artwork.getStats();
      console.log(`📊 Statistics:`, {
        total: stats.total_artworks,
        available: stats.available_artworks,
        featured: stats.featured_artworks,
        average_price: stats.average_price
          ? `$${parseFloat(stats.average_price).toFixed(2)}`
          : 'N/A',
      });

      this.migrationLog.push(
        `Final counts - Categories: ${categories.length}, Artworks: ${artworks.length}`
      );
    } catch (error) {
      console.error('Error verifying migration:', error);
      throw error;
    }
  }

  /**
   * Create migration log file
   */
  async createMigrationLog() {
    try {
      const timestamp = new Date().toISOString();
      const logFile = path.join(
        this.backupPath,
        `migration-log-${timestamp.replace(/[:.]/g, '-')}.txt`
      );

      const logContent = [
        `Database Migration Log`,
        `===================`,
        `Date: ${timestamp}`,
        `Source: ${this.jsonDataPath}`,
        ``,
        `Migration Steps:`,
        ...this.migrationLog.map(entry => `- ${entry}`),
        ``,
        `Migration completed successfully!`,
      ].join('\n');

      fs.writeFileSync(logFile, logContent);
      console.log(`📝 Migration log created: ${logFile}`);
    } catch (error) {
      console.error('Error creating migration log:', error);
      // Don't throw, as this is not critical
    }
  }

  /**
   * Rollback migration (restore from backup)
   */
  async rollback(backupFile) {
    try {
      console.log('🔄 Rolling back migration...');

      if (!fs.existsSync(backupFile)) {
        throw new Error(`Backup file not found: ${backupFile}`);
      }

      const backupContent = fs.readFileSync(backupFile, 'utf8');

      // Clear current data
      await pool.query('DELETE FROM artworks');
      await pool.query('DELETE FROM categories');

      // Execute backup SQL
      const statements = backupContent
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          await pool.query(statement);
        }
      }

      console.log('✅ Migration rolled back successfully');
    } catch (error) {
      console.error('Error rolling back migration:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const migrator = new DatabaseMigrator();

  try {
    if (args.includes('--rollback')) {
      const backupFile = args[args.indexOf('--rollback') + 1];
      if (!backupFile) {
        console.error('❌ Please provide backup file path for rollback');
        process.exit(1);
      }
      await migrator.rollback(backupFile);
    } else if (args.includes('--verify')) {
      await initializeDatabase();
      await migrator.verifyMigration();
    } else {
      await migrator.migrate();
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DatabaseMigrator;
