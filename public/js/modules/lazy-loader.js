// Lazy Loader Module - Advanced lazy loading for images and content
// Provides performance optimization through intelligent content loading

class LazyLoader {
  constructor() {
    this.isInitialized = false;
    this.observer = null;
    this.loadedImages = new Set();
    this.failedImages = new Set();
    this.loadQueue = [];
    this.isProcessingQueue = false;

    // Configuration
    this.config = {
      rootMargin: '50px',
      threshold: 0.1,
      maxConcurrentLoads: 3,
      retryAttempts: 2,
      retryDelay: 1000,
      placeholderQuality: 0.1,
    };

    // Performance tracking
    this.performanceMetrics = {
      totalImages: 0,
      loadedImages: 0,
      failedImages: 0,
      averageLoadTime: 0,
      loadTimes: [],
    };

    // Bind methods
    this.handleIntersection = this.handleIntersection.bind(this);
    this.loadImage = this.loadImage.bind(this);
  }

  // Initialize lazy loading system
  init() {
    if (this.isInitialized) {
      console.warn('Lazy loader already initialized');
      return;
    }

    try {
      if (!('IntersectionObserver' in window)) {
        console.warn('IntersectionObserver not supported, falling back to immediate loading');
        this.loadAllImagesImmediately();
        return;
      }

      this.setupIntersectionObserver();
      this.setupImages();
      this.setupContentLazyLoading();
      this.isInitialized = true;

      console.log('Lazy loader initialized successfully');
    } catch (error) {
      console.error('Failed to initialize lazy loader:', error);
    }
  }

  // Setup intersection observer
  setupIntersectionObserver() {
    this.observer = new IntersectionObserver(this.handleIntersection, {
      rootMargin: this.config.rootMargin,
      threshold: this.config.threshold,
    });
  }

  // Setup lazy loading for images
  setupImages() {
    const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');

    images.forEach(img => {
      this.prepareImageForLazyLoading(img);
      this.observer.observe(img);
      this.performanceMetrics.totalImages++;
    });

    console.log(`📷 Setup lazy loading for ${images.length} images`);
  }

  // Prepare image for lazy loading
  prepareImageForLazyLoading(img) {
    // Store original src
    if (img.src && !img.dataset.src) {
      img.dataset.src = img.src;
    }

    // Generate placeholder if needed
    if (!img.src || img.src === '') {
      img.src = this.generatePlaceholder(img);
    }

    // Add loading class
    img.classList.add('lazy-loading');

    // Add error handling
    img.addEventListener('error', () => {
      this.handleImageError(img);
    });

    img.addEventListener('load', () => {
      this.handleImageLoad(img);
    });
  }

  // Handle intersection observer callback
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;

        if (element.tagName === 'IMG') {
          this.queueImageLoad(element);
        } else {
          this.loadContent(element);
        }

