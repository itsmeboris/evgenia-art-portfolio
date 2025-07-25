/**
 * Sitemap Service Module
 * Handles dynamic sitemap generation on the client side
 */

class SitemapService {
  constructor() {
    this.baseUrl = window.location.origin;
    this.endpoints = {
      artworkData: '/public/data/artwork-data.json',
      sitemap: '/sitemap.xml',
      robotsTxt: '/robots.txt',
    };
  }

  /**
   * Generate sitemap data structure
   */
  async generateSitemapData() {
    try {
      const artworkData = await this.fetchArtworkData();
      const urls = [
        ...this.getStaticPages(),
        ...this.generateCategoryPages(artworkData),
        ...this.generateArtworkPages(artworkData),
      ];

      return {
        urls,
        totalCount: urls.length,
        lastGenerated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error generating sitemap data:', error);
      throw error;
    }
  }

  /**
   * Fetch artwork data
   */
  async fetchArtworkData() {
    try {
      const response = await fetch(this.endpoints.artworkData);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching artwork data:', error);
      return { artworks: [], categories: [] };
    }
  }

  /**
   * Get static pages configuration
   */
  getStaticPages() {
    return [
      {
        url: '/',
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString().split('T')[0],
        title: 'Homepage',
      },
      {
        url: '/gallery',
        changefreq: 'daily',
        priority: 0.9,
        lastmod: new Date().toISOString().split('T')[0],
        title: 'Gallery',
      },
      {
        url: '/about',
        changefreq: 'monthly',
        priority: 0.8,
        lastmod: new Date().toISOString().split('T')[0],
        title: 'About',
      },
      {
        url: '/contact',
        changefreq: 'monthly',
        priority: 0.7,
        lastmod: new Date().toISOString().split('T')[0],
        title: 'Contact',
      },
    ];
  }

  /**
   * Generate category pages
   */
  generateCategoryPages(artworkData) {
    const categoryPages = [];

    // From artwork data categories
    if (artworkData.categories) {
      artworkData.categories.forEach(category => {
        categoryPages.push({
          url: `/gallery?collection=${category.id}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: new Date().toISOString().split('T')[0],
          title: `${category.title} Collection`,
        });
      });
    }

    // Add common categories
    const commonCategories = [
      { id: 'birds', title: 'Birds' },
      { id: 'floral', title: 'Floral' },
      { id: 'towns', title: 'Towns' },
    ];

    commonCategories.forEach(category => {
      if (!categoryPages.find(page => page.url.includes(category.id))) {
        categoryPages.push({
          url: `/gallery?collection=${category.id}`,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: new Date().toISOString().split('T')[0],
          title: `${category.title} Collection`,
        });
      }
    });

    return categoryPages;
  }

  /**
   * Generate artwork pages
   */
  generateArtworkPages(artworkData) {
    const artworkPages = [];

    if (artworkData.artworks) {
      artworkData.artworks.forEach(artwork => {
        if (!artwork.id || !artwork.title) return;

        artworkPages.push({
          url: `/artwork/${artwork.id}`,
          changefreq: 'monthly',
          priority: artwork.featured ? 0.9 : 0.7,
          lastmod: new Date().toISOString().split('T')[0],
          title: artwork.title,
          image: artwork.image ? this.normalizeImageUrl(artwork.image) : null,
          category: artwork.category,
          price: artwork.price,
        });
      });
    }

    return artworkPages;
  }

  /**
   * Normalize image URL
   */
  normalizeImageUrl(imageUrl) {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    const cleanUrl = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    return `${this.baseUrl}/${cleanUrl}`;
  }

  /**
   * Generate XML sitemap string
   */
  generateSitemapXml(sitemapData) {
    const urlEntries = sitemapData.urls.map(url => this.generateUrlEntry(url)).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;
  }

  /**
   * Generate URL entry for XML
   */
  generateUrlEntry(urlData) {
    const fullUrl = urlData.url.startsWith('http') ? urlData.url : `${this.baseUrl}${urlData.url}`;

    let entry = `  <url>
    <loc>${this.escapeXml(fullUrl)}</loc>
    <lastmod>${urlData.lastmod}</lastmod>
    <changefreq>${urlData.changefreq}</changefreq>
    <priority>${urlData.priority}</priority>`;

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
   * Display sitemap information in console
   */
  async displaySitemapInfo() {
    try {
      const sitemapData = await this.generateSitemapData();

      console.log('🗺️  Sitemap Information:');
      console.log(`📍 Total URLs: ${sitemapData.totalCount}`);
      console.log(`📅 Last Generated: ${sitemapData.lastGenerated}`);
      console.log(`🔗 Base URL: ${this.baseUrl}`);

      // Group by type
      const groupedUrls = this.groupUrlsByType(sitemapData.urls);
      Object.entries(groupedUrls).forEach(([type, urls]) => {
        console.log(`  ${type}: ${urls.length} URLs`);
      });

      return sitemapData;
    } catch (error) {
      console.error('Error displaying sitemap info:', error);
      throw error;
    }
  }

  /**
   * Group URLs by type for display
   */
  groupUrlsByType(urls) {
    return urls.reduce((groups, url) => {
      let type = 'Other';

      if (url.url === '/') {
        type = 'Homepage';
      } else if (url.url.startsWith('/gallery')) {
        type = url.url.includes('collection=') ? 'Collections' : 'Gallery';
      } else if (url.url.startsWith('/artwork/')) {
        type = 'Artworks';
      } else if (['about', 'contact'].some(page => url.url.includes(page))) {
        type = 'Static Pages';
      }

      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(url);

      return groups;
    }, {});
  }

  /**
   * Generate robots.txt content
   */
  generateRobotsTxt() {
    return `User-agent: *
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
  }

  /**
   * Download sitemap as XML file
   */
  async downloadSitemap() {
    try {
      const sitemapData = await this.generateSitemapData();
      const xmlContent = this.generateSitemapXml(sitemapData);

      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'sitemap.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ Sitemap downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading sitemap:', error);
      throw error;
    }
  }

  /**
   * Download robots.txt file
   */
  downloadRobotsTxt() {
    try {
      const robotsContent = this.generateRobotsTxt();

      const blob = new Blob([robotsContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'robots.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ robots.txt downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading robots.txt:', error);
      throw error;
    }
  }

  /**
   * Validate sitemap URLs
   */
  async validateSitemap() {
    try {
      const sitemapData = await this.generateSitemapData();
      const invalidUrls = [];

      sitemapData.urls.forEach(urlData => {
        const fullUrl = urlData.url.startsWith('http')
          ? urlData.url
          : `${this.baseUrl}${urlData.url}`;

        try {
          new URL(fullUrl);
        } catch {
          invalidUrls.push(fullUrl);
        }
      });

      if (invalidUrls.length > 0) {
        console.warn('⚠️  Invalid URLs found:');
        invalidUrls.forEach(url => console.warn(`  - ${url}`));
        return false;
      }

      console.log('✅ All sitemap URLs are valid');
      return true;
    } catch (error) {
      console.error('❌ Error validating sitemap:', error);
      return false;
    }
  }

  /**
   * Get sitemap statistics
   */
  async getSitemapStats() {
    try {
      const sitemapData = await this.generateSitemapData();
      const groupedUrls = this.groupUrlsByType(sitemapData.urls);

      const stats = {
        totalUrls: sitemapData.totalCount,
        byType: Object.entries(groupedUrls).map(([type, urls]) => ({
          type,
          count: urls.length,
        })),
        lastGenerated: sitemapData.lastGenerated,
        baseUrl: this.baseUrl,
      };

      console.log('📊 Sitemap Statistics:');
      console.log(`  Total URLs: ${stats.totalUrls}`);
      stats.byType.forEach(({ type, count }) => {
        console.log(`  ${type}: ${count}`);
      });
      console.log(`  Last Generated: ${stats.lastGenerated}`);

      return stats;
    } catch (error) {
      console.error('❌ Error getting sitemap stats:', error);
      return null;
    }
  }
}

// Initialize sitemap service
const sitemapService = new SitemapService();

// Make available globally for testing
window.sitemapService = sitemapService;

// Add console helpers for easy testing
window.sitemap = {
  info: () => sitemapService.displaySitemapInfo(),
  download: () => sitemapService.downloadSitemap(),
  robots: () => sitemapService.downloadRobotsTxt(),
  validate: () => sitemapService.validateSitemap(),
  stats: () => sitemapService.getSitemapStats(),
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SitemapService;
}

window.SitemapService = SitemapService;
