# Evgenia Portnov | Artist Portfolio & E-commerce Website

A modern, responsive portfolio and e-commerce website for artist Evgenia Portnov. The site showcases her artwork while providing a seamless shopping experience through an integrated shopping cart system.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd evgenia-art-portfolio

# Interactive setup (includes database setup)
node scripts/utilities/setup.js

# Or manual setup:
npm install                    # Install dependencies
cp .env.example .env          # Copy environment template
# Edit .env with your configuration
npm run db:setup              # Initialize database and migrate data
npm run build:prod            # Build for production

# Start the application
npm run start:prod
```

## 📦 Production Deployment

See [SYSTEMD_DEPLOYMENT.md](docs/SYSTEMD_DEPLOYMENT.md) for detailed deployment instructions with enterprise-grade security.

## 📚 Documentation

All project documentation is organized in the `docs/` folder:

- [Architecture Overview](docs/ARCHITECTURE.md)
- [systemd Deployment Guide](docs/SYSTEMD_DEPLOYMENT.md) - **Comprehensive production deployment**
- [Workflow Integration](docs/WORKFLOW_INTEGRATION.md) - **Setup script integration**
- [Legacy Deployment Guide](docs/DEPLOYMENT.md) - Basic deployment reference
- [Quick Start Guide](docs/QUICKSTART.md)
- [NPM Commands Reference](docs/NPM_COMMANDS.md)

## Project Overview

The website features:

- A clean, elegant design with a turquoise color scheme
- Responsive layout that works on all devices (mobile, tablet, desktop)
- Gallery with filtering by artwork categories (Floral, Towns, Birds)
- About page that tells Evgenia's artistic journey
- Contact page with a form and FAQs
- **Modern modular JavaScript architecture** with performance optimization
- **PostgreSQL database** with complete data management system
- **RESTful API v1** with comprehensive CRUD operations
- **Shopping cart system** with database persistence
- **Order management** with complete e-commerce workflow
- **Advanced image loading** with lazy loading and lightbox functionality
- **Real-time search** with debouncing and search history
- **Comprehensive error handling** with automatic recovery

## 🏗️ JavaScript Architecture

**Recently Refactored (2025):** The website has been completely refactored from a monolithic 1,710-line JavaScript file into a modern, maintainable modular architecture:

### Core Modules

#### 🛒 **Cart Module** (`src/js/modules/cart.js`)

- Complete shopping cart system with CartManager class
- localStorage persistence for cart state
- Currency management (USD/CAD/EUR) with conversion
- Performance optimization with render queuing
- Concurrency control and state management
- Error handling and recovery mechanisms

#### 🎨 **UI Module** (`src/js/modules/ui.js`)

- Mobile menu with accessibility features
- FAQ toggles and accordion functionality
- Smooth scroll effects and responsive handling
- Focus management and keyboard navigation
- Utility functions for DOM manipulation

#### 🔍 **Lightbox Module** (`src/js/modules/lightbox.js`)

- Image viewing with gallery navigation
- Keyboard support (arrow keys, escape)
- Image preloading and caching for performance
- Mobile optimization with touch gestures
- Accessibility features and screen reader support

#### 🔎 **Search Module** (`src/js/modules/search.js`)

- Real-time artwork search with modal interface
- Debounced input for performance (300ms delay)
- Search history with localStorage persistence
- Result highlighting and relevance scoring
- Advanced filtering by category, price, and keywords

#### 📝 **Forms Module** (`src/js/modules/forms.js`)

- Newsletter and contact form handling
- Real-time validation with user feedback
- Rate limiting to prevent spam
- Accessibility enhancements (ARIA labels, focus management)
- Comprehensive error handling and user notifications

#### ⚠️ **Error Handler Module** (`src/js/modules/error-handler.js`)

- Global error management with event listeners
- Component-level error boundaries
- Automatic recovery strategies with graceful degradation
- User-friendly error messages with retry options
- Error categorization and logging system

#### 🛠️ **Utils Module** (`src/js/modules/utils.js`)

- Performance helpers (debounce, throttle)
- Data manipulation and string formatting utilities
- Storage helpers for localStorage management
- Device detection and responsive utilities
- Animation and easing functions

#### 📊 **Logging System** (`src/js/modules/browser-logger.js` + Winston server-side)

- **Structured logging** with JSON format and contextual metadata
- **Browser-compatible logger** that sends logs to server endpoint `/api/logs`
- **Server-side Winston integration** with daily log rotation and archival
- **Development/production modes** with appropriate log levels and console output
- **Performance tracking** with session IDs and user interaction logging
- **Automatic log transmission** with offline buffering and retry mechanisms

#### 🖼️ **Lazy Loader Module** (`src/js/modules/lazy-loader.js`)

- Intersection Observer-based image loading
- Concurrency control (max 3 simultaneous loads)
- Retry logic with exponential backoff
- Performance tracking and queue management
- SVG placeholder generation for loading states

#### 💀 **Skeleton Loader Module** (`src/js/modules/skeleton-loader.js`)

- Comprehensive skeleton loading system for improved perceived performance
- Multiple skeleton types: gallery, artwork-detail, featured, collections, search, forms
- Animated loading placeholders with shimmer effects
- Responsive design with dark mode support
- Automatic skeleton management with withSkeleton() utility
- Accessibility features with proper ARIA labels

### 🎯 **App Manager** (`src/js/main.js`)

The central coordinator that:

- **Priority-based module loading**: Critical → Essential → Features
- **Performance monitoring**: Track load times, memory usage, error rates
- **Retry mechanisms**: Exponential backoff for failed module loads
- **Memory management**: Automatic cleanup every 5 minutes
- **Development tools**: Performance dashboard and debugging utilities

## 🚀 Performance Features

### Loading Strategy

- **Async module loading** for non-blocking initialization
- **Priority-based loading**: Critical modules load first, features load with delay
- **Retry mechanisms**: Up to 3 attempts with exponential backoff
- **Performance caching**: Intelligent cache expiration and memory management

### Error Recovery

- **Component isolation**: Failed components don't crash the entire application
- **Auto-recovery**: Components self-heal after 5 seconds
- **Graceful degradation**: Fallback UI when components fail
- **User feedback**: Friendly error messages with retry buttons

### Development Tools

Access development tools in browser console:

```javascript
// Performance dashboard
window.app.dev.showDashboard();

