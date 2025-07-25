#!/usr/bin/env node

/**
 * Dynamic Sitemap Generator
 * Generates XML sitemaps based on artwork data and static pages
 */

const fs = require('fs');
const path = require('path');

class SitemapGenerator {
  constructor() {
    this.baseUrl = 'https://evgeniaart.com'; // Update with actual domain
    this.outputPath = path.join(__dirname, '../public/sitemap.xml');
    this.artworkDataPath = path.join(__dirname, '../public/data/artwork-data.json');
    this.staticPages = [
      {
        url: '/',
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        url: '/gallery',
        changefreq: 'daily',
        priority: 0.9,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        url: '/about',
        changefreq: 'monthly',
        priority: 0.8,
        lastmod: new Date().toISOString().split('T')[0],
      },
      {
        url: '/contact',
        changefreq: 'monthly',
        priority: 0.7,
        lastmod: new Date().toISOString().split('T')[0],
      },
    ];
  }

  /**
   * Generate complete sitemap
   */
  async generateSitemap() {
    try {
      console.log('🗺️  Generating sitemap...');

      const artworkData = await this.loadArtworkData();
      const urls = [
        ...this.staticPages,
        ...this.generateCategoryPages(artworkData),
        ...this.generateArtworkPages(artworkData),
      ];

      const sitemapXml = this.generateSitemapXml(urls);
      await this.writeSitemap(sitemapXml);

      console.log(`✅ Sitemap generated successfully with ${urls.length} URLs`);
      console.log(`📍 Sitemap saved to: ${this.outputPath}`);

      return urls.length;
    } catch (error) {
      console.error('❌ Error generating sitemap:', error);
      throw error;
    }
  }

  /**
   * Load artwork data from JSON file
   */
  async loadArtworkData() {
    try {
      const rawData = fs.readFileSync(this.artworkDataPath, 'utf8');
      return JSON.parse(rawData);
    } catch (error) {
      console.error('Error loading artwork data:', error);
      return { artworks: [], categories: [] };
    }
  }

  /**
   * Generate category/collection pages
   */
  generateCategoryPages(artworkData) {
    const categoryPages = [];

    if (artworkData.categories) {
      artworkData.categories.forEach(category => {
        categoryPages.push({
          url: `/gallery?collection=${category.id}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: new Date().toISOString().split('T')[0],
        });
      });
    }

    // Add common category pages if not in data
    const commonCategories = ['birds', 'floral', 'towns'];
    commonCategories.forEach(category => {
      if (!categoryPages.find(page => page.url.includes(category))) {
        categoryPages.push({
          url: `/gallery?collection=${category}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: new Date().toISOString().split('T')[0],
        });
      }
    });

    return categoryPages;
  }

  /**
   * Generate individual artwork pages
   */
  generateArtworkPages(artworkData) {
    const artworkPages = [];

    if (artworkData.artworks) {
      artworkData.artworks.forEach(artwork => {
        // Skip artworks without proper IDs
        if (!artwork.id || !artwork.title) {
          return;
        }

        artworkPages.push({
          url: `/artwork/${artwork.id}`,
          changefreq: 'monthly',
          priority: artwork.featured ? 0.9 : 0.7,
          lastmod: new Date().toISOString().split('T')[0],
          image: artwork.image ? this.normalizeImageUrl(artwork.image) : null,
        });
      });
    }

    return artworkPages;
  }

  /**
   * Normalize image URL for sitemap
   */
  normalizeImageUrl(imageUrl) {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    // Remove leading slash if present and add base URL
    const cleanUrl = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    return `${this.baseUrl}/${cleanUrl}`;
  }

  /**
   * Generate sitemap XML
   */
  generateSitemapXml(urls) {
    const urlEntries = urls.map(url => this.generateUrlEntry(url)).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;
  }

