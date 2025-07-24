// Lightweight Image Optimization Utilities
// Simple, practical WebP support and responsive images without performance overhead

class ImageUtils {
  constructor() {
    this.supportsWebP = false;
    this.isInitialized = false;
    this.init();
  }

  // Simple initialization
  async init() {
    if (this.isInitialized) return;

    // Test WebP support
    this.supportsWebP = await this.detectWebPSupport();

    // Process existing images
    this.processAllImages();

    console.log(`📸 Image Utils initialized - WebP supported: ${this.supportsWebP}`);
    this.isInitialized = true;
  }

  // Detect WebP support using a more reliable method
  detectWebPSupport() {
    return new Promise(resolve => {
      // Method 1: Check if canvas can export WebP
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        if (webpSupport) {
          resolve(true);
          return;
        }
      } catch (e) {
        // Canvas method failed, try image method
      }

      // Method 2: Try loading a tiny WebP image (fallback)
      const webP = new Image();
      webP.onload = () => {
        resolve(webP.height === 2 && webP.width === 2);
      };
      webP.onerror = () => {
        resolve(false);
      };
      // Tiny 2x2 WebP image
      webP.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==';

      // Timeout after 1 second
      setTimeout(() => resolve(false), 1000);
    });
  }

  // Process all existing images on the page
  processAllImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => this.optimizeImage(img));
  }

  // Optimize a single image with WebP support and responsive sources
  optimizeImage(img) {
    // Skip if already optimized
    if (img.hasAttribute('data-optimized')) return;

    const originalSrc = img.src || img.dataset.src;
    if (!originalSrc) return;

    // Create responsive sources
    const sources = this.generateResponsiveSources(originalSrc);

    // Add WebP source if supported
    if (this.supportsWebP && sources.webp) {
      // Create picture element for WebP with fallback
      this.wrapWithPicture(img, sources);
    } else {
      // Just add responsive srcset for regular images
      this.addResponsiveSrcSet(img, sources);
    }

    // Mark as optimized
    img.setAttribute('data-optimized', 'true');
  }

  // Generate responsive image sources
  generateResponsiveSources(originalSrc) {
    const sources = {
      original: originalSrc,
      srcset: [],
      webp: null,
    };

    // For artwork images, create different sizes
    if (originalSrc.includes('/artwork/')) {
      const basePath = originalSrc.replace(/\.[^.]+$/, ''); // Remove extension
      const extension = originalSrc.split('.').pop();

      // Generate srcset for different screen sizes
      sources.srcset = [
        `${originalSrc} 1x`, // Original size
        // For high DPI displays, we'd add 2x versions if they existed
      ];

      // Generate WebP path (we'll create these later)
      if (extension !== 'webp') {
        sources.webp = `${basePath}.webp`;
      }
    }

    return sources;
  }

  // Wrap image with picture element for WebP support
  wrapWithPicture(img, sources) {
    // Skip if already wrapped
    if (img.parentElement.tagName === 'PICTURE') return;

    const picture = document.createElement('picture');

    // Add WebP source
    if (sources.webp) {
      const webpSource = document.createElement('source');
      webpSource.srcset = sources.webp;
      webpSource.type = 'image/webp';
      picture.appendChild(webpSource);
    }

    // Add fallback source
    const fallbackSource = document.createElement('source');
    fallbackSource.srcset = sources.original;
    fallbackSource.type = `image/${this.getImageType(sources.original)}`;
    picture.appendChild(fallbackSource);

    // Insert picture before img and move img inside
    img.parentNode.insertBefore(picture, img);
    picture.appendChild(img);
  }

  // Add responsive srcset to existing image
  addResponsiveSrcSet(img, sources) {
    if (sources.srcset && sources.srcset.length > 0) {
      img.srcset = sources.srcset.join(', ');
    }
  }

  // Get image MIME type from file extension
  getImageType(src) {
    const extension = src.split('.').pop().toLowerCase();
    const typeMap = {
      jpg: 'jpeg',
      jpeg: 'jpeg',
      png: 'png',
      gif: 'gif',
      webp: 'webp',
    };
    return typeMap[extension] || 'jpeg';
  }

  // Convert image path to WebP version
  getWebPPath(originalPath) {
    return originalPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }

  // Check if WebP version exists (simplified check)
  async checkWebPExists(webpPath) {
    try {
      const response = await fetch(webpPath, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Optimize new images added to DOM
  observeNewImages() {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            // Element node
            if (node.tagName === 'IMG') {
              this.optimizeImage(node);
            } else {
              const images = node.querySelectorAll && node.querySelectorAll('img');
              if (images) {
                images.forEach(img => this.optimizeImage(img));
              }
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return observer;
  }

  // Lazy load image with WebP support
  lazyLoadWithWebP(img) {
    return new Promise((resolve, reject) => {
      if (!img.dataset.src) {
        reject(new Error('No data-src attribute'));
        return;
      }

      const sources = this.generateResponsiveSources(img.dataset.src);

      // Try WebP first if supported
      const imagesToTry = [];
      if (this.supportsWebP && sources.webp) {
        imagesToTry.push(sources.webp);
      }
      imagesToTry.push(sources.original);

      this.tryLoadImages(imagesToTry)
        .then(loadedSrc => {
          img.src = loadedSrc;
          img.classList.remove('loading');
          img.classList.add('loaded');
          resolve(img);
        })
        .catch(reject);
    });
  }

  // Try loading images in order of preference
  async tryLoadImages(imagePaths) {
    for (const path of imagePaths) {
      try {
        await this.loadImage(path);
        return path;
      } catch {
        continue; // Try next image
      }
    }
    throw new Error('All image formats failed to load');
  }

  // Load single image
  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = reject;
      img.src = src;
    });
  }

  // Get performance metrics
  getStats() {
    const images = document.querySelectorAll('img[data-optimized]');
    const webpImages = document.querySelectorAll('picture source[type="image/webp"]');

    return {
      totalOptimized: images.length,
      webpSupported: this.supportsWebP,
      webpImagesUsed: webpImages.length,
      estimatedSavings: webpImages.length * 0.25, // Estimate 25% smaller
    };
  }
}

// Create global instance
window.imageUtils = new ImageUtils();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.imageUtils.init();
  });
} else {
  window.imageUtils.init();
}
