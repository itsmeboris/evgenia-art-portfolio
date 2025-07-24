// Image Optimizer Module - Comprehensive image optimization and loading
// Handles responsive images, WebP support, and intelligent lazy loading

class ImageOptimizer {
  constructor() {
    this.isInitialized = false;
    this.observer = null;
    this.loadedImages = new Set();
    this.failedImages = new Set();
    this.loadQueue = [];
    this.isProcessingQueue = false;
    this.supportsWebP = false;

    // Configuration
    this.config = {
      rootMargin: '50px',
      threshold: 0.1,
      maxConcurrentLoads: 3,
      retryAttempts: 2,
      retryDelay: 1000,
      qualitySettings: {
        thumbnail: 0.6,
        medium: 0.8,
        high: 0.9,
      },
    };

    // Responsive breakpoints
    this.breakpoints = {
      mobile: 480,
      tablet: 768,
      desktop: 1200,
      large: 1600,
    };

    // Performance tracking
    this.performanceMetrics = {
      totalImages: 0,
      loadedImages: 0,
      failedImages: 0,
      webpSupported: 0,
      averageLoadTime: 0,
      loadTimes: [],
      bandwidthSaved: 0,
    };

    // Bind methods
    this.handleIntersection = this.handleIntersection.bind(this);
    // Note: loadImage method is actually loadOptimizedImage, bind it correctly later
  }

  // Initialize the image optimizer
  async init() {
    if (this.isInitialized) return;

    try {
      // Check WebP support
      await this.detectWebPSupport();

      // Setup Intersection Observer
      this.setupIntersectionObserver();

      // Find and prepare all images
      this.prepareAllImages();

      // Setup performance monitoring
      this.setupPerformanceMonitoring();

      this.isInitialized = true;
      console.log('🖼️ Image Optimizer initialized successfully');
      console.log(`   WebP Support: ${this.supportsWebP ? '✅' : '❌'}`);
      console.log(`   Images found: ${this.performanceMetrics.totalImages}`);
    } catch (error) {
      console.error('Failed to initialize Image Optimizer:', error);
      this.fallbackToBasicLoading();
    }
  }

