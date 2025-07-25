// Utils Module - Shared utility functions and helpers
// Performance optimized utilities for common operations

class Utils {
  constructor() {
    this.cache = new Map();
    this.throttleTimers = new Map();
    this.debounceTimers = new Map();
  }

  // Debounce function calls
  debounce(func, wait, immediate = false) {
    const key = func.toString();

    return function executedFunction(...args) {
      const later = () => {
        this.debounceTimers.delete(key);
        if (!immediate) func.apply(this, args);
      };

      const callNow = immediate && !this.debounceTimers.has(key);

      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key));
      }

      this.debounceTimers.set(key, setTimeout(later, wait));

      if (callNow) func.apply(this, args);
    }.bind(this);
  }

  // Throttle function calls
  throttle(func, limit) {
    const key = func.toString();

    return function executedFunction(...args) {
      if (!this.throttleTimers.has(key)) {
        func.apply(this, args);
        this.throttleTimers.set(
          key,
          setTimeout(() => {
            this.throttleTimers.delete(key);
          }, limit)
        );
      }
    }.bind(this);
  }

  // Deep clone object
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const copy = {};
      Object.keys(obj).forEach(key => {
        copy[key] = this.deepClone(obj[key]);
      });
      return copy;
    }
  }

  // Merge objects deeply
  deepMerge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return this.deepMerge(target, ...sources);
  }

  // Check if value is object
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  // Check if value is empty
  isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  // Generate unique ID
  generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate UUID v4
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Format currency
  formatCurrency(amount, currency = '₪', locale = 'he-IL') {
    try {
      if (typeof amount === 'string') {
        amount = parseFloat(amount.replace(/[^\d.-]/g, ''));
      }

      if (isNaN(amount)) return `${currency}0.00`;

      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency === '₪' ? 'ILS' : 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Fallback for unsupported locales
      return `${currency}${amount.toFixed(2)}`;
    }
  }

  // Format date
  formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    const formatOptions = { ...defaultOptions, ...options };

    try {
      if (typeof date === 'string') {
        date = new Date(date);
      }

      return new Intl.DateTimeFormat('en-US', formatOptions).format(date);
    } catch (error) {
      return date.toString();
    }
  }

  // Format relative time
  formatRelativeTime(date) {
    const now = new Date();
    const diff = now - (typeof date === 'string' ? new Date(date) : date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;

    return this.formatDate(date);
  }

  // Escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Strip HTML tags
  stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  // Truncate text
  truncateText(text, maxLength, suffix = '...') {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + suffix;
  }

  // Capitalize first letter
  capitalize(text) {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  // Convert to title case
  toTitleCase(text) {
    if (!text) return text;
    return text.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  // Convert to kebab case
  toKebabCase(text) {
    if (!text) return text;
    return text
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  // Convert to camel case
  toCamelCase(text) {
    if (!text) return text;
    return text
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^[A-Z]/, c => c.toLowerCase());
  }

  // Validate email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate URL
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Get viewport dimensions
  getViewportDimensions() {
    return {
      width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
    };
  }

  // Check if element is in viewport
  isInViewport(element, threshold = 0) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const viewport = this.getViewportDimensions();

    return (
      rect.top >= -threshold &&
      rect.left >= -threshold &&
      rect.bottom <= viewport.height + threshold &&
      rect.right <= viewport.width + threshold
    );
  }

  // Smooth scroll to element
  scrollToElement(element, options = {}) {
    const defaultOptions = {
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    };

    const scrollOptions = { ...defaultOptions, ...options };

    if (typeof element === 'string') {
      element = document.querySelector(element);
    }

    if (element && element.scrollIntoView) {
      element.scrollIntoView(scrollOptions);
    }
  }

  // Get scroll position
  getScrollPosition() {
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop,
    };
  }

  // Set scroll position
  setScrollPosition(x, y, smooth = false) {
    if (smooth) {
      window.scrollTo({
        left: x,
        top: y,
        behavior: 'smooth',
      });
    } else {
      window.scrollTo(x, y);
    }
  }

  // Local storage helpers with error handling
  storage = {
    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
        return false;
      }
    },

    get: (key, defaultValue = null) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
        return defaultValue;
      }
    },

    remove: key => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
        return false;
      }
    },

    clear: () => {
      try {
        localStorage.clear();
        return true;
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
        return false;
      }
    },
  };

  // Session storage helpers
  sessionStorage = {
    set: (key, value) => {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn('Failed to save to sessionStorage:', error);
        return false;
      }
    },

    get: (key, defaultValue = null) => {
      try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.warn('Failed to read from sessionStorage:', error);
        return defaultValue;
      }
    },

    remove: key => {
      try {
        sessionStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn('Failed to remove from sessionStorage:', error);
        return false;
      }
    },
  };

  // Cookie helpers
  cookies = {
    set: (name, value, days = 7) => {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    },

    get: name => {
      const nameEQ = name + '=';
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    },

    remove: name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    },
  };

  // Performance monitoring
  performance = {
    mark: name => {
      if ('performance' in window && 'mark' in performance) {
        performance.mark(name);
      }
    },

    measure: (name, startMark, endMark) => {
      if ('performance' in window && 'measure' in performance) {
        try {
          performance.measure(name, startMark, endMark);
          const measure = performance.getEntriesByName(name)[0];
          return measure ? measure.duration : null;
        } catch (error) {
          console.warn('Performance measurement failed:', error);
          return null;
        }
      }
      return null;
    },

    now: () => {
      return 'performance' in window && 'now' in performance ? performance.now() : Date.now();
    },
  };

  // Array utilities
  array = {
    unique: arr => [...new Set(arr)],

    flatten: arr =>
      arr.reduce(
        (acc, val) => (Array.isArray(val) ? acc.concat(this.array.flatten(val)) : acc.concat(val)),
        []
      ),

    chunk: (arr, size) => {
      const chunks = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    },

    shuffle: arr => {
      const shuffled = [...arr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    },

    groupBy: (arr, key) => {
      return arr.reduce((groups, item) => {
        const group = typeof key === 'function' ? key(item) : item[key];
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
      }, {});
    },
  };

  // Object utilities
  object = {
    pick: (obj, keys) => {
      return keys.reduce((result, key) => {
        if (key in obj) result[key] = obj[key];
        return result;
      }, {});
    },

    omit: (obj, keys) => {
      const result = { ...obj };
      keys.forEach(key => delete result[key]);
      return result;
    },

    flattenKeys: (obj, prefix = '') => {
      const flattened = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const newKey = prefix ? `${prefix}.${key}` : key;
          if (this.isObject(obj[key])) {
            Object.assign(flattened, this.object.flattenKeys(obj[key], newKey));
          } else {
            flattened[newKey] = obj[key];
          }
        }
      }
      return flattened;
    },
  };

  // URL utilities
  url = {
    getParams: () => {
      const params = {};
      const searchParams = new URLSearchParams(window.location.search);
      for (const [key, value] of searchParams) {
        params[key] = value;
      }
      return params;
    },

    setParams: params => {
      const url = new URL(window.location);
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          url.searchParams.delete(key);
        } else {
          url.searchParams.set(key, value);
        }
      });
      window.history.replaceState({}, '', url);
    },

    addParam: (key, value) => {
      const url = new URL(window.location);
      url.searchParams.set(key, value);
      window.history.replaceState({}, '', url);
    },

    removeParam: key => {
      const url = new URL(window.location);
      url.searchParams.delete(key);
      window.history.replaceState({}, '', url);
    },
  };

  // Device detection
  device = {
    isMobile: () =>
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isTablet: () => /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent),
    isDesktop: () => !this.device.isMobile() && !this.device.isTablet(),
    isTouchDevice: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    getScreenSize: () => {
      const { width } = this.getViewportDimensions();
      if (width < 576) return 'xs';
      if (width < 768) return 'sm';
      if (width < 992) return 'md';
      if (width < 1200) return 'lg';
      return 'xl';
    },
  };

  // Animation utilities
  animation = {
    easeInOut: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

    animate: (from, to, duration, callback, easing = this.animation.easeInOut) => {
      const start = this.performance.now();
      const animate = time => {
        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = from + (to - from) * easing(progress);

        callback(value, progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    },
  };

  // Ensure absolute path for images/assets
  ensureAbsolutePath(path) {
    if (!path) return '';
    if (path.startsWith('/')) return path;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return '/' + path;
  }

  // Clear all timers and cache
  cleanup() {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.throttleTimers.clear();
    this.cache.clear();
  }
}

// Create global instance
const utils = new Utils();

// Export for use in other modules
// Make utils globally accessible
window.utils = utils;
