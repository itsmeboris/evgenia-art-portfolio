// Simple Express server to serve the website locally
require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const { v4: uuidv4 } = require('uuid');
const compression = require('compression');
const csrf = require('csrf');
const expressWinston = require('express-winston');
const logger = require('./src/js/modules/logger');
const app = express();
const port = process.env.PORT || 3000;
const httpsPort = process.env.HTTPS_PORT || 3443;

// Enhanced error handling for socket errors
process.on('uncaughtException', err => {
  if (err.code === 'ECONNRESET' || err.message.includes('Parse Error')) {
    logger.warn(
      'Connection error (likely mobile browser issue)',
      { module: 'server', function: 'uncaughtException' },
      { errorCode: err.code, errorMessage: err.message }
    );
    return; // Don't crash the server
  }
  logger.error('Uncaught Exception', err, { module: 'server', function: 'uncaughtException' });
  process.exit(1);
});

// Enhanced server error handling
app.on('error', err => {
  if (err.code === 'ECONNRESET' || err.message.includes('Parse Error')) {
    logger.warn(
      'Server connection error (likely mobile browser issue)',
      { module: 'server', function: 'app.error' },
      { errorCode: err.code }
    );
    return;
  }
  logger.error('Server error', err, { module: 'server', function: 'app.error' });
});

// Trust proxy (helps with mobile connections)
app.set('trust proxy', true);

// Add middleware to handle potential HTTPS issues with mobile browsers
app.use((req, res, next) => {
  // Handle X-Forwarded-Proto header if behind a proxy
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

  // Set security-related headers for mobile compatibility
  if (!isSecure && isDevelopment) {
    // In development, add headers to help with mobile browser compatibility
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
  }

  next();
});

// Admin authentication configuration from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const SESSION_SECRET = process.env.SESSION_SECRET || uuidv4();

// Validate that required environment variables are set
if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH) {
  logger.error(
    'Missing required environment variables',
    new Error('ADMIN_USERNAME and ADMIN_PASSWORD_HASH must be set in .env file'),
    {
      module: 'server',
      function: 'envValidation',
      missingVars: ['ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH'],
    }
  );
  process.exit(1);
}

// Warn if using generated session secret (not recommended for production)
if (!process.env.SESSION_SECRET) {
  logger.warn(
    'SESSION_SECRET not set in .env file. Using generated secret (not recommended for production)',
    { module: 'server', function: 'sessionConfig' },
    { environment: process.env.NODE_ENV, generatedSecret: true }
  );
}

// Compression middleware (must be early in the chain)
app.use(
  compression({
    level: 6, // Compression level (1-9, 6 is default)
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      // Skip compression for certain file types or conditions
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Fall back to standard filter function
      return compression.filter(req, res);
    },
  })
);

// Security middleware - configured for development/production
const isDevelopment = process.env.NODE_ENV !== 'production';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        scriptSrcAttr: ["'unsafe-inline'", "'unsafe-hashes'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://cdnjs.cloudflare.com',
        ],
        styleSrcElem: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://cdnjs.cloudflare.com',
        ],
        imgSrc: ["'self'", 'data:', 'https:', ...(isDevelopment ? ['http:'] : [])],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    // Disable HSTS in development to avoid SSL issues
    hsts: isDevelopment
      ? false
      : {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
  })
);

// Rate limiting for form submissions
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Fix trust proxy issue for development
  trustProxy: isDevelopment ? false : true,
  keyGenerator: req => ipKeyGenerator(req),
});

// Rate limiting for admin login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Fix trust proxy issue for development
  trustProxy: isDevelopment ? false : true,
  keyGenerator: req => ipKeyGenerator(req),
});

// Input sanitization helper
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent basic XSS
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
    .trim();
}

// Session configuration - use memory store in development to avoid Windows file permission issues
// Check if we're running on localhost (for testing production builds locally)
const isLocalhost =
  process.env.NODE_ENV !== 'production' || process.env.LOCALHOST_TESTING === 'true';

const sessionConfig = {
  secret: SESSION_SECRET,
  genid: () => uuidv4(), // Use UUID for session IDs
  resave: false,
  saveUninitialized: false,
  cookie: {
    // Only require HTTPS in production AND not on localhost
    secure: process.env.NODE_ENV === 'production' && !isLocalhost,
    httpOnly: true, // Prevent XSS
    maxAge: 1000 * 60 * 60 * 2, // 2 hours
    // Use lax for localhost testing, strict for actual production
    sameSite: isDevelopment || isLocalhost ? 'lax' : 'strict',
  },
  name: 'evgenia.sid', // Custom session name
};

