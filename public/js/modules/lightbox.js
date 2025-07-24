// Lightbox Module - Handles image viewing functionality
// Optimized with accessibility, keyboard navigation, and performance improvements

class LightboxManager {
    constructor() {
        this.isInitialized = false;
        this.isOpen = false;
        this.currentImage = null;
        this.imageCache = new Map();
        this.preloadQueue = new Set();

        // DOM elements
        this.overlay = null;
        this.imageElement = null;
        this.closeButton = null;
        this.prevButton = null;
        this.nextButton = null;
        this.captionElement = null;
        this.counterElement = null;

        // Gallery data
        this.galleryImages = [];
        this.currentIndex = 0;

        // Settings
        this.preloadCount = 2; // Number of images to preload in each direction
        this.animationDuration = 300;

        // Bind methods
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleWheel = this.handleWheel.bind(this);
        this.handleResize = this.debounce(this.handleResize.bind(this), 250);
    }

    // Initialize the lightbox system
    init() {
        if (this.isInitialized) {
            console.warn('Lightbox manager already initialized');
            return;
        }

        try {
            this.createLightboxDOM();
            this.setupEventListeners();
            this.initializeImageObserver();
            this.isInitialized = true;

            console.log('Lightbox manager initialized successfully');
        } catch (error) {
            console.error('Error initializing lightbox manager:', error);
        }
    }

    // Create lightbox DOM elements
    createLightboxDOM() {
        // Check if lightbox already exists
        if (document.querySelector('.lightbox-overlay')) {
            this.setupExistingLightbox();
            return;
        }

        // Create lightbox structure
        this.overlay = document.createElement('div');
        this.overlay.className = 'lightbox-overlay';
        this.overlay.setAttribute('role', 'dialog');
        this.overlay.setAttribute('aria-modal', 'true');
        this.overlay.setAttribute('aria-labelledby', 'lightbox-caption');
        this.overlay.style.display = 'none'; // Use display instead of aria-hidden

        // Image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'lightbox-container';

        // Image element
        this.imageElement = document.createElement('img');
        this.imageElement.className = 'lightbox-image';
        this.imageElement.setAttribute('alt', '');
        this.imageElement.setAttribute('draggable', 'false');

        // Loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'lightbox-loading';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <span class="loading-text">Loading...</span>
        `;

        // Navigation buttons
        this.prevButton = document.createElement('button');
        this.prevButton.className = 'lightbox-nav lightbox-prev';
        this.prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        this.prevButton.setAttribute('aria-label', 'Previous image');
        this.prevButton.style.display = 'none';

        this.nextButton = document.createElement('button');
        this.nextButton.className = 'lightbox-nav lightbox-next';
        this.nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        this.nextButton.setAttribute('aria-label', 'Next image');
        this.nextButton.style.display = 'none';

        // Close button
        this.closeButton = document.createElement('button');
        this.closeButton.className = 'lightbox-close';
        this.closeButton.innerHTML = '<i class="fas fa-times"></i>';
        this.closeButton.setAttribute('aria-label', 'Close lightbox');

        // Caption
        this.captionElement = document.createElement('div');
        this.captionElement.className = 'lightbox-caption';
        this.captionElement.setAttribute('id', 'lightbox-caption');

        // Counter
        this.counterElement = document.createElement('div');
        this.counterElement.className = 'lightbox-counter';

        // Assemble the lightbox
        imageContainer.appendChild(loadingIndicator);
        imageContainer.appendChild(this.imageElement);
        imageContainer.appendChild(this.prevButton);
        imageContainer.appendChild(this.nextButton);

        this.overlay.appendChild(imageContainer);
        this.overlay.appendChild(this.closeButton);
        this.overlay.appendChild(this.captionElement);
        this.overlay.appendChild(this.counterElement);

        // Add styles
        this.addLightboxStyles();

        // Add to DOM
        document.body.appendChild(this.overlay);
    }

    // Setup existing lightbox elements
    setupExistingLightbox() {
        this.overlay = document.querySelector('.lightbox-overlay');
        this.imageElement = document.querySelector('.lightbox-image');
        this.closeButton = document.querySelector('.lightbox-close');

        // Enhance existing lightbox with missing features
        this.enhanceExistingLightbox();
    }

    // Enhance existing lightbox with additional features
    enhanceExistingLightbox() {
        if (!this.overlay) return;

        // Add accessibility attributes
        this.overlay.setAttribute('role', 'dialog');
        this.overlay.setAttribute('aria-modal', 'true');
        this.overlay.style.display = 'none'; // Use display instead of aria-hidden

        // Add navigation if not present
        if (!this.overlay.querySelector('.lightbox-nav')) {
            this.addNavigationToExisting();
        }

        // Add caption if not present
        if (!this.captionElement) {
            this.captionElement = document.createElement('div');
            this.captionElement.className = 'lightbox-caption';
            this.captionElement.setAttribute('id', 'lightbox-caption');
            this.overlay.appendChild(this.captionElement);
        }
    }

    // Add navigation to existing lightbox
    addNavigationToExisting() {
        const container = this.overlay.querySelector('.lightbox-container') || this.overlay;

        this.prevButton = document.createElement('button');
        this.prevButton.className = 'lightbox-nav lightbox-prev';
        this.prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        this.prevButton.setAttribute('aria-label', 'Previous image');
        this.prevButton.style.display = 'none';

        this.nextButton = document.createElement('button');
        this.nextButton.className = 'lightbox-nav lightbox-next';
        this.nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        this.nextButton.setAttribute('aria-label', 'Next image');
        this.nextButton.style.display = 'none';

        container.appendChild(this.prevButton);
        container.appendChild(this.nextButton);
    }

    // Add lightbox styles
    addLightboxStyles() {
        if (document.getElementById('lightbox-styles')) return;

        const style = document.createElement('style');
        style.id = 'lightbox-styles';
        style.textContent = `
            .lightbox-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: opacity ${this.animationDuration}ms ease, visibility ${this.animationDuration}ms ease;
            }

