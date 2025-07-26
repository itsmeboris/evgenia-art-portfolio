/**
 * Skeleton Loading Utilities
 * Provides methods to show/hide loading skeletons for better UX
 */

class SkeletonLoader {
  constructor() {
    this.activeSkeletons = new Set();
  }

  /**
   * Create a skeleton element with specified type and count
   * @param {string} type - Type of skeleton (gallery, artwork-detail, featured, etc.)
   * @param {number} count - Number of skeleton items to create
   * @param {Object} options - Additional options
   * @returns {HTMLElement} - Container with skeleton elements
   */
  createSkeleton(type, count = 1, options = {}) {
    const container = document.createElement('div');
    container.className = `skeleton-container skeleton-${type}`;
    container.setAttribute('aria-label', 'Loading content');
    container.setAttribute('aria-busy', 'true');

    for (let i = 0; i < count; i++) {
      const skeleton = this.createSkeletonItem(type, options);
      container.appendChild(skeleton);
    }

    return container;
  }

  /**
   * Create individual skeleton item based on type
   * @param {string} type - Type of skeleton
   * @param {Object} options - Additional options
   * @returns {HTMLElement} - Skeleton item element
   */
  createSkeletonItem(type, options = {}) {
    const item = document.createElement('div');

    switch (type) {
      case 'gallery':
        return this.createGallerySkeleton(options);
      case 'artwork-detail':
        return this.createArtworkDetailSkeleton(options);
      case 'featured':
        return this.createFeaturedSkeleton(options);
      case 'search-results':
        return this.createSearchResultsSkeleton(options);
      case 'cart':
        return this.createCartSkeleton(options);
      case 'form':
        return this.createFormSkeleton(options);
      case 'collections':
        return this.createCollectionsSkeleton(options);
      case 'admin':
        return this.createAdminSkeleton(options);
      default:
        return this.createBasicSkeleton(options);
    }
  }

  /**
   * Create gallery skeleton (artwork cards)
   */
  createGallerySkeleton(options = {}) {
    const card = document.createElement('div');
    card.className = 'skeleton-artwork-card';
    card.innerHTML = `
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-category"></div>
        <div class="skeleton skeleton-price"></div>
        <div class="skeleton skeleton-button"></div>
      </div>
    `;
    return card;
  }

  /**
   * Create artwork detail skeleton
   */
  createArtworkDetailSkeleton(options = {}) {
    const detail = document.createElement('div');
    detail.className = 'skeleton-artwork-detail';
    detail.innerHTML = `
      <div class="skeleton skeleton-image large"></div>
      <div class="skeleton-detail-info">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton-metadata">
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
        <div class="skeleton-description">
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
        </div>
        <div class="skeleton-actions">
          <div class="skeleton skeleton-button"></div>
          <div class="skeleton skeleton-button"></div>
        </div>
      </div>
    `;
    return detail;
  }

  /**
   * Create featured section skeleton
   */
  createFeaturedSkeleton(options = {}) {
    const section = document.createElement('div');
    section.className = 'skeleton-featured-section';

    const title = document.createElement('div');
    title.className = 'skeleton skeleton-title';
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'skeleton-featured-grid';

    const itemCount = options.itemCount || 3;
    for (let i = 0; i < itemCount; i++) {
      const item = document.createElement('div');
      item.className = 'skeleton-featured-item';
      item.innerHTML = `
        <div class="skeleton skeleton-image"></div>
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
      `;
      grid.appendChild(item);
    }

    section.appendChild(grid);
    return section;
  }

  /**
   * Create search results skeleton
   */
  createSearchResultsSkeleton(options = {}) {
    const container = document.createElement('div');
    container.className = 'skeleton-search-results';
    container.innerHTML = `
      <div class="skeleton-search-info">
        <div class="skeleton skeleton-text"></div>
      </div>
      <div class="skeleton-search-filters">
        <div class="skeleton skeleton-button"></div>
        <div class="skeleton skeleton-button"></div>
        <div class="skeleton skeleton-button"></div>
        <div class="skeleton skeleton-button"></div>
      </div>
    `;
    return container;
  }

  /**
   * Create cart skeleton
   */
  createCartSkeleton(options = {}) {
    const item = document.createElement('div');
    item.className = 'skeleton-cart-item';
    item.innerHTML = `
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
      </div>
      <div class="skeleton skeleton-button"></div>
    `;
    return item;
  }