// Use file store only in production, memory store in development
if (process.env.NODE_ENV === 'production') {
  const sessionStore = new FileStore({
    path: './sessions',
    ttl: 7200,
    retries: 1,
    secret: SESSION_SECRET,
    fileExtension: '.json',
  });

  sessionStore.on('error', error => {
    logger.error('Session store error', error, { module: 'server', function: 'sessionStore' });
  });

  sessionConfig.store = sessionStore;
  logger.info(
    'Using file-based session storage (production)',
    { module: 'server', function: 'sessionConfig' },
    {
      storageType: 'file',
      environment: 'production',
      cookieSecure: sessionConfig.cookie.secure,
      sameSite: sessionConfig.cookie.sameSite,
      isLocalhost: isLocalhost,
    }
  );
} else {
  logger.warn(
    'Using memory-based session storage (development)',
    { module: 'server', function: 'sessionConfig' },
    {
      storageType: 'memory',
      environment: 'development',
      note: 'Sessions will be lost when server restarts',
      cookieSecure: sessionConfig.cookie.secure,
      sameSite: sessionConfig.cookie.sameSite,
    }
  );
}

app.use(session(sessionConfig));

// Request logging middleware
app.use(
  expressWinston.logger({
    winstonInstance: logger.logger,
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}}',
    expressFormat: true,
    colorize: isDevelopment,
    ignoreRoute: function (req) {
      // Skip logging for static assets in production
      return (
        !isDevelopment &&
        (req.url.startsWith('/public/') ||
          req.url.endsWith('.css') ||
          req.url.endsWith('.js') ||
          req.url.endsWith('.png') ||
          req.url.endsWith('.jpg') ||
          req.url.endsWith('.webp'))
      );
    },
  })
);

// Middleware to parse JSON and URL-encoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mobile connection debugging middleware
app.use((req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const isMobile = /Mobile|Android|iPhone|iPad|BlackBerry|Windows Phone/i.test(userAgent);

  if (isMobile) {
    logger.debug(
      'Mobile request received',
      { module: 'server', function: 'mobileMiddleware' },
      {
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        userAgent: userAgent,
      }
    );

    // Add mobile-friendly headers
    res.setHeader('Connection', 'close'); // Force connection close for mobile
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Only set no-cache headers for HTML pages, not images or assets
    if (
      req.originalUrl.endsWith('.html') ||
      req.originalUrl.endsWith('/') ||
      (!req.originalUrl.includes('.') && !req.originalUrl.startsWith('/public'))
    ) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }

  // Log all requests in development
  if (isDevelopment) {
    logger.debug(
      'Request received',
      { module: 'server', function: 'requestMiddleware' },
      { method: req.method, url: req.originalUrl, ip: req.ip }
    );
  }

  next();
});

// CSRF protection setup
const csrfProtection = csrf();

// Middleware to add CSRF token to locals for templates
app.use((req, res, next) => {
  if (req.session) {
    // Initialize session secret if not exists
    if (!req.session.csrfSecret) {
      req.session.csrfSecret = csrfProtection.secretSync();
    }
    // Generate or retrieve CSRF token (cache in session)
    if (!req.session.csrfToken) {
      req.session.csrfToken = csrfProtection.create(req.session.csrfSecret);
    }
    res.locals.csrfToken = req.session.csrfToken;
    req.csrfToken = () => req.session.csrfToken;
  }
  next();
});

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.user && req.session.user.authenticated) {
    next();
  } else {
    res.redirect('/admin/login');
  }
}

// CSRF validation middleware
function validateCSRF(req, res, next) {
  try {
    const token = req.body._csrf || req.query._csrf || req.headers['x-csrf-token'];
    const secret = req.session?.csrfSecret;
    const sessionToken = req.session?.csrfToken;

    if (!token || !secret || !sessionToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid CSRF token. Please refresh the page and try again.',
      });
    }

    // Verify the token matches both the secret and the session token
    if (!csrfProtection.verify(secret, token) || token !== sessionToken) {
      return res.status(403).json({
        success: false,
        message: 'Invalid CSRF token. Please refresh the page and try again.',
      });
    }

    // Regenerate CSRF token for next request (security measure)
    req.session.csrfToken = csrfProtection.create(req.session.csrfSecret);

    next();
  } catch (error) {
    logger.error('CSRF validation error', error, { module: 'server', function: 'validateCSRF' });
    return res.status(403).json({
      success: false,
      message: 'CSRF validation failed. Please refresh the page and try again.',
    });
  }
}

