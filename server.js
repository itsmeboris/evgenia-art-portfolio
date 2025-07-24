// Simple Express server to serve the website locally
require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const { v4: uuidv4 } = require('uuid');
const compression = require('compression');
const csrf = require('csrf');
const app = express();
const port = process.env.PORT || 3000;

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
    console.warn('⚠️  WARNING: SESSION_SECRET not set in .env file. Using generated secret (not recommended for production).');
}

// Compression middleware (must be early in the chain)
app.use(compression({
    level: 6, // Compression level (1-9, 6 is default)
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
        // Skip compression for certain file types or conditions
        if (req.headers['x-no-compression']) {
            return false;
        }
        // Fall back to standard filter function
        return compression.filter(req, res);
    }
}));

// Security middleware - configured for development/production
const isDevelopment = process.env.NODE_ENV !== 'production';

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            scriptSrcAttr: ["'unsafe-inline'", "'unsafe-hashes'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:", ...(isDevelopment ? ["http:"] : [])],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    // Disable HSTS in development to avoid SSL issues
    hsts: isDevelopment ? false : {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Rate limiting for form submissions
const formLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: { success: false, message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting for admin login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: { success: false, message: 'Too many login attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
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
        sameSite: isDevelopment ? 'lax' : 'strict' // More permissive in development
    },
    name: 'evgenia.sid' // Custom session name
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
    
    sessionStore.on('error', (error) => {
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

// Mobile connection debugging middleware
app.use((req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const isMobile = /Mobile|Android|iPhone|iPad|BlackBerry|Windows Phone/i.test(userAgent);
  
  if (isMobile) {
    console.log(`📱 Mobile request from ${req.ip}: ${req.method} ${req.originalUrl}`);
    console.log(`   User-Agent: ${userAgent}`);
    
    // Only set no-cache headers for HTML pages, not images or assets
    if (req.originalUrl.endsWith('.html') || req.originalUrl.endsWith('/') || 
        (!req.originalUrl.includes('.') && !req.originalUrl.startsWith('/public'))) {
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
        message: 'Invalid CSRF token. Please refresh the page and try again.' 
      });
    }
    next();
  } catch (error) {
    console.error('CSRF validation error:', error);
    return res.status(403).json({ 
      success: false, 
      message: 'CSRF validation failed. Please refresh the page and try again.' 
    });
  }
}

// Admin login endpoint
app.post('/admin/login', loginLimiter, validateCSRF, async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check username and verify password with bcrypt
    if (username === ADMIN_USERNAME && await bcrypt.compare(password, ADMIN_PASSWORD_HASH)) {
      // Regenerate session ID to prevent session fixation
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.redirect('/admin/login?error=server');
        }

        // Set session data
        req.session.user = {
          username: username,
          authenticated: true,
          loginTime: new Date().toISOString()
        };

        // Save session
        req.session.save((err) => {
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
  req.session.destroy((err) => {
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
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    server: 'Evgenia Portnov Art Website',
    client: {
      ip: req.ip,
      userAgent: userAgent,
      isMobile: isMobile,
      headers: req.headers
    },
    session: {
      id: req.session?.id || 'No session',
      exists: !!req.session
    }
  });
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
app.use('/public', express.static(path.join(__dirname, 'public'), {
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
  }
}));



// Route for individual artwork pages
app.get('/artwork/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'artwork.html'));
});

// Newsletter subscription endpoint
app.post('/newsletter/subscribe', 
  formLimiter,
  validateCSRF,
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address.')
      .normalizeEmail()
      .isLength({ max: 254 })
      .withMessage('Email address is too long.')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg 
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
app.post('/contact/submit', 
  formLimiter,
  validateCSRF,
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters.')
      .matches(/^[a-zA-Z\s\-\.]+$/)
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
      .matches(/^[a-zA-Z0-9\s\-\.\,\!\?]+$/)
      .withMessage('Subject contains invalid characters.'),
    body('message')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Message must be between 10 and 2000 characters.')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg
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
      message: `Thank you for your message, ${sanitizedName}! I will get back to you as soon as possible.`
    });
  }
);

// Catch-all for any unmatched requests - send 404 without logging ENOENT errors
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Configure server timeout settings for mobile devices
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Evgenia's art website running at http://localhost:${port}`);
  console.log(`- Main site: http://localhost:${port}/`);
  console.log(`- Gallery: http://localhost:${port}/gallery`);
  console.log(`- Admin panel: http://localhost:${port}/admin/`);
  console.log(`✅ Compression middleware enabled (gzip/deflate)`);
  console.log(`✅ Security headers configured for ${isDevelopment ? 'development' : 'production'} environment`);
  console.log(`✅ HSTS ${isDevelopment ? 'disabled' : 'enabled'} (development mode: ${isDevelopment})`);

  // Show local network access information
  const interfaces = require('os').networkInterfaces();
  const localIPs = [];

  // Get all local IP addresses
  Object.keys(interfaces).forEach((interfaceName) => {
    interfaces[interfaceName].forEach((iface) => {
      // Skip internal/non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        localIPs.push(iface.address);
      }
    });
  });

  if (localIPs.length > 0) {
    console.log('\n📱 Mobile device access (HTTP only in development):');
    localIPs.forEach((ip) => {
      console.log(`   http://${ip}:${port}`);
    });
    console.log('\n⚠️  Note: Use HTTP (not HTTPS) for mobile access in development');
    console.log('💡 If mobile devices can\'t connect, check:');
    console.log('   1. Firewall settings (allow port 3000)');
    console.log('   2. Antivirus software blocking connections');
    console.log('   3. Router/network configuration');
    console.log('   4. Both devices on same WiFi network');
  }
});

// Configure server timeouts for better mobile support
server.timeout = 120000; // 2 minutes
server.headersTimeout = 120000; // 2 minutes  
server.keepAliveTimeout = 65000; // 65 seconds

// Add connection debugging
server.on('connection', (socket) => {
  console.log(`New connection from ${socket.remoteAddress}:${socket.remotePort}`);
  
  socket.on('error', (err) => {
    console.error(`Socket error from ${socket.remoteAddress}:`, err.message);
  });
  
  socket.on('timeout', () => {
    console.warn(`Socket timeout from ${socket.remoteAddress}:${socket.remotePort}`);
  });
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please stop other servers or use a different port.`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});