  /**
   * Create form skeleton
   */
  createFormSkeleton(options = {}) {
    const form = document.createElement('div');
    form.className = 'skeleton-form';

    const fieldCount = options.fieldCount || 4;
    for (let i = 0; i < fieldCount; i++) {
      const group = document.createElement('div');
      group.className = 'skeleton-form-group';

      const isTextarea = i === fieldCount - 1; // Last field is textarea
      group.innerHTML = `
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-${isTextarea ? 'textarea' : 'input'}"></div>
      `;
      form.appendChild(group);
    }

    const button = document.createElement('div');
    button.className = 'skeleton skeleton-button';
    form.appendChild(button);

    return form;
  }

  /**
   * Create collections skeleton
   */
  createCollectionsSkeleton(options = {}) {
    const card = document.createElement('div');
    card.className = 'skeleton-collection-card';
    card.innerHTML = `
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-button"></div>
      </div>
    `;
    return card;
  }

  /**
   * Create admin skeleton
   */
  createAdminSkeleton(options = {}) {
    const row = document.createElement('div');
    row.className = 'skeleton-admin-row';
    row.innerHTML = `
      <div class="skeleton skeleton-image"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-button"></div>
    `;
    return row;
  }

  /**
   * Create basic skeleton
   */
  createBasicSkeleton(options = {}) {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text"></div>
    `;
    return container;
  }

  /**
   * Show skeleton in a target element
   * @param {HTMLElement|string} target - Target element or selector
   * @param {string} type - Type of skeleton
   * @param {number} count - Number of skeleton items
   * @param {Object} options - Additional options
   */
  showSkeleton(target, type, count = 1, options = {}) {
    const targetElement = typeof target === 'string' ? document.querySelector(target) : target;

    if (!targetElement) {
      logger.warn(
        'Skeleton target element not found',
        { module: 'skeleton-loader', function: 'show' },
        { target: target }
      );
      return;
    }

    // Store original content if not already stored
    if (!targetElement.dataset.originalContent) {
      targetElement.dataset.originalContent = targetElement.innerHTML;
    }

    // Create and show skeleton
    const skeleton = this.createSkeleton(type, count, options);
    targetElement.innerHTML = '';
    targetElement.appendChild(skeleton);
    targetElement.classList.add('skeleton-active');

    // Track active skeleton
    this.activeSkeletons.add(targetElement);

    // Auto-hide after timeout (optional)
    if (options.timeout) {
      setTimeout(() => {
        this.hideSkeleton(targetElement);
      }, options.timeout);
    }
  }

  /**
   * Hide skeleton and restore original content
   * @param {HTMLElement|string} target - Target element or selector
   */
  hideSkeleton(target) {
    const targetElement = typeof target === 'string' ? document.querySelector(target) : target;

    if (!targetElement) {
      logger.warn(
        'Skeleton target element not found',
        { module: 'skeleton-loader', function: 'hideSkeleton' },
        { target: target }
      );
      return;
    }

    // Restore original content
    if (targetElement.dataset.originalContent) {
      targetElement.innerHTML = targetElement.dataset.originalContent;
      delete targetElement.dataset.originalContent;
    }

    targetElement.classList.remove('skeleton-active');
    this.activeSkeletons.delete(targetElement);
  }

  /**
   * Hide all active skeletons
   */
  hideAllSkeletons() {
    this.activeSkeletons.forEach(element => {
      this.hideSkeleton(element);
    });
  }

  /**
   * Check if element has active skeleton
   * @param {HTMLElement|string} target - Target element or selector
   * @returns {boolean}
   */
  hasSkeleton(target) {
    const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
    return targetElement && this.activeSkeletons.has(targetElement);
  }

  /**
   * Utility method to wrap async operations with skeleton loading
   * @param {HTMLElement|string} target - Target element
   * @param {string} skeletonType - Type of skeleton
   * @param {Function} asyncOperation - Async operation to perform
   * @param {Object} options - Additional options
   */
  async withSkeleton(target, skeletonType, asyncOperation, options = {}) {
    const count = options.count || 1;

    try {
      this.showSkeleton(target, skeletonType, count, options);
      const result = await asyncOperation();
      return result;
    } finally {
      this.hideSkeleton(target);
    }
  }
}

// Create global instance
const skeletonLoader = new SkeletonLoader();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkeletonLoader;
}

// Make available globally
window.SkeletonLoader = SkeletonLoader;
window.skeletonLoader = skeletonLoader;