// Admin login endpoint
app.post('/admin/login', loginLimiter, validateCSRF, async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check username and verify password with bcrypt
    if (username === ADMIN_USERNAME && (await bcrypt.compare(password, ADMIN_PASSWORD_HASH))) {
      // Regenerate session ID to prevent session fixation
      req.session.regenerate(err => {
        if (err) {
          logger.error('Session regeneration error', err, { module: 'server', function: 'login' });
          return res.redirect('/admin/login?error=server');
        }

        // Set session data
        req.session.user = {
          username: username,
          authenticated: true,
          loginTime: new Date().toISOString(),
        };

        // Save session
        req.session.save(err => {
          if (err) {
            logger.error('Session save error', err, { module: 'server', function: 'login' });
            return res.redirect('/admin/login?error=server');
          }
          res.redirect('/admin/');
        });
      });
    } else {
      logger.warn(
        'Failed login attempt',
        { module: 'server', function: 'login' },
        { username: username, ip: req.ip, userAgent: req.get('User-Agent') }
      );
      res.redirect('/admin/login?error=invalid');
    }
  } catch (error) {
    logger.error('Login error', error, { module: 'server', function: 'login' });
    res.redirect('/admin/login?error=server');
  }
});

// Admin logout endpoint
app.post('/admin/logout', validateCSRF, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      logger.error('Session destruction error', err, { module: 'server', function: 'logout' });
    }
    res.clearCookie('evgenia.sid');
    res.redirect('/admin/login');
  });
});

// Health check endpoint for mobile debugging
app.get('/api/health', (req, res) => {
  const userAgent = req.get('User-Agent') || '';
  const isMobile = /Mobile|Android|iPhone|iPad|BlackBerry|Windows Phone/i.test(userAgent);

  // Set simple response headers for mobile compatibility
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    server: 'Evgenia Portnov Art Website',
    protocol: req.protocol,
    secure: req.secure,
    client: {
      ip: req.ip,
      userAgent: userAgent,
      isMobile: isMobile,
      method: req.method,
      url: req.originalUrl,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        accept: req.headers.accept,
        connection: req.headers.connection,
      },
    },
    session: {
      id: req.session?.id || 'No session',
      exists: !!req.session,
    },
  });
});

// Simple mobile-friendly test endpoint
app.get('/test', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.send('Mobile test successful! Server is working correctly.');
});

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  if (req.session) {
    // Initialize session secret if not exists
    if (!req.session.csrfSecret) {
      req.session.csrfSecret = csrfProtection.secretSync();
    }
    // Generate or retrieve CSRF token (cache in session)
    if (!req.session.csrfToken) {
      req.session.csrfToken = csrfProtection.create(req.session.csrfSecret);
    }
    res.json({ csrfToken: req.session.csrfToken });
  } else {
    res.status(500).json({ error: 'Session not available' });
  }
});

// API v1 routes
const apiRoutes = require('./src/routes/api');
app.use('/api/v1', apiRoutes);

// Login page (no authentication required) - clean URL
app.get('/admin/login', (req, res) => {
  // Check if user is already logged in
  if (req.session && req.session.user && req.session.user.authenticated) {
    // User is already logged in, redirect to admin panel
    res.redirect('/admin/');
  } else {
    // User not logged in, show login page
    res.sendFile(path.join(__dirname, 'admin/login.html'));
  }
});

// Protected admin routes - specific routes first
app.get('/admin/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/index.html'));
});

app.get('/admin', requireAuth, (req, res) => {
  res.redirect('/admin/');
});

// Protected admin CSS files
app.get('/admin/css/:file', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/css', req.params.file));
});

// Protected admin JS files
app.get('/admin/js/:file', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/js', req.params.file));
});

// Catch-all for other admin files (protect everything else)
app.get('/admin/*', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', req.path.replace('/admin/', '')));
});

// Clean URLs for the main site (no .html extension needed) - MUST come before static middleware
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, 'gallery.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