  /**
   * Generate individual URL entry
   */
  generateUrlEntry(urlData) {
    const fullUrl = urlData.url.startsWith('http') ? urlData.url : `${this.baseUrl}${urlData.url}`;

    let entry = `  <url>
    <loc>${this.escapeXml(fullUrl)}</loc>
    <lastmod>${urlData.lastmod}</lastmod>
    <changefreq>${urlData.changefreq}</changefreq>
    <priority>${urlData.priority}</priority>`;

    // Add image information if available
    if (urlData.image) {
      entry += `
    <image:image>
      <image:loc>${this.escapeXml(urlData.image)}</image:loc>
    </image:image>`;
    }

    entry += `
  </url>`;

    return entry;
  }

  /**
   * Escape XML special characters
   */
  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Write sitemap to file
   */
  async writeSitemap(sitemapXml) {
    try {
      // Ensure public directory exists
      const publicDir = path.dirname(this.outputPath);
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      fs.writeFileSync(this.outputPath, sitemapXml, 'utf8');
    } catch (error) {
      console.error('Error writing sitemap:', error);
      throw error;
    }
  }

  /**
   * Generate robots.txt with sitemap reference
   */
  generateRobotsTxt() {
    const robotsPath = path.join(__dirname, '../public/robots.txt');
    const robotsContent = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl delay
Crawl-delay: 1

# Disallow admin areas
Disallow: /admin/
Disallow: /scripts/
Disallow: /node_modules/
Disallow: /src/

# Allow images
Allow: /public/assets/images/
Allow: /public/assets/favicon/
`;

    try {
      fs.writeFileSync(robotsPath, robotsContent, 'utf8');
      console.log('✅ robots.txt generated successfully');
    } catch (error) {
      console.error('❌ Error generating robots.txt:', error);
      throw error;
    }
  }

  /**
   * Validate sitemap URLs
   */
  async validateSitemap() {
    try {
      const sitemapContent = fs.readFileSync(this.outputPath, 'utf8');
      const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g);

      if (!urlMatches) {
        console.log('⚠️  No URLs found in sitemap');
        return false;
      }

      const urls = urlMatches.map(match => match.replace('<loc>', '').replace('</loc>', ''));

      console.log(`🔍 Validating ${urls.length} URLs...`);

      // Basic URL validation
      const invalidUrls = urls.filter(url => {
        try {
          new URL(url);
          return false;
        } catch {
          return true;
        }
      });

      if (invalidUrls.length > 0) {
        console.log('❌ Invalid URLs found:');
        invalidUrls.forEach(url => console.log(`  - ${url}`));
        return false;
      }

      console.log('✅ All URLs are valid');
      return true;
    } catch (error) {
      console.error('❌ Error validating sitemap:', error);
      return false;
    }
  }

  /**
   * Get sitemap statistics
   */
  getSitemapStats() {
    try {
      const sitemapContent = fs.readFileSync(this.outputPath, 'utf8');
      const urlMatches = sitemapContent.match(/<url>/g);
      const imageMatches = sitemapContent.match(/<image:image>/g);

      const stats = {
        totalUrls: urlMatches ? urlMatches.length : 0,
        totalImages: imageMatches ? imageMatches.length : 0,
        fileSize: fs.statSync(this.outputPath).size,
        lastGenerated: fs.statSync(this.outputPath).mtime,
      };

      console.log('📊 Sitemap Statistics:');
      console.log(`  Total URLs: ${stats.totalUrls}`);
      console.log(`  Total Images: ${stats.totalImages}`);
      console.log(`  File Size: ${(stats.fileSize / 1024).toFixed(2)} KB`);
      console.log(`  Last Generated: ${stats.lastGenerated.toISOString()}`);

      return stats;
    } catch (error) {
      console.error('❌ Error getting sitemap stats:', error);
      return null;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const generator = new SitemapGenerator();

  try {
    if (args.includes('--validate')) {
      await generator.validateSitemap();
    } else if (args.includes('--stats')) {
      generator.getSitemapStats();
    } else if (args.includes('--robots')) {
      generator.generateRobotsTxt();
    } else {
      // Generate sitemap
      await generator.generateSitemap();
      generator.generateRobotsTxt();
      await generator.validateSitemap();
      generator.getSitemapStats();
    }
  } catch (error) {
    console.error('❌ Sitemap generation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = SitemapGenerator;
