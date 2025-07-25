// Express server for Evgenia Art Portfolio with Database Support
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

// Database imports
const { initializeDatabase, closeConnections } = require('./database/config');
const apiRoutes = require('./routes/api');

const app = express();
const port = process.env.PORT || 3000;
const httpsPort = process.env.HTTPS_PORT || 3443;

// Enhanced error handling for socket errors
process.on('uncaughtException', err => {
  if (err.code === 'ECONNRESET' || err.message.includes('Parse Error')) {
    console.log('⚠️  Connection error (likely mobile browser issue):', err.message);
    return; // Don't crash the server
  }
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Enhanced server error handling
app.on('error', err => {
  if (err.code === 'ECONNRESET' || err.message.includes('Parse Error')) {
    console.log('⚠️  Server connection error (likely mobile browser issue)');
    return;
  }
  console.error('Server error:', err);
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
  console.error('❌ ERROR: ADMIN_USERNAME and ADMIN_PASSWORD_HASH must be set in .env file');
  process.exit(1);
}

// Warn if using generated session secret (not recommended for production)
if (!process.env.SESSION_SECRET) {
  console.warn(
    '⚠️  WARNING: SESSION_SECRET not set in .env file. Using generated secret (not recommended for production).'
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
const sessionConfig = {
  secret: SESSION_SECRET,
  genid: () => uuidv4(), // Use UUID for session IDs
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 1000 * 60 * 60 * 2, // 2 hours
    sameSite: isDevelopment ? 'lax' : 'strict', // More permissive in development
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
    console.error('Session store error:', error.message);
  });

  sessionConfig.store = sessionStore;
  console.log('✅ Using file-based session storage (production)');
} else {
  console.log('⚠️  Using memory-based session storage (development)');
  console.log('   Note: Sessions will be lost when server restarts');
}

app.use(session(sessionConfig));

// Middleware to parse JSON and URL-encoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/v1', apiRoutes);

// Mobile connection debugging middleware
app.use((req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const isMobile = /Mobile|Android|iPhone|iPad|BlackBerry|Windows Phone/i.test(userAgent);

  if (isMobile) {
    console.log(`📱 Mobile request from ${req.ip}: ${req.method} ${req.originalUrl}`);
    console.log(`   User-Agent: ${userAgent}`);

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
    console.log(`${req.method} ${req.originalUrl} - ${req.ip}`);
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
    // Generate or retrieve CSRF token
    const token = csrfProtection.create(req.session.csrfSecret);
    res.locals.csrfToken = token;
    req.csrfToken = () => token;
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

    if (!token || !secret || !csrfProtection.verify(secret, token)) {
      return res.status(403).json({
        success: false,
        message: 'Invalid CSRF token. Please refresh the page and try again.',
      });
    }
    next();
  } catch (error) {
    console.error('CSRF validation error:', error);
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
          console.error('Session regeneration error:', err);
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
            console.error('Session save error:', err);
            return res.redirect('/admin/login?error=server');
          }
          res.redirect('/admin/');
        });
      });
    } else {
      console.log(`Failed login attempt for username: ${username}`);
      res.redirect('/admin/login?error=invalid');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.redirect('/admin/login?error=server');
  }
});

// Admin logout endpoint
app.post('/admin/logout', validateCSRF, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Session destruction error:', err);
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
    const token = csrfProtection.create(req.session.csrfSecret);
    res.json({ csrfToken: token });
  } else {
    res.status(500).json({ error: 'Session not available' });
  }
});

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

    console.log(`Contact form submission:
      Name: ${sanitizedName}
      Email: ${sanitizedEmail}
      Subject: ${sanitizedSubject}
      Message: ${sanitizedMessage}
    `);

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
  console.log('✅ SSL certificates loaded successfully');
} catch (err) {
  console.warn('⚠️  Could not load SSL certificates:', err.message);
  console.warn('   HTTPS server will not be available');
}

