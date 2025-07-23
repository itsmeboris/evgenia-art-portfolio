// Simple Express server to serve the website locally
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Admin authentication configuration
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'artadmin2024'; // Change this to a secure password

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple session storage (in production, use proper session management)
const sessions = new Map();

// Authentication middleware
function requireAuth(req, res, next) {
  const sessionId = req.headers.cookie?.split('sessionId=')[1]?.split(';')[0];
  
  if (sessionId && sessions.has(sessionId)) {
    next();
  } else {
    res.redirect('/admin/login');
  }
}

// Admin login endpoint
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const sessionId = Date.now().toString() + Math.random().toString(36);
    sessions.set(sessionId, { username, timestamp: Date.now() });
    
    res.setHeader('Set-Cookie', `sessionId=${sessionId}; Path=/; Max-Age=3600`);
    res.redirect('/admin/');
  } else {
    res.redirect('/admin/login?error=invalid');
  }
});

// Admin logout endpoint
app.post('/admin/logout', (req, res) => {
  const sessionId = req.headers.cookie?.split('sessionId=')[1]?.split(';')[0];
  if (sessionId) {
    sessions.delete(sessionId);
  }
  res.setHeader('Set-Cookie', 'sessionId=; Path=/; Max-Age=0');
  res.redirect('/admin/login');
});

// Login page (no authentication required) - clean URL
app.get('/admin/login', (req, res) => {
  // Check if user is already logged in
  const sessionId = req.headers.cookie?.split('sessionId=')[1]?.split(';')[0];
  
  if (sessionId && sessions.has(sessionId)) {
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

// Serve static files from the current directory (excluding admin folder)
app.use(express.static(path.join(__dirname), {
  // Set cache control headers to improve performance
  maxAge: '1d',
  // Set proper MIME types
  setHeaders: (res, filePath) => {
    // For JavaScript files
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    // For CSS files
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Clean URLs for the main site (no .html extension needed)
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

// Route for individual artwork pages
app.get('/artwork/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'artwork.html'));
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Evgenia's art website running at http://localhost:${port}`);
  console.log(`- Main site: http://localhost:${port}/`);
  console.log(`- Gallery: http://localhost:${port}/gallery`);
  console.log(`- Admin panel: http://localhost:${port}/admin/`);

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
    console.log('\nYou can also access this site from other devices on your network:');
    localIPs.forEach((ip) => {
      console.log(`http://${ip}:${port}`);
    });
  }
});