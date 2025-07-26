/**
 * Meta Tags Module
 * Handles dynamic meta tag generation for SEO and social media sharing
 */

class MetaTags {
  constructor() {
    this.baseUrl = window.location.origin;
    this.siteName = 'Evgenia Portnov | Artist';
    this.defaultImage = '/public/assets/images/artwork/featured/default-og-image.webp';
    this.artistInfo = {
      name: 'Evgenia Portnov',
      description: 'Contemporary artist specializing in birds, floral, and townscape paintings',
      location: 'Israel',
      email: 'contact@evgeniaart.com',
      social: {
        facebook: 'https://facebook.com/evgeniaart',
        instagram: 'https://instagram.com/evgeniaart',
        twitter: 'https://twitter.com/evgeniaart',
      },
    };
    this.defaultSEO = {
      title: 'Evgenia Portnov | Contemporary Artist & Art Gallery',
      description:
        'Discover beautiful contemporary artworks by Evgenia Portnov. Specializing in birds, floral, and townscape paintings. Original artworks available for purchase.',
      keywords:
        'art, artist, paintings, contemporary art, birds, floral, townscape, Israeli artist, original artwork',
    };
  }

  /**
   * Initialize meta tags for the current page
   */
  init() {
    this.updatePageMetaTags();
    this.addStructuredData();
  }

  /**
   * Update meta tags based on current page
   */
  updatePageMetaTags() {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);