// Serve favicon
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/assets/favicon/favicon.ico'));
});

// Serve static files from specific directories only
app.use(
  '/public',
  express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
      if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      }
      if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
    },
  })
);

// Route for individual artwork pages
app.get('/artwork/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'artwork.html'));
});

// Route for WebP test page
app.get('/webp-test.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'webp-test.html'));
});

// Route for API integration test (development only)
if (isDevelopment) {
  app.get('/api-integration-test.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/api-integration-test.html'));
  });
}

// Development route for src files (for testing only)
if (isDevelopment) {
  app.use(
    '/src',
    express.static(path.join(__dirname, 'src'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
      },
    })
  );
}

// Newsletter subscription endpoint
app.post(
  '/newsletter/subscribe',
  formLimiter,
  validateCSRF,
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address.')
      .normalizeEmail()
      .isLength({ max: 254 })
      .withMessage('Email address is too long.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }

    const { email } = req.body;
    const sanitizedEmail = sanitizeInput(email);

    // In a real application, you would:
    // 1. Save to database
    // 2. Send confirmation email
    // 3. Integrate with email service (Mailchimp, SendGrid, etc.)

    console.log(`Newsletter subscription: ${sanitizedEmail}`);

    // For now, just return success
    res.json({ success: true, message: 'Thank you for subscribing to our newsletter!' });
  }
);

// Browser logs endpoint
app.post('/api/logs', (req, res) => {
  try {
    const { logs, source } = req.body;

    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({ success: false, message: 'Invalid logs format' });
    }

    // Process each log entry
    logs.forEach(logEntry => {
      if (logEntry.level && logEntry.message) {
        // Add server-side context
        const enhancedContext = {
          ...logEntry.context,
          serverTimestamp: new Date().toISOString(),
          source: source || 'browser',
          ip: req.ip,
          serverUserAgent: req.get('User-Agent'),
        };

        // Log using server logger with appropriate level
        const logLevel =
          logEntry.level === 'debug'
            ? 'debug'
            : logEntry.level === 'info'
              ? 'info'
              : logEntry.level === 'warn'
                ? 'warn'
                : 'error';

        logger[logLevel](`[BROWSER] ${logEntry.message}`, enhancedContext, logEntry.meta);
      }
    });

    res.json({ success: true, processed: logs.length });
  } catch (error) {
    logger.error('Error processing browser logs', error, {
      module: 'server',
      function: 'browserLogsEndpoint',
    });
    res.status(500).json({ success: false, message: 'Error processing logs' });
  }
});

// Contact form endpoint
app.post(
  '/contact/submit',
  formLimiter,
  validateCSRF,
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters.')
      .matches(/^[a-zA-Z\s\-.]+$/)
      .withMessage('Name can only contain letters, spaces, hyphens, and periods.'),
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address.')
      .normalizeEmail()
      .isLength({ max: 254 })
      .withMessage('Email address is too long.'),
    body('subject')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Subject must be between 5 and 200 characters.')
      .matches(/^[a-zA-Z0-9\s\-.,!?]+$/)
      .withMessage('Subject contains invalid characters.'),
    body('message')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Message must be between 10 and 2000 characters.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
      });
    }

    const { name, email, subject, message } = req.body;

    // Sanitize all inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedSubject = sanitizeInput(subject);
    const sanitizedMessage = sanitizeInput(message);

    // In a real application, you would:
    // 1. Save to database
    // 2. Send email notification to admin
    // 3. Send confirmation email to user
    // 4. Integrate with email service

    logger.info(
      'Contact form submission',
      { module: 'server', function: 'contact' },
      {
        name: sanitizedName,
        email: sanitizedEmail,
        subject: sanitizedSubject,
        messagePreview:
          sanitizedMessage.substring(0, 100) + (sanitizedMessage.length > 100 ? '...' : ''),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      }
    );

    // For now, just return success
    res.json({
      success: true,
      message: `Thank you for your message, ${sanitizedName}! I will get back to you as soon as possible.`,
    });
  }
);

// Catch-all for any unmatched requests - send 404 without logging ENOENT errors
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Load SSL certificates for HTTPS
let httpsOptions = null;
try {
  httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem')),
  };
  logger.info('SSL certificates loaded successfully', { module: 'server', function: 'httpsSetup' });
} catch (err) {
  logger.warn(
    'Could not load SSL certificates',
    { module: 'server', function: 'httpsSetup' },
    { error: err.message, httpsAvailable: false }
  );
}

