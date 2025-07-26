const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

/**
 * Logger configuration with Winston
 * Provides structured logging with multiple transports and log levels
 */
class Logger {
  constructor() {
    this.logger = this.createLogger();
  }

  /**
   * Create Winston logger with configured transports
   * @returns {winston.Logger} Configured logger instance
   */
  createLogger() {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    // Console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, context, meta }) => {
        let logMessage = `${timestamp} [${level}] ${message}`;

        if (context) {
          logMessage += ` | ${JSON.stringify(context)}`;
        }

        if (meta && Object.keys(meta).length > 0) {
          logMessage += ` | ${JSON.stringify(meta)}`;
        }

        return logMessage;
      })
    );

    // Create transports
    const transports = [];

    // Console transport (always enabled)
    transports.push(
      new winston.transports.Console({
        format: isDevelopment ? consoleFormat : logFormat,
        level: isDevelopment ? 'debug' : 'info',
      })
    );

    // File transports for production
    if (!isDevelopment) {
      // Combined logs (all levels)
      transports.push(
        new DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: logFormat,
          level: 'info',
        })
      );

      // Error logs only
      transports.push(
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: logFormat,
          level: 'error',
        })
      );
    }

    return winston.createLogger({
      level: isDevelopment ? 'debug' : 'info',
      format: logFormat,
      transports,
      exitOnError: false,
      handleExceptions: true,
      handleRejections: true,
    });
  }

  /**
   * Log with context information
   * @param {string} level - Log level (error, warn, info, debug)
   * @param {string} message - Log message
   * @param {Object} context - Context information (module, function, etc.)
   * @param {Object} meta - Additional metadata
   */
  log(level, message, context = {}, meta = {}) {
    this.logger.log(level, message, { context, meta });
  }

  /**
   * Log error with stack trace
   * @param {string} message - Error message
   * @param {Error|Object} error - Error object or context
   * @param {Object} meta - Additional metadata
   */
  error(message, error = {}, meta = {}) {
    const context = {
      module: error.module || 'unknown',
      function: error.function || 'unknown',
      ...(error.context || {}),
    };

    if (error instanceof Error) {
      this.logger.error(message, {
        context,
        meta,
        stack: error.stack,
        errorName: error.name,
        errorMessage: error.message,
      });
    } else {
      this.logger.error(message, { context, meta });
    }
  }

  /**
   * Log warning
   * @param {string} message - Warning message
   * @param {Object} context - Context information
   * @param {Object} meta - Additional metadata
   */
  warn(message, context = {}, meta = {}) {
    this.log('warn', message, context, meta);
  }

  /**
   * Log info
   * @param {string} message - Info message
   * @param {Object} context - Context information
   * @param {Object} meta - Additional metadata
   */
  info(message, context = {}, meta = {}) {
    this.log('info', message, context, meta);
  }

  /**
   * Log debug information
   * @param {string} message - Debug message
   * @param {Object} context - Context information
   * @param {Object} meta - Additional metadata
   */
  debug(message, context = {}, meta = {}) {
    this.log('debug', message, context, meta);
  }

  /**
   * Log HTTP request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} responseTime - Response time in milliseconds
   */
  logRequest(req, res, responseTime) {
    const context = {
      module: 'express',
      function: 'request',
    };

    const meta = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      contentLength: res.get('Content-Length'),
    };

    const level = res.statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `${req.method} ${req.url}`, context, meta);
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} context - Context information
   */
  logPerformance(operation, duration, context = {}) {
    this.info(`Performance: ${operation}`, context, {
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log user action
   * @param {string} action - User action description
   * @param {Object} context - Context information
   * @param {Object} meta - Additional metadata
   */
  logUserAction(action, context = {}, meta = {}) {
    this.info(
      `User action: ${action}`,
      {
        module: 'user-action',
        ...context,
      },
      meta
    );
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