    if (path === '/' || path === '/index.html') {
      this.setHomepageMetaTags();
    } else if (path === '/gallery' || path === '/gallery.html') {
      this.setGalleryMetaTags(urlParams.get('collection'));
    } else if (path === '/about' || path === '/about.html') {
      this.setAboutMetaTags();
    } else if (path === '/contact' || path === '/contact.html') {
      this.setContactMetaTags();
    } else if (path.startsWith('/artwork/')) {
      const artworkId = path.split('/artwork/')[1];
      this.setArtworkMetaTags(artworkId);
    } else if (path === '/404.html') {
      this.set404MetaTags();
    }
  }

  /**
   * Set homepage meta tags
   */
  setHomepageMetaTags() {
    const metaData = {
      title: this.defaultSEO.title,
      description: this.defaultSEO.description,
      keywords: this.defaultSEO.keywords,
      image: this.defaultImage,
      url: this.baseUrl,
      type: 'website',
    };

    this.setMetaTags(metaData);
  }

  /**
   * Set gallery meta tags
   */
  setGalleryMetaTags(collection = null) {
    const collectionTitles = {
      birds: 'Bird Art Gallery',
      floral: 'Floral Art Gallery',
      towns: 'Townscape Art Gallery',
    };

    const title =
      collection && collectionTitles[collection]
        ? `${collectionTitles[collection]} | ${this.siteName}`
        : `Art Gallery | ${this.siteName}`;

    const description =
      collection && collectionTitles[collection]
        ? `Explore ${collectionTitles[collection].toLowerCase()} by Evgenia Portnov. Beautiful ${collection} paintings available for purchase.`
        : `Browse the complete art gallery by Evgenia Portnov. Original paintings including birds, floral, and townscape artworks.`;

    const metaData = {
      title,
      description,
      keywords: collection
        ? `${collection} art, ${collection} paintings, ${this.defaultSEO.keywords}`
        : `art gallery, ${this.defaultSEO.keywords}`,
      image: this.defaultImage,
      url: `${this.baseUrl}/gallery${collection ? `?collection=${collection}` : ''}`,
      type: 'website',
    };

    this.setMetaTags(metaData);
  }

  /**
   * Set about page meta tags
   */
  setAboutMetaTags() {
    const metaData = {
      title: `About ${this.artistInfo.name} | ${this.siteName}`,
      description: `Learn about ${this.artistInfo.name}, a ${this.artistInfo.description.toLowerCase()}. Discover her artistic journey and inspiration.`,
      keywords: `${this.artistInfo.name}, artist biography, ${this.defaultSEO.keywords}`,
      image: this.defaultImage,
      url: `${this.baseUrl}/about`,
      type: 'profile',
    };

    this.setMetaTags(metaData);
  }

  /**
   * Set contact page meta tags
   */
  setContactMetaTags() {
    const metaData = {
      title: `Contact ${this.artistInfo.name} | ${this.siteName}`,
      description: `Get in touch with ${this.artistInfo.name} for custom artwork, exhibitions, or inquiries. Contact information and frequently asked questions.`,
      keywords: `contact artist, custom artwork, art commissions, ${this.defaultSEO.keywords}`,
      image: this.defaultImage,
      url: `${this.baseUrl}/contact`,
      type: 'website',
    };

    this.setMetaTags(metaData);
  }

  /**
   * Set artwork-specific meta tags
   */
  async setArtworkMetaTags(artworkId) {
    try {
      const artwork = await this.getArtworkData(artworkId);
      if (!artwork) {
        this.set404MetaTags();
        return;
      }

      const metaData = {
        title: `${artwork.title} | ${this.siteName}`,
        description: `${artwork.title} by ${this.artistInfo.name}. ${artwork.medium} artwork, ${artwork.dimensions}. ${artwork.description || 'Beautiful original artwork available for purchase.'}`,
        keywords: `${artwork.title}, ${artwork.category} art, ${artwork.medium}, ${this.defaultSEO.keywords}`,
        image: artwork.image.startsWith('http')
          ? artwork.image
          : `${this.baseUrl}/${artwork.image}`,
        url: `${this.baseUrl}/artwork/${artworkId}`,
        type: 'article',
        artwork: artwork,
      };

      this.setMetaTags(metaData);
    } catch (error) {
      logger.error(
        'Error loading artwork meta tags',
        { module: 'meta-tags', function: 'loadArtworkMetaTags' },
        { artworkId: artworkId, error: error.message }
      );
      this.set404MetaTags();
    }
  }

  /**
   * Set 404 page meta tags
   */
  set404MetaTags() {
    const metaData = {
      title: `Page Not Found | ${this.siteName}`,
      description: `The page you're looking for doesn't exist. Explore ${this.artistInfo.name}'s art gallery and discover beautiful original artworks.`,
      keywords: this.defaultSEO.keywords,
      image: this.defaultImage,
      url: `${this.baseUrl}/404`,
      type: 'website',
    };

    this.setMetaTags(metaData);
  }

  /**
   * Set all meta tags
   */
  setMetaTags(metaData) {
    // Basic SEO meta tags
    this.setMetaTag('title', metaData.title);
    this.setMetaTag('description', metaData.description);
    this.setMetaTag('keywords', metaData.keywords);

    // Open Graph tags
    this.setMetaTag('og:title', metaData.title);
    this.setMetaTag('og:description', metaData.description);
    this.setMetaTag('og:image', metaData.image);
    this.setMetaTag('og:url', metaData.url);
    this.setMetaTag('og:type', metaData.type);
    this.setMetaTag('og:site_name', this.siteName);
    this.setMetaTag('og:locale', 'en_US');

    // Twitter Card tags
    this.setMetaTag('twitter:card', 'summary_large_image');
    this.setMetaTag('twitter:title', metaData.title);
    this.setMetaTag('twitter:description', metaData.description);
    this.setMetaTag('twitter:image', metaData.image);
    this.setMetaTag('twitter:url', metaData.url);
    this.setMetaTag('twitter:creator', '@evgeniaart');

    // Additional SEO tags
    this.setMetaTag('robots', 'index, follow');
    this.setMetaTag('author', this.artistInfo.name);
    this.setMetaTag('viewport', 'width=device-width, initial-scale=1.0');

    // Artwork-specific tags
    if (metaData.artwork) {
      this.setMetaTag('article:author', this.artistInfo.name);
      this.setMetaTag('article:section', 'Art');
      this.setMetaTag('article:tag', metaData.artwork.category);
      this.setMetaTag('product:price:amount', metaData.artwork.price);
      this.setMetaTag('product:price:currency', 'USD');
    }

    // Update page title
    document.title = metaData.title;
  }

  /**
   * Set individual meta tag
   */
  setMetaTag(property, content) {
    if (!content) return;

    // Handle title tag separately
    if (property === 'title') {
      document.title = content;
      return;
    }

    // Determine if it's a name or property attribute
    const isProperty =
      property.startsWith('og:') ||
      property.startsWith('twitter:') ||
      property.startsWith('article:') ||
      property.startsWith('product:');
    const attribute = isProperty ? 'property' : 'name';

    // Find existing tag
    let tag = document.querySelector(`meta[${attribute}="${property}"]`);

    // Create new tag if it doesn't exist
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attribute, property);
      document.head.appendChild(tag);
    }

    // Set content
    tag.setAttribute('content', content);
  }

  /**
   * Add structured data (JSON-LD)
   */
  addStructuredData() {
    const path = window.location.pathname;

    if (path === '/' || path === '/index.html') {
      this.addWebsiteStructuredData();
      this.addPersonStructuredData();
    } else if (path === '/gallery' || path === '/gallery.html') {
      this.addGalleryStructuredData();
    } else if (path === '/about' || path === '/about.html') {
      this.addPersonStructuredData();
    } else if (path.startsWith('/artwork/')) {
      const artworkId = path.split('/artwork/')[1];
      this.addArtworkStructuredData(artworkId);
    }
  }

  /**
   * Add website structured data
   */
  addWebsiteStructuredData() {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.siteName,
      description: this.defaultSEO.description,
      url: this.baseUrl,
      author: {
        '@type': 'Person',
        name: this.artistInfo.name,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${this.baseUrl}/gallery?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };

    this.addJSONLD(structuredData);
  }

  /**
   * Add person/artist structured data
   */
  addPersonStructuredData() {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: this.artistInfo.name,
      description: this.artistInfo.description,
      jobTitle: 'Artist',
      url: this.baseUrl,
      sameAs: [
        this.artistInfo.social.facebook,
        this.artistInfo.social.instagram,
        this.artistInfo.social.twitter,
      ],
      worksFor: {
        '@type': 'Organization',
        name: this.siteName,
      },
    };

    this.addJSONLD(structuredData);
  }

  /**
   * Add gallery structured data
   */
  addGalleryStructuredData() {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Art Gallery',
      description: 'Browse original artworks by Evgenia Portnov',
      url: `${this.baseUrl}/gallery`,
      author: {
        '@type': 'Person',
        name: this.artistInfo.name,
      },
      mainEntity: {
        '@type': 'ItemList',
        name: 'Artwork Collection',
        description: 'Original paintings and artworks',
      },
    };

    this.addJSONLD(structuredData);
  }

  /**
   * Add artwork structured data
   */
  async addArtworkStructuredData(artworkId) {
    try {
      const artwork = await this.getArtworkData(artworkId);
      if (!artwork) return;

      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'VisualArtwork',
        name: artwork.title,
        description: artwork.description || `${artwork.title} by ${this.artistInfo.name}`,
        image: artwork.image.startsWith('http')
          ? artwork.image
          : `${this.baseUrl}/${artwork.image}`,
        url: `${this.baseUrl}/artwork/${artworkId}`,
        creator: {
          '@type': 'Person',
          name: this.artistInfo.name,
        },
        artMedium: artwork.medium,
        artworkSurface: 'Canvas',
        width: artwork.dimensions,
        height: artwork.dimensions,
        offers: {
          '@type': 'Offer',
          price: artwork.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      };

      this.addJSONLD(structuredData);
    } catch (error) {
      logger.error(
        'Error adding artwork structured data',
        { module: 'meta-tags', function: 'addArtworkStructuredData' },
        { artworkData: artworkData.title, error: error.message }
      );
    }
  }

  /**
   * Add JSON-LD structured data to page
   */
  addJSONLD(data) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /**
   * Get artwork data
   */
  async getArtworkData(artworkId) {
    try {
      // Try to get from localStorage first
      const cachedData = localStorage.getItem('evgenia-artwork-data');
      if (cachedData) {
        const data = JSON.parse(cachedData);
        return data.artworks.find(artwork => artwork.id === artworkId);
      }

      // Fetch from API
      const response = await fetch('/public/data/artwork-data.json');
      const data = await response.json();
      return data.artworks.find(artwork => artwork.id === artworkId);
    } catch (error) {
      logger.error(
        'Error fetching artwork data',
        { module: 'meta-tags', function: 'fetchArtworkData' },
        { artworkId: artworkId, error: error.message }
      );
      return null;
    }
  }

  /**
   * Update meta tags when artwork data changes
   */
  async updateArtworkMeta(artworkId, artworkData) {
    if (window.location.pathname.includes(`/artwork/${artworkId}`)) {
      await this.setArtworkMetaTags(artworkId);
    }
  }
}

// Initialize meta tags when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const metaTags = new MetaTags();
  metaTags.init();

  // Make available globally
  window.metaTags = metaTags;
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MetaTags;
}

window.MetaTags = MetaTags;
