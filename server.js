// Simple Express server to serve the website locally
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the current directory with proper options
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

// Clean URL for the admin interface index
app.get('/admin', (req, res) => {
  res.redirect('/admin/');
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