// Detailed performance report
window.app.dev.getFullReport();

// Run performance tests
window.app.dev.testPerformance();

// Export performance data
window.app.dev.exportData();
```

## Project Structure

```
evgenia-art-portfolio/
├── 📚 docs/                    # All documentation centralized
│   ├── SYSTEMD_DEPLOYMENT.md    # Complete deployment guide
│   ├── WORKFLOW_INTEGRATION.md  # Setup integration guide
│   └── ...                      # Other documentation
├── 🚀 scripts/                 # All scripts organized
│   ├── deployment/              # Deployment configurations
│   │   └── systemd/             # systemd service files
│   └── *.sh                     # Deployment scripts
├── 📋 README.md                # Updated with new references
├── 📦 package.json
└── 🔒 [NO .service files]      # Clean root directory
```

## Shopping Cart Integration

The website includes a comprehensive shopping cart system:

### Features

- **Add to Cart**: Direct integration from gallery and individual artwork pages
- **Cart Management**: View, update quantities, remove items
- **Currency Support**: USD, CAD, EUR with automatic conversion
- **Persistence**: Cart state saved in localStorage
- **Performance**: Optimized rendering with queue system
- **Error Handling**: Robust error recovery and user feedback

### Cart API

```javascript
// Add item to cart
await window.cart.addToCart(artworkId, quantity);

// Get cart contents
const items = window.cart.getItems();

// Update item quantity
await window.cart.updateItemQuantity(artworkId, newQuantity);

// Remove item
await window.cart.removeItem(artworkId);

// Clear cart
window.cart.clearCart();

// Get cart total
const total = window.cart.getTotal();
```

## Customization

### Adding New Artwork

1. Add the artwork image to `/public/assets/images/`
2. Update the central data file at `/public/data/artwork-data.json`:
   ```json
   {
     "id": "unique-artwork-id",
     "title": "Artwork Title",
     "category": "floral", // or "towns", "birds"
     "price": 150,
     "currency": "USD",
     "image": "path/to/image.jpg",
     "description": "Artwork description",
     "dimensions": "16x20 inches",
     "medium": "Watercolor on paper"
   }
   ```
3. The artwork will automatically appear in the gallery and be searchable

### Managing Content with Admin Panel

Access the admin panel at `/admin/` to:

- Add, edit, and delete artwork entries
- Upload new images
- Manage categories and pricing
- View analytics and performance data

### Changing Colors

To change the color scheme, edit the CSS variables in `public/css/style.css`:

```css
:root {
  /* Colors */
  --primary-color: #40e0d0; /* Turquoise as primary accent color */
  --primary-dark: #2fb3a8;
  --primary-light: #6bece0;
  /* ... other colors ... */
}
```

### Extending JavaScript Modules

The modular architecture makes it easy to extend functionality:

#### Adding a New Module

1. Create a new file in `/src/js/modules/your-module.js`
2. Follow the module pattern:

   ```javascript
   class YourModule {
     constructor() {
       this.initialized = false;
     }

     async init() {
       if (this.initialized) return;
       // Your initialization code
       this.initialized = true;
     }

     // Your module methods
   }

   window.YourModule = YourModule;
   ```

3. Register the module in `main.js` module loading configuration

#### Customizing Existing Modules

Each module is self-contained and can be modified independently:

- **Cart**: Modify pricing logic, add discount codes, integrate payment gateways
- **Search**: Add new search filters, modify ranking algorithms
- **Lightbox**: Add new gallery features, modify navigation
- **Forms**: Add new form types, modify validation rules

## Development

### Running Locally

To run this project locally and avoid CORS issues:

1. **Install Node.js** from [nodejs.org](https://nodejs.org/)
2. **Clone the repository** and navigate to the project directory
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the development server**:
   ```bash
   npm run start:dev
   ```
5. **Access the website**:
   - **HTTP**: [http://localhost:3000](http://localhost:3000)
   - **HTTPS**: [https://localhost:3443](https://localhost:3443) (with self-signed certificate)

### Mobile Device Access

The server supports both HTTP and HTTPS for mobile device compatibility:

- **HTTP**: `http://your-local-ip:3000`
- **HTTPS**: `https://your-local-ip:3443` (accept security warning for self-signed certificate)