// Initialize database connection
async function startServer() {
  try {
    console.log('🔌 Initializing database connections...');
    const dbInitialized = await initializeDatabase();

    if (!dbInitialized) {
      console.warn('⚠️  Database connection failed - continuing without database features');
    }

    // Configure server timeout settings for mobile devices
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`🌐 Evgenia's art website running:`);
      console.log(`   HTTP:  http://localhost:${port}`);
      console.log(`   Main site: http://localhost:${port}/`);
      console.log(`   Gallery: http://localhost:${port}/gallery`);
      console.log(`   Admin panel: http://localhost:${port}/admin/`);
      console.log(`   API: http://localhost:${port}/api/v1/health`);
    });
    
    // Configure timeouts and debugging
    configureServerTimeouts(server);
    addConnectionDebugging(server, 'HTTP');
    addServerErrorHandling(server, 'HTTP', port);
    addClientErrorHandling(server, 'HTTP');

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer()
  .then(server => {
    global.httpServer = server;
  })
  .catch(error => {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
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
  
  // Configure timeouts and debugging for HTTPS server
  configureServerTimeouts(httpsServer);
  addConnectionDebugging(httpsServer, 'HTTPS');
  addServerErrorHandling(httpsServer, 'HTTPS', httpsPort);
  addClientErrorHandling(httpsServer, 'HTTPS');
}

console.log(`✅ Compression middleware enabled (gzip/deflate)`);
console.log(
  `✅ Security headers configured for ${isDevelopment ? 'development' : 'production'} environment`
);
console.log(
  `✅ HSTS ${isDevelopment ? 'disabled' : 'enabled'} (development mode: ${isDevelopment})`
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
  console.log('\n📱 Mobile device access:');
  localIPs.forEach(ip => {
    console.log(`   HTTP:  http://${ip}:${port}`);
    if (httpsOptions) {
      console.log(`   HTTPS: https://${ip}:${httpsPort} (self-signed certificate)`);
    }
  });
  console.log('\n💡 For mobile browsers having issues:');
  console.log('   1. Try HTTPS first (accept security warning)');
  console.log('   2. If still issues, check firewall settings');
  console.log('   3. Both devices must be on same WiFi network');
  console.log('   4. Some mobile browsers auto-upgrade to HTTPS');
}

// Configure server timeouts for better mobile support
function configureServerTimeouts(srv) {
  srv.timeout = 120000; // 2 minutes
  srv.headersTimeout = 120000; // 2 minutes
  srv.keepAliveTimeout = 65000; // 65 seconds
}

// Server timeout configuration will be done after server creation

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
        console.log(
          `⚠️  Mobile browser error on ${serverType} from ${socket.remoteAddress}: ${err.message}`
        );

        // Show what data was received if available
        if (rawRequestData.length > 0) {
          const preview = rawRequestData
            .toString('ascii', 0, Math.min(100, rawRequestData.length))
            .replace(/[^\x20-\x7E]/g, '?');
          console.log(`   Received data: "${preview}"`);
        }

        // Safely destroy the socket
        if (!socket.destroyed) {
          socket.destroy();
        }
        return;
      }
      console.error(`${serverType} socket error from ${socket.remoteAddress}:`, err.message);
    });

    socket.on('timeout', () => {
      console.warn(
        `${serverType} socket timeout from ${socket.remoteAddress}:${socket.remotePort}`
      );
      if (!socket.destroyed) {
        socket.destroy();
      }
    });

    socket.on('close', hadError => {
      if (hadError) {
        console.log(`⚠️  ${serverType} socket closed with error from ${socket.remoteAddress}`);
      }
    });
  });
}

// Connection debugging is now configured in the server initialization

// Handle server errors
function addServerErrorHandling(srv, serverType, serverPort) {
  srv.on('error', err => {
    console.error(`${serverType} server error:`, err);
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Port ${serverPort} is already in use. Please stop other servers or use a different port.`
      );
    }
  });
}

// Server error handling is now configured in the server initialization

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
      console.log(`⚠️  Mobile browser ${serverType} parsing error (${err.code}): ${err.message}`);
      if (serverType === 'HTTP') {
        console.log(
          `💡 Tip: Mobile browser likely trying HTTPS - use https://your-ip:${httpsPort} instead`
        );
      }

      // For TLS handshake attempts on HTTP or parsing errors on HTTPS, just close the connection
      if (socket.writable && !socket.destroyed) {
        socket.destroy();
      }
      return;
    }

    // Handle other client errors
    console.error(`${serverType} client error:`, err.message);
    if (socket.writable && !socket.destroyed) {
      try {
        socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
      } catch (writeErr) {
        socket.destroy();
      }
    }
  });
}

// Client error handling is now configured in the server initialization

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);

  // Close database connections first
  try {
    await closeConnections();
    console.log('Database connections closed.');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }

  const servers = [global.httpServer];
  if (httpsServer) {
    servers.push(httpsServer);
  }

  let closedCount = 0;
  const totalServers = servers.length;

  servers.forEach((srv, index) => {
    if (srv) {
      srv.close(() => {
        closedCount++;
        console.log(`${index === 0 ? 'HTTP' : 'HTTPS'} server closed.`);

        if (closedCount === totalServers) {
          console.log('All servers closed.');
          process.exit(0);
        }
      });
    } else {
      closedCount++;
      if (closedCount === totalServers) {
        console.log('All servers closed.');
        process.exit(0);
      }
    }
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