// Configure server timeout settings for mobile devices
const server = app.listen(port, '0.0.0.0', () => {
  logger.info(
    'Server started',
    { module: 'server', function: 'startup' },
    {
      name: "Evgenia's art website",
      httpPort: port,
      urls: {
        main: `http://localhost:${port}/`,
        gallery: `http://localhost:${port}/gallery`,
        admin: `http://localhost:${port}/admin/`,
      },
    }
  );

  // Enhanced mobile testing information
  console.log('\n🚀 SERVER READY FOR TESTING');
  console.log('='.repeat(50));
  console.log(`📱 MOBILE DEVICE TESTING URLS:`);

  // Get local IP addresses for mobile testing with better detection
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  const allIPs = [];

  Object.keys(networkInterfaces).forEach(interfaceName => {
    networkInterfaces[interfaceName].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        const ipInfo = {
          address: iface.address,
          interface: interfaceName,
          priority: 0,
        };

        // Prioritize common network ranges for mobile access
        if (iface.address.startsWith('192.168.')) {
          ipInfo.priority = 3; // Highest priority - typical home networks
        } else if (iface.address.startsWith('10.')) {
          ipInfo.priority = 2; // Medium priority - private networks
        } else if (iface.address.startsWith('172.')) {
          ipInfo.priority = 1; // Lower priority - often Docker/virtual
        }

        allIPs.push(ipInfo);
      }
    });
  });

  // Sort by priority (highest first)
  allIPs.sort((a, b) => b.priority - a.priority);

  if (allIPs.length > 0) {
    console.log('   📝 TRY THESE IPs IN ORDER:');
    allIPs.forEach((ipInfo, index) => {
      const priority = index === 0 ? '🎯 BEST' : `${index + 1}.`;
      console.log(`   ${priority} http://${ipInfo.address}:${port}/ (${ipInfo.interface})`);
      if (isDevelopment) {
        console.log(`      🧪 http://${ipInfo.address}:${port}/api-integration-test.html`);
      }
      if (httpsOptions) {
        console.log(`      🔒 https://${ipInfo.address}:${httpsPort}/`);
      }
      console.log('');
    });
  } else {
    console.log('   ⚠️  No external network interfaces found.');
    console.log('   💡 If using WSL, try: wsl hostname -I');
  }

  // WSL-specific instructions
  console.log('\n🔧 WSL USERS - MOBILE ACCESS SETUP:');
  console.log('   1️⃣  Get Windows IP: cmd.exe /c "ipconfig | findstr IPv4"');
  console.log('   2️⃣  Enable WSL port forwarding (run in Windows PowerShell as Admin):');
  console.log(
    '      netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=localhost'
  );
  console.log('   3️⃣  Test with Windows IP (example): http://192.168.1.63:3000/');
  console.log(
    '   4️⃣  Cleanup later: netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0'
  );

  console.log('\n💻 DESKTOP TESTING URLS:');
  console.log(`   🏠 http://localhost:${port}/`);
  if (isDevelopment) {
    console.log(`   🧪 http://localhost:${port}/api-integration-test.html (dev only)`);
  }
  console.log(`   👨‍💼 http://localhost:${port}/admin/`);

  console.log('\n📋 TESTING CHECKLIST:');
  console.log('   ✅ Desktop: Open test URL in browser');
  console.log('   ✅ Mobile: Connect to same WiFi network');
  console.log('   ✅ Mobile: Use IP address URLs above');
  if (isDevelopment) {
    console.log('   ✅ API Test: Check /api-integration-test.html (dev only)');
  }
  console.log('='.repeat(50) + '\n');
});

// Create HTTPS server if certificates are available
let httpsServer = null;
if (httpsOptions) {
  httpsServer = https.createServer(httpsOptions, app);
  httpsServer.listen(httpsPort, '0.0.0.0', () => {
    console.log(`🔒 HTTPS server running on port ${httpsPort}`);
    console.log(`   HTTPS: https://localhost:${httpsPort}`);
    console.log(`   Main site: https://localhost:${httpsPort}/`);
    console.log(`   Gallery: https://localhost:${httpsPort}/gallery`);
    console.log(`   Admin panel: https://localhost:${httpsPort}/admin/`);
  });
}