**Note**: Some mobile browsers automatically upgrade to HTTPS, which may cause connection issues with HTTP-only servers. This setup provides both protocols to ensure compatibility.

### Development Features

The modular architecture includes several development tools:

#### Performance Monitoring

Monitor your website's performance in real-time:

```javascript
// View live performance dashboard
window.app.dev.showDashboard();

// Get detailed metrics
const report = window.app.dev.getFullReport();
console.log(report.performance.moduleLoadTimes);
console.log(report.cart.performanceMetrics);
console.log(report.errors.componentHealth);
```

#### Memory Management

Track and optimize memory usage:

```javascript
// Monitor memory usage
window.app.dev.getMemoryReport();

// Force cleanup (normally automatic)
window.app.cleanup();
```

#### Error Testing

Test error boundaries and recovery:

```javascript
// Test component error handling
window.app.dev.testErrorBoundaries();

// Simulate component failures
window.app.dev.simulateError('cart'); // or 'search', 'lightbox', etc.
```

### Code Quality

The codebase follows modern JavaScript best practices:

- **ES6+ Features**: Classes, async/await, destructuring, template literals
- **Error Handling**: Comprehensive try-catch blocks with user-friendly recovery
- **Performance**: Debouncing, throttling, lazy loading, memory management
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Responsive Design**: Mobile-first approach with progressive enhancement

### File Organization

The modular structure promotes:

- **Separation of Concerns**: Each module handles a specific functionality
- **Maintainability**: Easy to locate and modify specific features
- **Testability**: Modules can be tested independently
- **Scalability**: New features can be added as separate modules
- **Performance**: Modules load only when needed

## Deployment

### Standard Deployment

To deploy this website:

1. **Build for production** (optional optimization):

   ```bash
   npm run build:prod  # Build optimized production bundles
   ```

2. **Upload files** to your web hosting server:
   - All HTML files (index.html, gallery.html, etc.)
   - Complete `/public/` directory with all assets
   - `server.js` and `package.json` if using Node.js hosting
   - `/admin/` directory for content management

3. **Configure server settings**:
   - Enable HTTPS for security
   - Set up proper MIME types for static files
   - Configure URL rewriting for artwork detail pages

### Node.js Hosting

For hosting providers that support Node.js:

1. **Upload all files** including `server.js` and `package.json`
2. **Install dependencies** on the server:
   ```bash
   npm install --production
   ```
3. **Start the application**:
   ```bash
   npm run start:prod
   ```
4. **Configure environment**:
   - Set `PORT` environment variable if required
   - Configure any necessary firewall rules

### Static Hosting

For static hosting (GitHub Pages, Netlify, etc.):

- Upload all files except `server.js`
- The website will work with basic functionality
- Some features may require a backend (contact forms, admin panel)

## Accessing Your Site

### Local Network Access

The server is configured to listen on all network interfaces with both HTTP and HTTPS support:

1. Start the server:
   ```
   npm run start:dev
   ```
2. Look for the local network URLs in the console output:
   ```
   📱 Mobile device access:
      HTTP:  http://192.168.1.57:3000
      HTTPS: https://192.168.1.57:3443 (self-signed certificate)
   ```
3. **For mobile devices**: Use HTTPS first if your mobile browser has connection issues with HTTP

### Remote Access with ngrok

To make your locally running website accessible from anywhere on the internet:

1. Install ngrok:

   ```
   npm install -g ngrok
   ```

