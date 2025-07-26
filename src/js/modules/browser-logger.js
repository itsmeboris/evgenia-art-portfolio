/**
 * Browser-compatible logger for frontend modules
 * Provides structured logging similar to the server-side Winston logger
 * Sends logs to server endpoint for centralized logging
 */
class BrowserLogger {
  constructor() {
    this.isDevelopment =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.port !== '';
    this.logBuffer = [];
    this.maxBufferSize = 100;
    this.flushInterval = 5000; // 5 seconds
    this.isOnline = navigator.onLine;

    // Set up periodic log flushing
    this.setupPeriodicFlush();

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushLogs();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Flush logs before page unload
    window.addEventListener('beforeunload', () => {
      this.flushLogs(true); // synchronous flush
    });
  }

  /**
   * Log an error message
   * @param {string} message - The error message
   * @param {Object} context - Context object with module/function info
   * @param {Object} meta - Additional metadata
   */
  error(message, context = {}, meta = {}) {
    this.log('error', message, context, meta);
  }

  /**
   * Log a warning message
   * @param {string} message - The warning message
   * @param {Object} context - Context object with module/function info
   * @param {Object} meta - Additional metadata
   */
  warn(message, context = {}, meta = {}) {
    this.log('warn', message, context, meta);
  }

  /**
   * Log an info message
   * @param {string} message - The info message
   * @param {Object} context - Context object with module/function info
   * @param {Object} meta - Additional metadata
   */
  info(message, context = {}, meta = {}) {
    this.log('info', message, context, meta);
  }

  /**
   * Log a debug message (only in development)
   * @param {string} message - The debug message
   * @param {Object} context - Context object with module/function info
   * @param {Object} meta - Additional metadata
   */
  debug(message, context = {}, meta = {}) {
    if (this.isDevelopment) {
      this.log('debug', message, context, meta);
    }
  }

  /**
   * Core logging method
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Context information
   * @param {Object} meta - Additional metadata
   */
  log(level, message, context = {}, meta = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      message: message,
      context: {
        module: context.module || 'unknown',
        function: context.function || 'unknown',
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context,
      },
      meta: {
        sessionId: this.getSessionId(),
        viewportSize: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        ...meta,
      },
    };

    // Always log to console in development, or for errors/warnings
    if (this.isDevelopment || level === 'error' || level === 'warn') {
      const consoleMethod = console[level] || console.log;
      consoleMethod(`[${level.toUpperCase()}] ${message}`, {
        context: logEntry.context,
        meta: logEntry.meta,
      });
    }

    // Add to buffer for server logging
    this.logBuffer.push(logEntry);

    // Flush immediately for errors
    if (level === 'error') {
      this.flushLogs();
    }

    // Flush if buffer is full
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flushLogs();
    }
  }

  /**
   * Set up periodic log flushing
   */
  setupPeriodicFlush() {
    setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flushLogs();
      }
    }, this.flushInterval);
  }

  /**
   * Flush logs to server
   * @param {boolean} synchronous - Whether to send synchronously
   */
  flushLogs(synchronous = false) {
    if (this.logBuffer.length === 0 || !this.isOnline) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    const payload = {
      logs: logsToSend,
      source: 'browser',
    };

    if (synchronous) {
      // Use sendBeacon for synchronous sending (page unload)
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/logs', JSON.stringify(payload));
      }
    } else {
      // Use fetch for asynchronous sending
      fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch(error => {
        // If sending fails, put logs back in buffer
        console.error('Failed to send logs to server:', error);
        this.logBuffer = [...logsToSend, ...this.logBuffer];
      });
    }
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('browserLoggerSessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('browserLoggerSessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Log user interactions
   * @param {string} action - The user action
   * @param {Object} details - Action details
   */
  userAction(action, details = {}) {
    this.info(
      `User action: ${action}`,
      { module: 'user-interaction', function: 'userAction' },
      { action: action, ...details }
    );
  }

  /**
   * Log performance metrics
   * @param {string} metric - The metric name
   * @param {number} value - The metric value
   * @param {Object} context - Additional context
   */
  performance(metric, value, context = {}) {
    this.info(
      `Performance: ${metric}`,
      { module: 'performance', function: 'performance' },
      { metric: metric, value: value, unit: 'ms', ...context }
    );
  }

  /**
   * Log API calls
   * @param {string} endpoint - The API endpoint
   * @param {string} method - HTTP method
   * @param {number} responseTime - Response time in ms
   * @param {number} statusCode - HTTP status code
   */
  apiCall(endpoint, method, responseTime, statusCode) {
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    this.log(
      level,
      `API call: ${method} ${endpoint}`,
      { module: 'api', function: 'apiCall' },
      {
        endpoint: endpoint,
        method: method,
        responseTime: responseTime,
        statusCode: statusCode,
      }
    );
  }
}

// Create global logger instance immediately
const browserLogger = new BrowserLogger();
window.logger = browserLogger;

// Make it available in global scope
if (typeof global !== 'undefined') {
  global.logger = browserLogger;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrowserLogger;
}

// Ensure logger is available when modules are loaded
if (typeof window !== 'undefined' && !window.logger) {
  window.logger = browserLogger;
}