        this.observer.unobserve(element);
      }
    });
  }

  // Queue image for loading with concurrency control
  queueImageLoad(img) {
    this.loadQueue.push({
      element: img,
      type: 'image',
      attempts: 0,
      timestamp: Date.now(),
    });

    if (!this.isProcessingQueue) {
      this.processLoadQueue();
    }
  }

  // Process load queue with concurrency control
  async processLoadQueue() {
    if (this.isProcessingQueue || this.loadQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const concurrent = [];

    while (this.loadQueue.length > 0 && concurrent.length < this.config.maxConcurrentLoads) {
      const item = this.loadQueue.shift();
      concurrent.push(this.processLoadItem(item));
    }

    await Promise.all(concurrent);
    this.isProcessingQueue = false;

    // Process remaining items
    if (this.loadQueue.length > 0) {
      setTimeout(() => this.processLoadQueue(), 10);
    }
  }

  // Process individual load item
  async processLoadItem(item) {
    const { element, type, attempts } = item;
    const startTime = performance.now();

    try {
      if (type === 'image') {
        await this.loadImage(element);

        // Track performance
        const loadTime = performance.now() - startTime;
        this.trackImageLoad(loadTime);
      }
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

  // Load individual image
  loadImage(img) {
    return new Promise((resolve, reject) => {
      if (!img.dataset.src) {
        reject(new Error('No data-src attribute'));
        return;
      }

      const newImg = new Image();

      newImg.onload = () => {
        img.src = img.dataset.src;
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-loaded');

        // Add fade-in effect
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';

        requestAnimationFrame(() => {
          img.style.opacity = '1';
        });

        this.loadedImages.add(img);
        resolve(img);
      };

      newImg.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      newImg.src = img.dataset.src;
    });
  }

  // Handle image load success
  handleImageLoad(img) {
    this.performanceMetrics.loadedImages++;

    // Dispatch event
    window.dispatchEvent(
      new CustomEvent('image-lazy-loaded', {
        detail: { image: img, src: img.src },
      })
    );
  }

  // Handle image load error
  handleImageError(img) {
    this.failedImages.add(img);
    this.performanceMetrics.failedImages++;

    // Set fallback image
    const fallbackSrc = img.dataset.fallback || this.generateErrorPlaceholder();
    if (img.src !== fallbackSrc) {
      img.src = fallbackSrc;
    }

    img.classList.remove('lazy-loading');
    img.classList.add('lazy-error');

    console.warn('Failed to load image:', img.dataset.src || img.src);
  }

  // Track image load performance
  trackImageLoad(loadTime) {
    this.performanceMetrics.loadTimes.push(loadTime);

    // Keep only last 100 load times
    if (this.performanceMetrics.loadTimes.length > 100) {
      this.performanceMetrics.loadTimes = this.performanceMetrics.loadTimes.slice(-100);
    }

    // Update average
    const total = this.performanceMetrics.loadTimes.reduce((a, b) => a + b, 0);
    this.performanceMetrics.averageLoadTime = total / this.performanceMetrics.loadTimes.length;
  }

  // Generate placeholder image
  generatePlaceholder(img) {
    const width = img.getAttribute('width') || img.offsetWidth || 300;
    const height = img.getAttribute('height') || img.offsetHeight || 200;

    // Generate a simple SVG placeholder
    const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#f0f0f0;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#e0e0e0;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grad)"/>
                <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                      fill="#999" font-family="Arial, sans-serif" font-size="14">
                    Loading...
                </text>
            </svg>
        `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  // Generate error placeholder
  generateErrorPlaceholder() {
    const svg = `
            <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f5f5f5" stroke="#ddd" stroke-width="2"/>
                <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                      fill="#999" font-family="Arial, sans-serif" font-size="14">
                    Image unavailable
                </text>
            </svg>
        `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  // Setup content lazy loading
  setupContentLazyLoading() {
    const lazyContent = document.querySelectorAll('[data-lazy-content]');

    lazyContent.forEach(element => {
      this.observer.observe(element);
    });

    console.log(`📄 Setup lazy loading for ${lazyContent.length} content elements`);
  }

  // Load lazy content
  loadContent(element) {
    const contentUrl = element.dataset.lazyContent;

    if (!contentUrl) return;

    element.classList.add('lazy-loading');

    fetch(contentUrl)
      .then(response => response.text())
      .then(html => {
        element.innerHTML = html;
        element.classList.remove('lazy-loading');
        element.classList.add('lazy-loaded');

        // Setup lazy loading for any new images in the content
        const newImages = element.querySelectorAll('img[data-src]');
        newImages.forEach(img => {
          this.prepareImageForLazyLoading(img);
          this.observer.observe(img);
        });
      })
      .catch(error => {
        console.error('Failed to load content:', contentUrl, error);
        element.classList.remove('lazy-loading');
        element.classList.add('lazy-error');
        element.innerHTML = '<p>Failed to load content</p>';
      });
  }

  // Load all images immediately (fallback)
  loadAllImagesImmediately() {
    const images = document.querySelectorAll('img[data-src]');

    images.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });

    console.log(`📷 Loaded ${images.length} images immediately (fallback mode)`);
  }

  // Refresh lazy loading for new content
  refresh() {
    // Setup lazy loading for new images
    const newImages = document.querySelectorAll(
      'img[data-src]:not(.lazy-loading):not(.lazy-loaded)'
    );

    newImages.forEach(img => {
      this.prepareImageForLazyLoading(img);
      this.observer.observe(img);
      this.performanceMetrics.totalImages++;
    });

    // Setup lazy loading for new content
    const newContent = document.querySelectorAll(
      '[data-lazy-content]:not(.lazy-loading):not(.lazy-loaded)'
    );

    newContent.forEach(element => {
      this.observer.observe(element);
    });

    if (newImages.length > 0 || newContent.length > 0) {
      console.log(
        `🔄 Refreshed lazy loading: ${newImages.length} images, ${newContent.length} content elements`
      );
    }
  }

  // Get performance report
  getPerformanceReport() {
    return {
      ...this.performanceMetrics,
      successRate:
        this.performanceMetrics.totalImages > 0
          ? (
              (this.performanceMetrics.loadedImages / this.performanceMetrics.totalImages) *
              100
            ).toFixed(2) + '%'
          : '0%',
      queueSize: this.loadQueue.length,
      isProcessing: this.isProcessingQueue,
    };
  }

  // Cleanup resources
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.loadQueue = [];
    this.isProcessingQueue = false;

    console.log('🧹 Lazy loader cleaned up');
  }
}

// Create and initialize lazy loader
const lazyLoader = new LazyLoader();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => lazyLoader.init());
} else {
  lazyLoader.init();
}

// Make lazy loader globally accessible
window.lazyLoader = lazyLoader;