2. Sign up for a free account at [ngrok.com](https://dashboard.ngrok.com/signup)

3. Add your authtoken (you only need to do this once):

   ```
   ngrok authtoken YOUR_AUTH_TOKEN
   ```

4. Start your website (in one terminal):

   ```
   npm run start:dev
   ```

5. Start the ngrok tunnel (in a second terminal):

   ```
   ngrok http 3000
   ```

6. Ngrok will display a public URL (like `https://abc123.ngrok.io`) that you can use to access your site from anywhere

**Note:**

- Both the server and ngrok need to be running simultaneously
- Free ngrok URLs change each time you restart ngrok
- Anyone with the ngrok URL can access your site

## Performance Optimization

The website includes several performance optimizations:

### Image Loading

- **Lazy Loading**: Images load only when entering the viewport
- **Progressive Enhancement**: Placeholder images while loading
- **Optimized Formats**: Support for WebP and other modern formats
- **Responsive Images**: Different sizes for different screen sizes

### JavaScript Performance

- **Module Splitting**: Code is split into focused, cacheable modules
- **Async Loading**: Non-critical modules load asynchronously
- **Memory Management**: Automatic cleanup prevents memory leaks
- **Caching**: Intelligent caching reduces redundant operations

### User Experience

- **Error Boundaries**: Failed components don't crash the entire site
- **Graceful Degradation**: Site works even when JavaScript fails
- **Accessibility**: Full keyboard navigation and screen reader support
- **Progressive Enhancement**: Core functionality works without JavaScript

## Browser Support

The website is compatible with:

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (last 2 versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Legacy Support**: Graceful degradation for older browsers
- **Accessibility**: Screen readers and assistive technologies

## Troubleshooting

### Common Issues

#### Module Loading Errors

If you see module loading errors in the console:

1. Check that all module files exist in `/src/js/modules/`
2. Verify the server is running (for absolute path resolution)
3. Check browser console for specific error messages
4. Use development tools: `window.app.dev.testPerformance()`

#### Cart Not Working

If the shopping cart isn't functioning:

1. Check localStorage availability: `window.app.dev.getFullReport().cart`
2. Verify artwork data format in `/public/data/artwork-data.json`
3. Check for JavaScript errors in browser console

#### Performance Issues

If the site feels slow:

1. Monitor performance: `window.app.dev.showDashboard()`
2. Check memory usage: `window.app.dev.getMemoryReport()`
3. Test error boundaries: `window.app.dev.testErrorBoundaries()`

#### Images Not Loading

If images aren't displaying properly:

1. Verify image paths in artwork data
2. Check lazy loading status: Look for "lazy-loader" in console
3. Test on different network conditions

### Getting Help

For technical issues:

1. Check browser console for error messages
2. Use built-in development tools (`window.app.dev`)
3. Review module-specific documentation in code comments
4. Test with different browsers and devices

## File Structure

- `index.html` - Main website home page
- `gallery.html` - Artwork gallery page
- `artwork.html` - Individual artwork detail pages
- `public/` - Contains all assets (images, CSS, JS)
  - `public/data/artwork-data.json` - Central data file for all artwork
  - `src/js/modules/` - Modular JavaScript architecture
- `admin/` - Admin interface for managing artwork
  - `admin/index.html` - Admin panel
  - `admin/README.md` - Admin documentation
- `server.js` - Node.js server with proper routing and static file serving

## Content Management

All artwork data is stored in a single JSON file at `public/data/artwork-data.json`. Both the main website and admin panel read from and write to this file. The modular architecture ensures data consistency and provides real-time updates across all components.

## Credits

- **Design inspiration**: [Mariella Paints](https://mariellapaints.com/)
- **Fonts**: [Google Fonts](https://fonts.google.com/) (Cormorant Garamond & Montserrat)
- **Icons**: [Font Awesome](https://fontawesome.com/)
- **Architecture**: Modern JavaScript ES6+ with modular design principles
- **Performance**: Optimized with lazy loading, caching, and error boundaries

## Recent Updates (2025)

- ✅ **Complete JavaScript refactoring** from monolithic to modular architecture
- ✅ **Performance optimization** with lazy loading and intelligent caching
- ✅ **Shopping cart system** with localStorage persistence
- ✅ **Advanced error handling** with automatic recovery
- ✅ **Real-time search** with debouncing and history
- ✅ **Comprehensive testing** and development tools
- ✅ **Mobile optimization** and accessibility improvements
- ✅ **Server routing fixes** and static file handling
- ✅ **HTTPS support** with self-signed certificates for mobile compatibility
- ✅ **Dual HTTP/HTTPS servers** for comprehensive development testing
- ✅ **Skeleton loading system** with animated placeholders for improved UX
- ✅ **Enhanced 404 page** with search functionality and featured artworks
- ✅ **Structured logging system** with Winston server-side and browser-compatible frontend logging
- ✅ **Centralized log management** with JSON format, contextual metadata, and automatic rotation
- ✅ **Webpack build optimization** with core.js bundle for essential modules and logger availability

## License

All rights reserved. This website and its content belong to Evgenia Portnov.
