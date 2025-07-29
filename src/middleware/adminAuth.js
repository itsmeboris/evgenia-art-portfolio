const logger = require('../js/modules/logger');

/**
 * Admin authentication middleware for API routes
 * Checks for valid admin session and logs all admin API access
 */
function requireAdminAuth(req, res, next) {
  // Check if user has valid admin session
  if (req.session && req.session.user && req.session.user.authenticated) {
    // Log admin API access for audit trail
    logger.info('Admin API access', {
      user: req.session.user.username || 'admin',
      action: `${req.method} ${req.originalUrl}`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      sessionId: req.sessionID
    });

    next();
  } else {
    // For API requests, return JSON error instead of redirect
    logger.warn('Unauthorized admin API access attempt', {
      action: `${req.method} ${req.originalUrl}`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    res.status(401).json({
      error: 'Authentication required',
      message: 'Admin authentication required for this operation',
      requiresLogin: true
    });
  }
}

/**
 * Optional admin auth middleware for read operations
 * Allows public access but logs if admin is authenticated
 */
function optionalAdminAuth(req, res, next) {
  if (req.session && req.session.user && req.session.user.authenticated) {
    logger.info('Admin API access (optional)', {
      user: req.session.user.username || 'admin',
      action: `${req.method} ${req.originalUrl}`,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  }
  next();
}

module.exports = {
  requireAdminAuth,
  optionalAdminAuth
};