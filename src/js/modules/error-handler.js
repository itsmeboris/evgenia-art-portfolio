// Error Handler Module - Global error handling and user feedback
// Provides error boundaries, logging, and graceful error recovery

class ErrorHandler {
  constructor() {
    this.isInitialized = false;
    this.errorCount = 0;
    this.maxErrors = 10;
    this.errorLog = [];
    this.maxLogSize = 100;

    // Error boundaries and recovery
    this.errorBoundaries = new Map();
    this.recoveryStrategies = new Map();
    this.errorThresholds = new Map();
    this.retryQueue = [];
    this.circuitBreakers = new Map();

    // Performance tracking
    this.errorMetrics = {
      total: 0,
      byType: {},
      byComponent: {},
      recovered: 0,
      criticalErrors: 0,
    };

    // Error types
    this.errorTypes = {
      NETWORK: 'network',
      VALIDATION: 'validation',
      RUNTIME: 'runtime',
      PERMISSION: 'permission',
      NOT_FOUND: 'not_found',
      TIMEOUT: 'timeout',
      MODULE_LOAD: 'module_load',
      CRITICAL: 'critical',
      UNKNOWN: 'unknown',
    };

    // User-friendly messages
    this.userMessages = {
      [this.errorTypes.NETWORK]:
        'Connection error. Please check your internet connection and try again.',
      [this.errorTypes.VALIDATION]: 'Please check your input and try again.',
      [this.errorTypes.RUNTIME]: 'Something went wrong. Please refresh the page and try again.',
      [this.errorTypes.PERMISSION]: "You don't have permission to perform this action.",
      [this.errorTypes.NOT_FOUND]: 'The requested content could not be found.',
      [this.errorTypes.TIMEOUT]: 'Request timed out. Please try again.',
      [this.errorTypes.UNKNOWN]: 'An unexpected error occurred. Please try again later.',
    };

    // Initialize recovery strategies
    this.initRecoveryStrategies();

    // Bind methods
    this.handleError = this.handleError.bind(this);
    this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);
    this.handleGlobalError = this.handleGlobalError.bind(this);
  }

  // Initialize recovery strategies for different error types
  initRecoveryStrategies() {
    // Network error recovery
    this.recoveryStrategies.set(this.errorTypes.NETWORK, {
      retry: true,
      maxRetries: 3,
      backoff: true,
      fallback: 'offline_mode',
    });

    // Module load error recovery
    this.recoveryStrategies.set(this.errorTypes.MODULE_LOAD, {
      retry: true,
      maxRetries: 2,
      fallback: 'graceful_degradation',
    });

    // Runtime error recovery
    this.recoveryStrategies.set(this.errorTypes.RUNTIME, {
      retry: false,
      fallback: 'component_isolation',
      reload: true,
    });

    // Validation error recovery
    this.recoveryStrategies.set(this.errorTypes.VALIDATION, {
      retry: false,
      fallback: 'form_reset',
      userFeedback: true,
    });
  }

  // Create error boundary for a specific component
  createErrorBoundary(componentName, element, options = {}) {
    const boundary = {
      element,
      componentName,
      errorCount: 0,
      lastError: null,
      isIsolated: false,
      options: {
        maxErrors: options.maxErrors || 3,
        isolateOnError: options.isolateOnError !== false,
        showFallback: options.showFallback !== false,
        autoRecover: options.autoRecover !== false,
        recoveryDelay: options.recoveryDelay || 5000,
        ...options,
      },
    };

    this.errorBoundaries.set(componentName, boundary);
    this.setupComponentErrorBoundary(boundary);

    console.log(`🛡️  Error boundary created for ${componentName}`);
    return boundary;
  }

  // Setup error boundary for a specific component
  setupComponentErrorBoundary(boundary) {
    const { element, componentName, options } = boundary;

    if (!element) return;

    // Wrap component in try-catch for DOM events
    const originalEventListeners = new Map();

    // Override addEventListener to catch errors
    if (element.addEventListener) {
      const originalAddListener = element.addEventListener.bind(element);
      element.addEventListener = (event, handler, ...args) => {
        const wrappedHandler = e => {
          try {
            return handler(e);
          } catch (error) {
            this.handleComponentError(componentName, error, e);
          }
        };
        originalEventListeners.set(handler, wrappedHandler);
        return originalAddListener(event, wrappedHandler, ...args);
      };
    }
  }

  // Handle component-specific errors
  handleComponentError(componentName, error, context = null) {
    const boundary = this.errorBoundaries.get(componentName);
    if (!boundary) {
      return this.handleError(error, context);
    }

    boundary.errorCount++;
    boundary.lastError = {
      error,
      context,
      timestamp: Date.now(),
    };

    console.error(`💥 Error in component ${componentName}:`, error);

    // Track error metrics
    this.errorMetrics.total++;
    this.errorMetrics.byComponent[componentName] =
      (this.errorMetrics.byComponent[componentName] || 0) + 1;

    // Check if component should be isolated
    if (
      boundary.errorCount >= boundary.options.maxErrors &&
      boundary.options.isolateOnError &&
      !boundary.isIsolated
    ) {
      this.isolateComponent(boundary);
    }

    // Attempt recovery
    this.attemptComponentRecovery(boundary, error);

    return {
      handled: true,
      componentName,
      isolated: boundary.isIsolated,
      errorCount: boundary.errorCount,
    };
  }

  // Isolate a component to prevent cascading failures
  isolateComponent(boundary) {
    const { element, componentName, options } = boundary;

    boundary.isIsolated = true;

    console.warn(`🚫 Isolating component ${componentName} due to repeated errors`);

    if (element && options.showFallback) {
      const fallback = this.createErrorFallback(componentName, boundary.lastError.error);

      // Replace component content with fallback
      const parent = element.parentNode;
      if (parent) {
        parent.insertBefore(fallback, element);
        element.style.display = 'none';
      }
    }

    // Schedule recovery attempt if auto-recovery is enabled
    if (options.autoRecover) {
      setTimeout(() => {
        this.attemptComponentRecovery(boundary, boundary.lastError.error, true);
      }, options.recoveryDelay);
    }
  }

  // Attempt to recover a component from an error
  attemptComponentRecovery(boundary, error, forceRecover = false) {
    const { componentName, options } = boundary;
    const errorType = this.categorizeError(error);
    const strategy = this.recoveryStrategies.get(errorType);

    if (!strategy && !forceRecover) return false;

    console.log(`🔄 Attempting recovery for ${componentName}...`);

    try {
      let recovered = false;

      // Try different recovery strategies
      if (forceRecover || strategy) {
        switch (strategy?.fallback || 'component_reset') {
          case 'component_reset':
            recovered = this.resetComponent(boundary);
            break;
          case 'graceful_degradation':
            recovered = this.enableGracefulDegradation(boundary);
            break;
          case 'component_isolation':
            this.isolateComponent(boundary);
            recovered = true;
            break;
        }
      }

      if (recovered) {
        boundary.errorCount = 0;
        boundary.isIsolated = false;
        this.errorMetrics.recovered++;

        console.log(`✅ Component ${componentName} recovered successfully`);

        // Dispatch recovery event
        window.dispatchEvent(
          new CustomEvent('component-recovered', {
            detail: { componentName, boundary },
          })
        );
      }

      return recovered;
    } catch (recoveryError) {
      console.error(`Failed to recover component ${componentName}:`, recoveryError);
      return false;
    }
  }

  // Reset a component to its initial state
  resetComponent(boundary) {
    const { element, componentName } = boundary;

    if (!element) return false;

    try {
      // Show the element if it was hidden
      element.style.display = '';

      // Remove error fallback if present
      const fallback = element.parentNode?.querySelector(
        `[data-error-fallback="${componentName}"]`
      );
      if (fallback) {
        fallback.remove();
      }

      // Reinitialize component if it has an init method
      if (window[componentName + 'Manager']?.init) {
        window[componentName + 'Manager'].init();
      }

      return true;
    } catch (error) {
      console.error(`Failed to reset component ${componentName}:`, error);
      return false;
    }
  }

  // Enable graceful degradation for a component
  enableGracefulDegradation(boundary) {
    const { element, componentName } = boundary;

    console.log(`⬇️  Enabling graceful degradation for ${componentName}`);

    // Add degraded mode class
    if (element) {
      element.classList.add('degraded-mode');

      // Hide non-essential features
      const nonEssential = element.querySelectorAll('[data-optional="true"]');
      nonEssential.forEach(el => (el.style.display = 'none'));
    }

    return true;
  }

  // Create error fallback UI
  createErrorFallback(componentName, error) {
    const fallback = document.createElement('div');
    fallback.className = 'error-fallback';
    fallback.setAttribute('data-error-fallback', componentName);

    fallback.innerHTML = `
            <div class="error-fallback-content">
                <div class="error-icon">⚠️</div>
                <h3>Component Error</h3>
                <p>The ${componentName} component encountered an error and has been temporarily disabled.</p>
                <button class="btn outline-btn retry-component" onclick="window.errorHandler.retryComponent('${componentName}')">
                    Try Again
                </button>
            </div>
        `;

    return fallback;
  }

  // Retry a failed component
  retryComponent(componentName) {
    const boundary = this.errorBoundaries.get(componentName);
    if (boundary) {
      this.attemptComponentRecovery(boundary, boundary.lastError?.error, true);
    }
  }

  // Get comprehensive error metrics
  getErrorMetrics() {
    return {
      ...this.errorMetrics,
      errorBoundaries: this.errorBoundaries.size,
      activeCircuitBreakers: Array.from(this.circuitBreakers.values()).filter(cb => cb.isOpen)
        .length,
      recentErrors: this.errorLog.slice(-10),
    };
  }

  // Initialize error handling system
  init() {
    if (this.isInitialized) {
      console.warn('Error handler already initialized');
      return;
    }

    try {
      this.setupGlobalErrorHandlers();
      this.setupErrorBoundaries();
      this.addErrorStyles();
      this.isInitialized = true;

      console.log('Error handler initialized successfully');
    } catch (error) {
      console.error('Failed to initialize error handler:', error);
    }
  }

  // Setup global error event listeners
  setupGlobalErrorHandlers() {
    // Handle JavaScript errors
    window.addEventListener('error', this.handleGlobalError);

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);

    // Handle fetch errors globally
    this.interceptFetch();

    // Monitor for too many errors
    this.setupErrorThrottling();
  }

  // Handle global JavaScript errors
  handleGlobalError(event) {
    const error = {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.logError(error);

    // Determine error type
    const errorType = this.categorizeError(event.error);

    // Only show user notification for critical errors
    if (this.shouldShowUserNotification(errorType, event.error)) {
      this.showUserError(errorType, event.error);
    }

    // Prevent default browser error handling for better UX
    if (errorType !== this.errorTypes.UNKNOWN) {
      event.preventDefault();
    }
  }

  // Handle unhandled promise rejections
  handleUnhandledRejection(event) {
    const error = {
      reason: event.reason,
      promise: event.promise,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      type: 'unhandled_promise_rejection',
    };

    this.logError(error);

    // Categorize the rejection
    const errorType = this.categorizeError(event.reason);

    // Show user notification for promise rejections
    if (this.shouldShowUserNotification(errorType, event.reason)) {
      this.showUserError(errorType, event.reason);
    }

    // Prevent default browser error handling
    event.preventDefault();
  }

  // Intercept fetch requests to handle network errors
  interceptFetch() {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);

        // Handle HTTP error status codes
        if (!response.ok) {
          const errorType = this.categorizeHttpError(response.status);
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.response = response;
          error.status = response.status;

          this.handleError(error, errorType);
          return response; // Return response anyway for custom handling
        }

        return response;
      } catch (error) {
        // Network or other fetch errors
        const errorType = this.categorizeError(error);
        this.handleError(error, errorType);
        throw error; // Re-throw for proper error propagation
      }
    };
  }

  // Main error handling method
  handleError(error, errorType = null) {
    // Increment error count
    this.errorCount++;

    // Categorize error if not provided
    if (!errorType) {
      errorType = this.categorizeError(error);
    }

    // Log the error
    this.logError({
      error: error.message || error.toString(),
      type: errorType,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Check if we should show user notification
    if (this.shouldShowUserNotification(errorType, error)) {
      this.showUserError(errorType, error);
    }

    // Check for error threshold
    this.checkErrorThreshold();

    return {
      type: errorType,
      message: this.getUserMessage(errorType),
      handled: true,
    };
  }

  // Categorize errors by type
  categorizeError(error) {
    if (!error) return this.errorTypes.UNKNOWN;

    const message = error.message || error.toString();
    const name = error.name || '';

    // Network errors
    if (error.name === 'TypeError' && message.includes('fetch')) {
      return this.errorTypes.NETWORK;
    }
    if (message.includes('Network Error') || message.includes('Failed to fetch')) {
      return this.errorTypes.NETWORK;
    }

    // Timeout errors
    if (error.name === 'TimeoutError' || message.includes('timeout')) {
      return this.errorTypes.TIMEOUT;
    }

    // Permission errors
    if (message.includes('Permission denied') || message.includes('Unauthorized')) {
      return this.errorTypes.PERMISSION;
    }

    // Not found errors
    if (message.includes('404') || message.includes('Not Found')) {
      return this.errorTypes.NOT_FOUND;
    }

    // Validation errors
    if (name.includes('Validation') || message.includes('validation')) {
      return this.errorTypes.VALIDATION;
    }

    // Runtime errors
    if (name === 'ReferenceError' || name === 'TypeError' || name === 'RangeError') {
      return this.errorTypes.RUNTIME;
    }

    return this.errorTypes.UNKNOWN;
  }

  // Categorize HTTP errors
  categorizeHttpError(status) {
    if (status === 401 || status === 403) {
      return this.errorTypes.PERMISSION;
    }
    if (status === 404) {
      return this.errorTypes.NOT_FOUND;
    }
    if (status === 408 || status === 504) {
      return this.errorTypes.TIMEOUT;
    }
    if (status >= 500) {
      return this.errorTypes.RUNTIME;
    }
    if (status >= 400) {
      return this.errorTypes.VALIDATION;
    }
    return this.errorTypes.UNKNOWN;
  }

  // Determine if error should be shown to user
  shouldShowUserNotification(errorType, error) {
    // Don't show notifications if we've exceeded error threshold
    if (this.errorCount > this.maxErrors) {
      return false;
    }

    // Don't show for certain error types
    if (
      errorType === this.errorTypes.UNKNOWN &&
      error &&
      error.message &&
      error.message.includes('Script error')
    ) {
      return false;
    }

    // Always show for user-facing errors
    return [
      this.errorTypes.NETWORK,
      this.errorTypes.TIMEOUT,
      this.errorTypes.PERMISSION,
      this.errorTypes.NOT_FOUND,
    ].includes(errorType);
  }

  // Show user-friendly error notification
  showUserError(errorType, error = null) {
    const message = this.getUserMessage(errorType);
    this.showErrorNotification(message, errorType);
  }

  // Get user-friendly message for error type
  getUserMessage(errorType) {
    return this.userMessages[errorType] || this.userMessages[this.errorTypes.UNKNOWN];
  }

  // Show error notification to user
  showErrorNotification(message, errorType) {
    // Remove existing error notifications
    const existingNotifications = document.querySelectorAll('.error-notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `error-notification error-${errorType}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');

    // Determine icon based on error type
    const icon = this.getErrorIcon(errorType);

    notification.innerHTML = `
            <div class="error-content">
                <i class="fas fa-${icon}" aria-hidden="true"></i>
                <span class="error-message">${message}</span>
                <button class="error-close" aria-label="Close error notification">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

    // Add close functionality
    const closeButton = notification.querySelector('.error-close');
    closeButton.addEventListener('click', () => {
      this.hideErrorNotification(notification);
    });

    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      maxWidth: '400px',
      background: '#f8d7da',
      border: '1px solid #f5c6cb',
      borderRadius: '6px',
      color: '#721c24',
      padding: '12px 16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: '10001',
      fontSize: '14px',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease',
      fontFamily: 'inherit',
    });

    // Style the content
    const content = notification.querySelector('.error-content');
    Object.assign(content.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    });

    // Style the close button
    Object.assign(closeButton.style, {
      background: 'none',
      border: 'none',
      color: 'inherit',
      cursor: 'pointer',
      padding: '4px',
      marginLeft: 'auto',
    });

    // Add to DOM
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Auto-hide after delay
    setTimeout(() => {
      if (notification.parentNode) {
        this.hideErrorNotification(notification);
      }
    }, 8000);
  }

  // Hide error notification
  hideErrorNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  // Get appropriate icon for error type
  getErrorIcon(errorType) {
    const icons = {
      [this.errorTypes.NETWORK]: 'wifi',
      [this.errorTypes.TIMEOUT]: 'clock',
      [this.errorTypes.PERMISSION]: 'lock',
      [this.errorTypes.NOT_FOUND]: 'search',
      [this.errorTypes.VALIDATION]: 'exclamation-triangle',
      [this.errorTypes.RUNTIME]: 'bug',
    };

    return icons[errorType] || 'exclamation-circle';
  }

  // Log error for debugging
  logError(errorInfo) {
    // Add to internal log
    this.errorLog.push(errorInfo);

    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Console logging
    console.group('🚨 Error Logged');
    console.error('Error Info:', errorInfo);
    console.groupEnd();

    // Send to external service if configured
    this.sendToErrorService(errorInfo);
  }

  // Send error to external logging service
  sendToErrorService(errorInfo) {
    // This would integrate with services like Sentry, LogRocket, etc.
    // For now, we'll just store in localStorage for debugging
    try {
      const storedErrors = JSON.parse(localStorage.getItem('error-log') || '[]');
      storedErrors.push(errorInfo);

      // Keep only last 20 errors
      if (storedErrors.length > 20) {
        storedErrors.splice(0, storedErrors.length - 20);
      }

      localStorage.setItem('error-log', JSON.stringify(storedErrors));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  // Setup error throttling to prevent spam
  setupErrorThrottling() {
    // Reset error count periodically
    setInterval(() => {
      this.errorCount = Math.max(0, this.errorCount - 1);
    }, 60000); // Reduce count every minute
  }

  // Check if error threshold exceeded
  checkErrorThreshold() {
    if (this.errorCount > this.maxErrors) {
      this.showCriticalErrorMessage();
    }
  }

  // Show critical error message when too many errors occur
  showCriticalErrorMessage() {
    const message =
      'Multiple errors detected. Please refresh the page or contact support if the problem persists.';

    // Create persistent error overlay
    const overlay = document.createElement('div');
    overlay.className = 'critical-error-overlay';
    overlay.innerHTML = `
            <div class="critical-error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Technical Difficulties</h3>
                <p>${message}</p>
                <div class="critical-error-actions">
                    <button class="btn primary-btn" onclick="window.location.reload()">
                        Refresh Page
                    </button>
                    <button class="btn secondary-btn" onclick="this.closest('.critical-error-overlay').remove()">
                        Dismiss
                    </button>
                </div>
            </div>
        `;

    // Style the overlay
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10002',
      color: 'white',
      fontFamily: 'inherit',
    });

    document.body.appendChild(overlay);
  }

  // Setup error boundaries for specific modules
  setupErrorBoundaries() {
    // Wrap critical functions with error boundaries
    this.wrapAsyncFunctions();
  }

  // Wrap async functions with error handling
  wrapAsyncFunctions() {
    // Wrap setTimeout and setInterval
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;

    window.setTimeout = (callback, delay, ...args) => {
      const wrappedCallback = this.wrapFunction(callback);
      return originalSetTimeout(wrappedCallback, delay, ...args);
    };

    window.setInterval = (callback, delay, ...args) => {
      const wrappedCallback = this.wrapFunction(callback);
      return originalSetInterval(wrappedCallback, delay, ...args);
    };
  }

  // Wrap individual function with error handling
  wrapFunction(fn) {
    if (typeof fn !== 'function') return fn;

    return (...args) => {
      try {
        const result = fn.apply(this, args);

        // Handle promises
        if (result && typeof result.catch === 'function') {
          return result.catch(error => {
            this.handleError(error);
            throw error; // Re-throw for proper error propagation
          });
        }

        return result;
      } catch (error) {
        this.handleError(error);
        throw error; // Re-throw for proper error propagation
      }
    };
  }

  // Add error styles
  addErrorStyles() {
    if (document.getElementById('error-handler-styles')) return;

    const style = document.createElement('style');
    style.id = 'error-handler-styles';
    style.textContent = `
            .critical-error-content {
                background: white;
                color: #333;
                padding: 2rem;
                border-radius: 8px;
                text-align: center;
                max-width: 400px;
                margin: 0 20px;
            }

            .critical-error-content i {
                font-size: 3rem;
                color: #dc3545;
                margin-bottom: 1rem;
            }

            .critical-error-content h3 {
                margin: 0 0 1rem 0;
                color: #333;
            }

            .critical-error-content p {
                margin: 0 0 1.5rem 0;
                line-height: 1.5;
            }

            .critical-error-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
            }

            .critical-error-actions .btn {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.2s ease;
            }

            .critical-error-actions .primary-btn {
                background: #007bff;
                color: white;
            }

            .critical-error-actions .primary-btn:hover {
                background: #0056b3;
            }

            .critical-error-actions .secondary-btn {
                background: #6c757d;
                color: white;
            }

            .critical-error-actions .secondary-btn:hover {
                background: #545b62;
            }
        `;
    document.head.appendChild(style);
  }

  // Public method to manually report error
  reportError(error, context = '') {
    const errorInfo = {
      error: error.message || error.toString(),
      context,
      manual: true,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.logError(errorInfo);
    return this.handleError(error);
  }

  // Get error statistics
  getErrorStats() {
    return {
      totalErrors: this.errorCount,
      recentErrors: this.errorLog.slice(-10),
      errorTypes: this.errorLog.reduce((acc, error) => {
        const type = error.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  // Clear error log
  clearErrorLog() {
    this.errorLog = [];
    this.errorCount = 0;
    localStorage.removeItem('error-log');
  }

  // Destroy error handler
  destroy() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);

    // Remove error notifications
    const notifications = document.querySelectorAll('.error-notification, .critical-error-overlay');
    notifications.forEach(notification => notification.remove());

    this.isInitialized = false;
  }
}

// Create global instance
const errorHandler = new ErrorHandler();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    errorHandler.init();
  });
} else {
  errorHandler.init();
}

// Make globally accessible for manual error reporting
window.reportError = (error, context) => errorHandler.reportError(error, context);

// Export for use in other modules
// Make error handler globally accessible
window.errorHandler = errorHandler;
