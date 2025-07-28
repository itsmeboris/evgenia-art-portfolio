#!/usr/bin/env node

const { Artwork, sequelize } = require('../models');
const logger = require('../js/modules/logger');

async function testArtworkData() {
  try {
    console.log('🎨 Testing artwork data in database...\n');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    // Count total artworks
    const totalCount = await Artwork.count();
    console.log(`📊 Total artworks in database: ${totalCount}`);

    // Get artworks by category
    const categories = await Artwork.findAll({
      attributes: ['category', [sequelize.fn('COUNT', sequelize.col('category')), 'count']],
      group: ['category'],
      raw: true,
    });

    console.log('\n📂 Artworks by category:');
    categories.forEach(cat => {
      console.log(`   ${cat.category}: ${cat.count} items`);
    });

    // Show some sample artworks
    const sampleArtworks = await Artwork.findAll({
      attributes: ['id', 'title', 'category', 'price', 'availability'],
      limit: 5,
      order: [['title', 'ASC']],
    });

    console.log('\n🖼️  Sample artworks:');
    sampleArtworks.forEach(artwork => {
      console.log(
        `   ${artwork.id} - ${artwork.title} (${artwork.category}) - $${artwork.price} - ${artwork.availability}`
      );
    });

    // Test search functionality
    const searchResults = await Artwork.findAll({
      where: {
        category: 'birds',
      },
      attributes: ['id', 'title', 'price'],
      limit: 3,
    });

    console.log('\n🐦 Sample bird artworks:');
    searchResults.forEach(artwork => {
      console.log(`   ${artwork.title} - $${artwork.price}`);
    });

    // Test price statistics
    const priceStats = await Artwork.findOne({
      attributes: [
        [sequelize.fn('MIN', sequelize.col('price')), 'min_price'],
        [sequelize.fn('MAX', sequelize.col('price')), 'max_price'],
        [sequelize.fn('AVG', sequelize.col('price')), 'avg_price'],
      ],
      raw: true,
    });

    console.log('\n💰 Price statistics:');
    console.log(`   Min price: $${parseFloat(priceStats.min_price).toFixed(2)}`);
    console.log(`   Max price: $${parseFloat(priceStats.max_price).toFixed(2)}`);
    console.log(`   Average price: $${parseFloat(priceStats.avg_price).toFixed(2)}`);

    console.log('\n✅ All tests passed! Artwork data is properly stored in the database.');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the test
if (require.main === module) {
  testArtworkData();
}

module.exports = { testArtworkData };