logger.info(
  'Middleware configured',
  { module: 'server', function: 'middlewareSetup' },
  {
    compression: 'gzip/deflate enabled',
    security: `headers configured for ${isDevelopment ? 'development' : 'production'} environment`,
    hsts: `${isDevelopment ? 'disabled' : 'enabled'} (development mode: ${isDevelopment})`,
  }
);

// Show local network access information
const interfaces = require('os').networkInterfaces();
const localIPs = [];

// Get all local IP addresses
Object.keys(interfaces).forEach(interfaceName => {
  interfaces[interfaceName].forEach(iface => {
    // Skip internal/non-IPv4 addresses
    if (iface.family === 'IPv4' && !iface.internal) {
      localIPs.push(iface.address);
    }
  });
});

if (localIPs.length > 0) {
  logger.info(
    'Mobile device access information',
    { module: 'server', function: 'networkSetup' },
    {
      localIPs: localIPs,
      httpUrls: localIPs.map(ip => `http://${ip}:${port}`),
      httpsUrls: httpsOptions ? localIPs.map(ip => `https://${ip}:${httpsPort}`) : [],
      troubleshooting: [
        'Try HTTPS first (accept security warning)',
        'If still issues, check firewall settings',
        'Both devices must be on same WiFi network',
        'Some mobile browsers auto-upgrade to HTTPS',
      ],
    }
  );
}

// Configure server timeouts for better mobile support
function configureServerTimeouts(srv) {
  srv.timeout = 120000; // 2 minutes
  srv.headersTimeout = 120000; // 2 minutes
  srv.keepAliveTimeout = 65000; // 65 seconds
}

configureServerTimeouts(server);
if (httpsServer) {
  configureServerTimeouts(httpsServer);
}

// Add connection debugging with better mobile error handling
function addConnectionDebugging(srv, serverType = 'HTTP') {
  srv.on('connection', socket => {
    console.log(`New ${serverType} connection from ${socket.remoteAddress}:${socket.remotePort}`);

    // Set socket options for better mobile compatibility
    socket.setNoDelay(true);
    socket.setKeepAlive(true, 30000);
    socket.setTimeout(10000); // 10 second timeout for problematic connections

    // Buffer to capture raw request data for debugging (only for HTTP server)
    let rawRequestData = Buffer.alloc(0);
    let dataLogged = false;

    if (serverType === 'HTTP') {
      socket.on('data', chunk => {
        if (!dataLogged && rawRequestData.length < 500) {
          rawRequestData = Buffer.concat([rawRequestData, chunk]);

          // Log the first bit of raw data to see what's causing parsing issues
          if (rawRequestData.length > 10) {
            const preview = rawRequestData
              .toString('ascii', 0, Math.min(200, rawRequestData.length))
              .replace(/\r/g, '\\r')
              .replace(/\n/g, '\\n')
              .replace(/[^\x20-\x7E\\]/g, '?'); // Replace non-printable chars

            console.log(`🔍 Raw ${serverType} data from ${socket.remoteAddress}: "${preview}"`);

            // Check if it looks like a valid HTTP request or TLS handshake
            const validMethodPattern = /^(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)\s+/;
            const isTlsHandshake = rawRequestData[0] === 0x16 && rawRequestData[1] === 0x03;

            if (isTlsHandshake) {
              console.log(`🔒 TLS/HTTPS handshake detected on HTTP server`);
              console.log(`   Mobile browser should use HTTPS port ${httpsPort} instead`);
            } else if (!validMethodPattern.test(preview)) {
              console.log(
                `❌ Invalid HTTP method detected. First bytes: ${Array.from(
                  rawRequestData.slice(0, 20)
                )
                  .map(b => `0x${b.toString(16).padStart(2, '0')}`)
                  .join(' ')}`
              );
            }

            dataLogged = true;
          }
        }
      });
    }

    socket.on('error', err => {
      // Handle common mobile browser parsing errors more gracefully
      if (
        err.message.includes('Parse Error') ||
        err.code === 'HPE_INVALID_METHOD' ||
        err.code === 'ECONNRESET'
      ) {
        logger.warn(
          'Mobile browser parsing error',
          { module: 'server', function: 'socketErrorHandler' },
          {
            serverType: serverType,
            remoteAddress: socket.remoteAddress,
            error: err.message,
            errorCode: err.code,
            receivedData:
              rawRequestData.length > 0
                ? rawRequestData
                    .toString('ascii', 0, Math.min(100, rawRequestData.length))
                    .replace(/[^\x20-\x7E]/g, '?')
                : null,
          }
        );

        // Safely destroy the socket
        if (!socket.destroyed) {
          socket.destroy();
        }
        return;
      }
      logger.error(
        'Socket error',
        { module: 'server', function: 'socketHandler' },
        { serverType: serverType, remoteAddress: socket.remoteAddress, error: err.message }
      );
    });

    socket.on('timeout', () => {
      logger.warn(
        'Socket timeout',
        { module: 'server', function: 'socketHandler' },
        {
          serverType: serverType,
          remoteAddress: socket.remoteAddress,
          remotePort: socket.remotePort,
        }
      );
      if (!socket.destroyed) {
        socket.destroy();
      }
    });

    socket.on('close', hadError => {
      if (hadError) {
        logger.warn(
          'Socket closed with error',
          { module: 'server', function: 'socketHandler' },
          { serverType: serverType, remoteAddress: socket.remoteAddress }
        );
      }
    });
  });
}