            .lightbox-overlay.active {
                opacity: 1;
                visibility: visible;
            }

            .lightbox-container {
                position: relative;
                max-width: 90vw;
                max-height: 90vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .lightbox-image {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                border-radius: 4px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                transform: scale(0.9);
                transition: transform ${this.animationDuration}ms ease;
            }

            .lightbox-overlay.active .lightbox-image {
                transform: scale(1);
            }

            .lightbox-loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                color: white;
                z-index: 1;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-top: 3px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 10px;
            }

            .loading-text {
                font-size: 14px;
                opacity: 0.8;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .lightbox-nav {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: white;
                font-size: 24px;
                padding: 15px;
                cursor: pointer;
                border-radius: 50%;
                transition: all 0.2s ease;
                z-index: 2;
                backdrop-filter: blur(10px);
            }

            .lightbox-nav:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-50%) scale(1.1);
            }

            .lightbox-nav:focus {
                outline: 2px solid white;
                outline-offset: 2px;
            }

            .lightbox-prev {
                left: 20px;
            }

            .lightbox-next {
                right: 20px;
            }

            .lightbox-close {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: white;
                font-size: 24px;
                padding: 15px;
                cursor: pointer;
                border-radius: 50%;
                transition: all 0.2s ease;
                backdrop-filter: blur(10px);
            }

            .lightbox-close:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.1);
            }

            .lightbox-close:focus {
                outline: 2px solid white;
                outline-offset: 2px;
            }

            .lightbox-caption {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                font-size: 14px;
                text-align: center;
                max-width: 80%;
                backdrop-filter: blur(10px);
            }

            .lightbox-counter {
                position: absolute;
                top: 20px;
                left: 20px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                backdrop-filter: blur(10px);
            }

            @media (max-width: 768px) {
                .lightbox-nav {
                    padding: 12px;
                    font-size: 20px;
                }

                .lightbox-close {
                    padding: 12px;
                    font-size: 20px;
                }

                .lightbox-caption {
                    font-size: 12px;
                    padding: 8px 16px;
                    bottom: 10px;
                }

                .lightbox-counter {
                    font-size: 10px;
                    padding: 6px 10px;
                    top: 10px;
                    left: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Setup event listeners
    setupEventListeners() {
        if (!this.overlay) return;

        // Close button
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.close());
        }

        // Navigation buttons
        if (this.prevButton) {
            this.prevButton.addEventListener('click', () => this.previous());
        }
        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => this.next());
        }

        // Overlay click to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // Window resize
        window.addEventListener('resize', this.handleResize);

        // Initialize artwork images
        this.initArtworkImages();
    }

    // Initialize artwork images for lightbox
    initArtworkImages() {
        // Only attach lightbox to images that are specifically meant for lightbox viewing
        // Gallery grid images (.artwork-image img inside links) should navigate to detail pages, not open lightbox
        const lightboxImages = document.querySelectorAll(
            '.artwork-detail-image, ' +           // Artwork detail page images
            '.lightbox-trigger, ' +               // Images explicitly marked for lightbox
            'img[data-lightbox="true"]'           // Images with explicit lightbox data attribute
        );

        lightboxImages.forEach((img, index) => {
            if (!img.hasAttribute('data-lightbox-initialized')) {
                // Only add lightbox if the image is not inside a link that navigates elsewhere
                const parentLink = img.closest('a[href*="/artwork/"]');
                if (!parentLink) {
                    img.style.cursor = 'zoom-in';
                    img.setAttribute('data-lightbox-initialized', 'true');
                    img.setAttribute('data-lightbox-index', index.toString());

                    img.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.openImage(img.src, img.alt, index);
                    });
                }
            }
        });

        // Update gallery images array
        this.updateGalleryImages();
    }

    // Update gallery images array
    updateGalleryImages() {
        // Only include images that are meant for lightbox viewing
        const lightboxImages = document.querySelectorAll(
            '.artwork-detail-image, ' +
            '.lightbox-trigger, ' +
            'img[data-lightbox="true"]'
        );

        this.galleryImages = Array.from(lightboxImages)
            .filter(img => !img.closest('a[href*="/artwork/"]')) // Exclude images inside artwork links
            .map(img => ({
                src: img.src,
                alt: img.alt || '',
                title: img.getAttribute('title') || img.alt || 'Artwork'
            }));
    }

    // Initialize intersection observer for lazy loading optimization
    initializeImageObserver() {
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.preloadImage(img.src);
                    }
                });
            }, { rootMargin: '50px' });

            // Observe only lightbox images for preloading
            const lightboxImages = document.querySelectorAll(
                '.artwork-detail-image, ' +
                '.lightbox-trigger, ' +
                'img[data-lightbox="true"]'
            );
            lightboxImages.forEach(img => {
                if (!img.closest('a[href*="/artwork/"]')) {
                    this.imageObserver.observe(img);
                }
            });
        }
    }

    // Open lightbox with specific image
    openImage(src, alt = '', index = 0) {
        if (!this.overlay) return;

        this.isOpen = true;
        this.currentIndex = index;
        this.currentImage = { src, alt };

        // Update gallery images
        this.updateGalleryImages();

        // Show overlay
        this.overlay.style.display = 'flex';
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Set image
        this.setImage(src, alt);

        // Update navigation
        this.updateNavigation();

        // Update counter
        this.updateCounter();

        // Preload adjacent images
        this.preloadAdjacentImages();

        // Add keyboard listeners
        document.addEventListener('keydown', this.handleKeydown);
        document.addEventListener('wheel', this.handleWheel, { passive: false });

        // Focus management
        this.closeButton?.focus();

        // Dispatch event
        document.dispatchEvent(new CustomEvent('lightbox-opened', { detail: { src, alt, index } }));
    }

    // Set the current image
    setImage(src, alt = '') {
        if (!this.imageElement) return;

        // Show loading state
        this.showLoading();

        // Load image
        this.loadImage(src).then((img) => {
            this.imageElement.src = src;
            this.imageElement.alt = alt;
            this.hideLoading();

            // Update caption
            this.updateCaption(alt);

            // Cache the image
            this.imageCache.set(src, img);
        }).catch((error) => {
            console.error('Error loading lightbox image:', error);
            this.hideLoading();
            this.showError();
        });
    }

    // Load image with promise
    loadImage(src) {
        return new Promise((resolve, reject) => {
            // Check cache first
            if (this.imageCache.has(src)) {
                resolve(this.imageCache.get(src));
                return;
            }

            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }

    // Preload image
    preloadImage(src) {
        if (!this.imageCache.has(src) && !this.preloadQueue.has(src)) {
            this.preloadQueue.add(src);
            this.loadImage(src).then(() => {
                this.preloadQueue.delete(src);
            }).catch(() => {
                this.preloadQueue.delete(src);
            });
        }
    }

    // Preload adjacent images
    preloadAdjacentImages() {
        const total = this.galleryImages.length;
        if (total <= 1) return;

        for (let i = 1; i <= this.preloadCount; i++) {
            // Preload next images
            const nextIndex = (this.currentIndex + i) % total;
            if (this.galleryImages[nextIndex]) {
                this.preloadImage(this.galleryImages[nextIndex].src);
            }

            // Preload previous images
            const prevIndex = (this.currentIndex - i + total) % total;
            if (this.galleryImages[prevIndex]) {
                this.preloadImage(this.galleryImages[prevIndex].src);
            }
        }
    }

    // Navigate to next image
    next() {
        if (this.galleryImages.length <= 1) return;

        this.currentIndex = (this.currentIndex + 1) % this.galleryImages.length;
        const nextImage = this.galleryImages[this.currentIndex];

        if (nextImage) {
            this.setImage(nextImage.src, nextImage.alt);
            this.updateNavigation();
            this.updateCounter();
            this.preloadAdjacentImages();
        }
    }

    // Navigate to previous image
    previous() {
        if (this.galleryImages.length <= 1) return;

        this.currentIndex = (this.currentIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
        const prevImage = this.galleryImages[this.currentIndex];

        if (prevImage) {
            this.setImage(prevImage.src, prevImage.alt);
            this.updateNavigation();
            this.updateCounter();
            this.preloadAdjacentImages();
        }
    }

    // Update navigation button visibility
    updateNavigation() {
        const hasMultipleImages = this.galleryImages.length > 1;

        if (this.prevButton) {
            this.prevButton.style.display = hasMultipleImages ? 'block' : 'none';
        }
        if (this.nextButton) {
            this.nextButton.style.display = hasMultipleImages ? 'block' : 'none';
        }
    }

    // Update counter
    updateCounter() {
        if (!this.counterElement) return;

        if (this.galleryImages.length > 1) {
            this.counterElement.textContent = `${this.currentIndex + 1} of ${this.galleryImages.length}`;
            this.counterElement.style.display = 'block';
        } else {
            this.counterElement.style.display = 'none';
        }
    }

    // Update caption
    updateCaption(text) {
        if (!this.captionElement) return;

        if (text && text.trim()) {
            this.captionElement.textContent = text;
            this.captionElement.style.display = 'block';
        } else {
            this.captionElement.style.display = 'none';
        }
    }

    // Show loading state
    showLoading() {
        const loading = this.overlay?.querySelector('.lightbox-loading');
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    // Hide loading state
    hideLoading() {
        const loading = this.overlay?.querySelector('.lightbox-loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    // Show error state
    showError() {
        if (this.captionElement) {
            this.captionElement.textContent = 'Error loading image';
            this.captionElement.style.display = 'block';
        }
    }

    // Close lightbox
    close() {
        if (!this.isOpen || !this.overlay) return;

        this.isOpen = false;
        this.overlay.classList.remove('active');
        this.overlay.style.display = 'none'; // Use display instead of aria-hidden
        document.body.style.overflow = '';

        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeydown);
        document.removeEventListener('wheel', this.handleWheel);

        // Dispatch event
        document.dispatchEvent(new CustomEvent('lightbox-closed'));
        document.dispatchEvent(new CustomEvent('modal-closed')); // For focus management
    }

    // Handle keyboard events
    handleKeydown(e) {
        if (!this.isOpen) return;

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                this.close();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previous();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.next();
                break;
            case ' ':
            case 'Enter':
                if (e.target === this.overlay) {
                    e.preventDefault();
                    this.close();
                }
                break;
        }
    }

    // Handle wheel events for zoom (future enhancement)
    handleWheel(e) {
        if (!this.isOpen) return;

        // Prevent page scroll while lightbox is open
        e.preventDefault();

        // Future: implement zoom functionality
    }

    // Handle window resize
    handleResize() {
        if (!this.isOpen || !this.imageElement) return;

        // Recalculate image dimensions
        // The CSS handles most of this, but we could add custom logic here
    }

    // Debounce utility
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Public method to refresh gallery images (called when new images are added)
    refreshGallery() {
        this.initArtworkImages();
    }

    // Public method to open lightbox (for external use)
    open(src, alt = '', index = 0) {
        this.openImage(src, alt, index);
    }

    // Clean up resources
    destroy() {
        if (this.imageObserver) {
            this.imageObserver.disconnect();
        }

        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('keydown', this.handleKeydown);
        document.removeEventListener('wheel', this.handleWheel);

        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }

        this.imageCache.clear();
        this.preloadQueue.clear();
        this.isInitialized = false;
    }
}

// Create global instance
const lightboxManager = new LightboxManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        lightboxManager.init();
    });
} else {
    lightboxManager.init();
}

// Export for use in other modules
// Make lightbox manager globally accessible
window.lightboxManager = lightboxManager;