  // Detect WebP support
  detectWebPSupport() {
    return new Promise(resolve => {
      const webp = new Image();
      webp.onload = webp.onerror = () => {
        this.supportsWebP = webp.height === 2;
        resolve(this.supportsWebP);
      };
      webp.src =
        'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  // Setup Intersection Observer for lazy loading
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, using fallback');
      this.fallbackToBasicLoading();
      return;
    }

    this.observer = new IntersectionObserver(this.handleIntersection, {
      rootMargin: this.config.rootMargin,
      threshold: this.config.threshold,
    });
  }

  // Find and prepare all images for optimization
  prepareAllImages() {
    // Find all images that need optimization
    const images = document.querySelectorAll(
      'img[data-src], img[data-optimize="true"], img:not([data-optimized])'
    );

    images.forEach(img => {
      this.prepareImage(img);
    });

    console.log(`📸 Prepared ${images.length} images for optimization`);
  }

  // Prepare individual image for optimization
  prepareImage(img) {
    // Skip if already processed
    if (img.hasAttribute('data-optimized')) return;

    // Store original source if not already in data-src
    if (img.src && !img.dataset.src) {
      img.dataset.src = img.src;
    }

    // Generate responsive sources
    this.generateResponsiveSources(img);

    // Create placeholder
    if (!img.src || img.src === '') {
      img.src = this.generatePlaceholder(img);
    }

    // Add optimization classes
    img.classList.add('image-optimized', 'loading');

    // Add error handling
    img.addEventListener('error', () => this.handleImageError(img));
    img.addEventListener('load', () => this.handleImageLoad(img));

    // Mark as processed
    img.setAttribute('data-optimized', 'true');

    // Start observing
    if (this.observer) {
      this.observer.observe(img);
    }

    this.performanceMetrics.totalImages++;
  }

  // Generate responsive image sources
  generateResponsiveSources(img) {
    const originalSrc = img.dataset.src || img.src;
    if (!originalSrc) return;

    // Extract path components
    const pathParts = originalSrc.split('/');
    const filename = pathParts.pop();
    const basePath = pathParts.join('/');
    const [name, extension] = filename.split('.');

    // Generate responsive variants
    const responsiveData = {
      small: this.generateImageUrl(basePath, name, extension, 'small'),
      medium: this.generateImageUrl(basePath, name, extension, 'medium'),
      large: this.generateImageUrl(basePath, name, extension, 'large'),
      original: originalSrc,
    };

    // Store responsive data
    img.dataset.responsiveSources = JSON.stringify(responsiveData);

    // Generate srcset if WebP is supported
    if (this.supportsWebP) {
      const webpSources = {
        small: this.generateWebPUrl(basePath, name, 'small'),
        medium: this.generateWebPUrl(basePath, name, 'medium'),
        large: this.generateWebPUrl(basePath, name, 'large'),
      };
      img.dataset.webpSources = JSON.stringify(webpSources);
    }
  }

  // Generate image URL for specific size
  generateImageUrl(basePath, name, extension, size) {
    const sizeMap = {
      small: '_480w',
      medium: '_768w',
      large: '_1200w',
    };

    const suffix = sizeMap[size] || '';
    return `${basePath}/${name}${suffix}.${extension}`;
  }

  // Generate WebP URL
  generateWebPUrl(basePath, name, size) {
    const sizeMap = {
      small: '_480w',
      medium: '_768w',
      large: '_1200w',
    };

    const suffix = sizeMap[size] || '';
    return `${basePath}/${name}${suffix}.webp`;
  }

  // Handle intersection observer callback
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        this.queueImageLoad(img);
        this.observer.unobserve(img);
      }
    });
  }

  // Queue image for loading with concurrency control
  queueImageLoad(img) {
    this.loadQueue.push({
      element: img,
      attempts: 0,
      timestamp: Date.now(),
    });

    if (!this.isProcessingQueue) {
      this.processLoadQueue();
    }
  }

  // Process load queue with concurrency control
  async processLoadQueue() {
    if (this.isProcessingQueue || this.loadQueue.length === 0) return;

    this.isProcessingQueue = true;
    const activeLoads = [];

    while (this.loadQueue.length > 0 || activeLoads.length > 0) {
      // Start new loads up to the limit
      while (activeLoads.length < this.config.maxConcurrentLoads && this.loadQueue.length > 0) {
        const item = this.loadQueue.shift();
        activeLoads.push(this.processLoadItem(item));
      }

      // Wait for at least one to complete
      if (activeLoads.length > 0) {
        try {
          await Promise.race(activeLoads);
        } catch (error) {
          console.warn('Image load error in queue:', error);
        }

        // Remove completed loads
        for (let i = activeLoads.length - 1; i >= 0; i--) {
          const load = activeLoads[i];
          if (load.isSettled || load.status === 'fulfilled' || load.status === 'rejected') {
            activeLoads.splice(i, 1);
          }
        }
      }
    }

    this.isProcessingQueue = false;
  }

  // Process individual load item
  async processLoadItem(item) {
    const { element, attempts } = item;
    const startTime = performance.now();

    try {
      await this.loadOptimizedImage(element);

      // Track performance
      const loadTime = performance.now() - startTime;
      this.trackImageLoad(loadTime);
    } catch (error) {
      if (attempts < this.config.retryAttempts) {
        // Retry with exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, attempts);
        setTimeout(() => {
          item.attempts++;
          this.loadQueue.unshift(item);
          if (!this.isProcessingQueue) {
            this.processLoadQueue();
          }
        }, delay);
      } else {
        console.error('Failed to load after retries:', element, error);
        this.handleImageError(element);
      }
    }
  }

  // Load optimized image with best format and size
  async loadOptimizedImage(img) {
    const bestSource = this.selectBestImageSource(img);

    return new Promise((resolve, reject) => {
      const testImg = new Image();

      testImg.onload = () => {
        // Update the actual image
        img.src = bestSource.url;

        // Update srcset if available
        if (bestSource.srcset) {
          img.srcset = bestSource.srcset;
        }

        // Add loaded state
        img.classList.remove('loading');
        img.classList.add('loaded');

        // Add fade-in effect
        this.addLoadAnimation(img);

        this.loadedImages.add(img);

        // Track WebP usage
        if (bestSource.isWebP) {
          this.performanceMetrics.webpSupported++;
        }

        resolve(img);
      };

      testImg.onerror = () => {
        // Try fallback format
        if (bestSource.fallback) {
          testImg.src = bestSource.fallback;
        } else {
          reject(new Error('Failed to load image'));
        }
      };

      testImg.src = bestSource.url;
    });
  }

  // Select best image source based on device and support
  selectBestImageSource(img) {
    const viewportWidth = window.innerWidth;
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Determine size category
    let sizeCategory = 'large';
    if (viewportWidth <= this.breakpoints.mobile) {
      sizeCategory = 'small';
    } else if (viewportWidth <= this.breakpoints.tablet) {
      sizeCategory = 'medium';
    }

    // Adjust for high DPI displays
    if (devicePixelRatio > 1.5 && sizeCategory !== 'large') {
      const sizeMap = { small: 'medium', medium: 'large' };
      sizeCategory = sizeMap[sizeCategory] || sizeCategory;
    }

    // Get responsive sources
    const responsiveSources = JSON.parse(img.dataset.responsiveSources || '{}');
    const webpSources = JSON.parse(img.dataset.webpSources || '{}');

    // Prefer WebP if supported
    if (this.supportsWebP && webpSources[sizeCategory]) {
      return {
        url: webpSources[sizeCategory],
        fallback: responsiveSources[sizeCategory] || responsiveSources.original,
        isWebP: true,
        srcset: this.generateSrcSet(webpSources, responsiveSources),
      };
    }

    // Fallback to regular format
    return {
      url: responsiveSources[sizeCategory] || responsiveSources.original || img.dataset.src,
      fallback: responsiveSources.original || img.dataset.src,
      isWebP: false,
      srcset: this.generateSrcSet(responsiveSources),
    };
  }

  // Generate srcset attribute
  generateSrcSet(sources, fallbackSources = null) {
    const srcsetParts = [];

    if (sources.small) srcsetParts.push(`${sources.small} 480w`);
    if (sources.medium) srcsetParts.push(`${sources.medium} 768w`);
    if (sources.large) srcsetParts.push(`${sources.large} 1200w`);

    return srcsetParts.length > 0 ? srcsetParts.join(', ') : null;
  }

  // Add loading animation
  addLoadAnimation(img) {
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.3s ease';

    requestAnimationFrame(() => {
      img.style.opacity = '1';
    });
  }

  // Generate placeholder image
  generatePlaceholder(img) {
    const width = img.dataset.width || 400;
    const height = img.dataset.height || 300;

    // Create SVG placeholder with loading animation
    const svg = `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                <rect width="100%" height="100%" fill="#f0f0f0"/>
                <rect x="20%" y="40%" width="60%" height="20%" fill="#e0e0e0" rx="4">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite"/>
                </rect>
                <circle cx="50%" cy="30%" r="8%" fill="#d0d0d0">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" begin="0.3s"/>
                </circle>
            </svg>
        `)}`;

    return svg;
  }

  // Handle image loading success
  handleImageLoad(img) {
    this.performanceMetrics.loadedImages++;
    img.classList.remove('image-loading', 'loading');
    img.classList.add('image-loaded', 'loaded');
  }

  // Handle image loading error
  handleImageError(img) {
    this.failedImages.add(img);
    this.performanceMetrics.failedImages++;

    // Try fallback image
    const fallbackSrc = img.dataset.fallback || img.dataset.src || this.generateErrorPlaceholder();
    if (img.src !== fallbackSrc) {
      img.src = fallbackSrc;
    } else {
      // Show error placeholder
      img.src = this.generateErrorPlaceholder();
    }

    img.classList.remove('loading');
    img.classList.add('error');

    console.warn('Failed to load image:', img.dataset.src || img.src);
  }

  // Generate error placeholder
  generateErrorPlaceholder() {
    const svg = `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
                <rect width="100%" height="100%" fill="#f5f5f5"/>
                <path d="M200 100 L120 180 L280 180 Z" fill="#ddd"/>
                <circle cx="200" cy="150" r="30" fill="#ccc"/>
                <text x="200" y="250" text-anchor="middle" font-family="Arial" font-size="14" fill="#999">
                    Image not available
                </text>
            </svg>
        `)}`;

    return svg;
  }

  // Track image load performance
  trackImageLoad(loadTime) {
    this.performanceMetrics.loadTimes.push(loadTime);
    this.performanceMetrics.averageLoadTime =
      this.performanceMetrics.loadTimes.reduce((a, b) => a + b, 0) /
      this.performanceMetrics.loadTimes.length;
  }

  // Setup performance monitoring
  setupPerformanceMonitoring() {
    // Report metrics every 30 seconds
    setInterval(() => {
      this.reportPerformanceMetrics();
    }, 30000);

    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.reportPerformanceMetrics();
    });
  }

  // Report performance metrics
  reportPerformanceMetrics() {
    if (this.performanceMetrics.totalImages === 0) return;

    const metrics = {
      ...this.performanceMetrics,
      loadSuccessRate:
        (this.performanceMetrics.loadedImages / this.performanceMetrics.totalImages) * 100,
      webpUsageRate: this.supportsWebP
        ? (this.performanceMetrics.webpSupported / this.performanceMetrics.loadedImages) * 100
        : 0,
    };

    console.log('📊 Image Optimization Metrics:', metrics);

    // Send to analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'image_optimization_metrics', {
        custom_parameter: JSON.stringify(metrics),
      });
    }
  }

  // Fallback to basic loading if optimization fails
  fallbackToBasicLoading() {
    console.warn('🔄 Falling back to basic image loading');

    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.classList.add('loaded');
      }
    });
  }

  // Load all images immediately (emergency fallback)
  loadAllImagesImmediately() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });

    console.log(`📷 Loaded ${images.length} images immediately (emergency fallback)`);
  }

  // Public API for manually optimizing images
  optimizeImage(img) {
    if (img && !img.hasAttribute('data-optimized')) {
      this.prepareImage(img);
    }
  }

  // Get performance report
  getPerformanceReport() {
    const total = this.performanceMetrics.totalImages;
    const loaded = this.performanceMetrics.loadedImages;
    const failed = this.performanceMetrics.failedImages;

    return {
      ...this.performanceMetrics,
      loadSuccessRate: total > 0 ? ((loaded / total) * 100).toFixed(1) + '%' : '0%',
      webpUsageRate:
        this.supportsWebP && loaded > 0
          ? ((this.performanceMetrics.webpSupported / loaded) * 100).toFixed(1) + '%'
          : '0%',
      averageLoadTime: this.performanceMetrics.averageLoadTime.toFixed(2) + 'ms',
    };
  }

  // Destroy the optimizer
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.loadQueue = [];
    this.loadedImages.clear();
    this.failedImages.clear();
    this.isInitialized = false;

    console.log('🗑️ Image Optimizer destroyed');
  }
}

// Export for use in other modules
window.ImageOptimizer = ImageOptimizer;