addConnectionDebugging(server, 'HTTP');
if (httpsServer) {
  addConnectionDebugging(httpsServer, 'HTTPS');
}

// Handle server errors
function addServerErrorHandling(srv, serverType, serverPort) {
  srv.on('error', err => {
    logger.error(
      'Server error',
      { module: 'server', function: 'serverErrorHandler' },
      {
        serverType: serverType,
        serverPort: serverPort,
        error: err.message,
        errorCode: err.code,
        additionalInfo:
          err.code === 'EADDRINUSE'
            ? `Port ${serverPort} is already in use. Please stop other servers or use a different port.`
            : null,
      }
    );
  });
}

addServerErrorHandling(server, 'HTTP', port);
if (httpsServer) {
  addServerErrorHandling(httpsServer, 'HTTPS', httpsPort);
}

// Handle server-level parsing errors for mobile browsers
function addClientErrorHandling(srv, serverType) {
  srv.on('clientError', (err, socket) => {
    const isParsingError =
      err.code === 'HPE_INVALID_METHOD' ||
      err.message.includes('Parse Error') ||
      err.code === 'HPE_INVALID_CONSTANT' ||
      err.code === 'HPE_INVALID_VERSION' ||
      err.code === 'HPE_INVALID_HEADER_TOKEN';

    if (isParsingError) {
      logger.warn(
        'Mobile browser parsing error',
        { module: 'server', function: 'clientErrorHandler' },
        {
          serverType: serverType,
          errorCode: err.code,
          errorMessage: err.message,
          tip:
            serverType === 'HTTP'
              ? `Mobile browser likely trying HTTPS - use https://your-ip:${httpsPort} instead`
              : null,
          httpsPort: httpsPort,
        }
      );

      // For TLS handshake attempts on HTTP or parsing errors on HTTPS, just close the connection
      if (socket.writable && !socket.destroyed) {
        socket.destroy();
      }
      return;
    }

    // Handle other client errors
    logger.error(
      'Client error',
      { module: 'server', function: 'clientErrorHandler' },
      { serverType: serverType, error: err.message }
    );
    if (socket.writable && !socket.destroyed) {
      try {
        socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
      } catch (writeErr) {
        socket.destroy();
      }
    }
  });
}

addClientErrorHandling(server, 'HTTP');
if (httpsServer) {
  addClientErrorHandling(httpsServer, 'HTTPS');
}

// Graceful shutdown
function gracefulShutdown(signal) {
  logger.info(
    'Graceful shutdown initiated',
    { module: 'server', function: 'gracefulShutdown' },
    { signal: signal }
  );

  const servers = [server];
  if (httpsServer) {
    servers.push(httpsServer);
  }

  let closedCount = 0;
  const totalServers = servers.length;

  servers.forEach((srv, index) => {
    srv.close(() => {
      closedCount++;
      const serverType = index === 0 ? 'HTTP' : 'HTTPS';
      logger.info(
        'Server closed',
        { module: 'server', function: 'gracefulShutdown' },
        { serverType: serverType, closedCount: closedCount, totalServers: totalServers }
      );

      if (closedCount === totalServers) {
        logger.info(
          'All servers closed - shutdown complete',
          { module: 'server', function: 'gracefulShutdown' },
          { totalServers: totalServers }
        );
        process.exit(0);
      }
    });
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
