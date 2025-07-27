# Evgenia Art Portfolio - Architecture Documentation

## Executive Summary

The Evgenia Art Portfolio is a modern, full-stack web application built to showcase and sell artwork by artist Evgenia Portnov. The project represents a sophisticated e-commerce platform with a clean, responsive design and modular architecture that was recently refactored (January 2025) from a monolithic structure to a maintainable, scalable system.

**Key Highlights:**
- **Technology Stack:** Node.js/Express backend, Vanilla JavaScript frontend with Webpack bundling
- **Architecture:** Server-side rendered HTML with progressive enhancement, modular JS architecture
- **Current Status:** 70% feature complete, production-ready with ongoing enhancements
- **Deployment:** PM2 process management, HTTPS support, session-based authentication

## Technology Stack

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js 4.18.2
- **Session Management:** express-session with FileStore/MongoDB support
- **Security:** Helmet, bcrypt, CSRF protection, rate limiting
- **Logging:** Winston with daily rotation
- **Process Manager:** PM2 for production deployment

### Frontend
- **Core:** Vanilla JavaScript (ES6+) with modular architecture
- **Build Tool:** Webpack 5 with code splitting and optimization
- **CSS:** Modular CSS with Webpack extraction and minification
- **Image Handling:** WebP conversion, lazy loading, lightbox functionality

### Data Storage
- **Current:** JSON file-based storage (`public/data/artwork-data.json`)
- **Sessions:** File-based or MongoDB sessions
- **Future:** PostgreSQL migration planned (HIGH priority)

## Project Structure

```
evgenia-art-portfolio/
├── admin/                    # Admin panel for artwork management
│   ├── index.html           # Admin dashboard
│   ├── login.html           # Authentication page
│   └── js/                  # Admin-specific JavaScript
├── public/                  # Static assets served directly
│   ├── assets/
│   │   └── images/         # Artwork images (WebP format)
│   ├── css/                # Global stylesheets
│   ├── data/               # JSON data files
│   │   └── artwork-data.json
│   └── dist/               # Webpack build output
├── src/                    # Source code
│   └── js/
│       ├── modules/        # Modular JavaScript components
│       │   ├── cart.js     # Shopping cart system
│       │   ├── search.js   # Real-time search
│       │   ├── lightbox.js # Image viewer
│       │   ├── logger.js   # Frontend logging
│       │   └── ...         # 15 specialized modules
│       └── main.js         # Entry point
├── scripts/                # Build and utility scripts
├── server.js              # Express server configuration
├── webpack.config.js      # Build configuration
└── ecosystem.config.js    # PM2 deployment config
```

## Architecture Overview

### 1. **Frontend Architecture**

The frontend follows a **Progressive Enhancement** pattern with modular JavaScript:

**Module System:**
- **15 Specialized Modules** handling specific concerns (cart, search, forms, etc.)
- **Event-driven communication** between modules
- **Lazy loading** for performance optimization
- **Error boundaries** with automatic recovery

**Key Modules:**
- `cart.js` - Complete e-commerce cart with localStorage persistence
- `search.js` - Real-time search with debouncing and history
- `lightbox.js` - Advanced image viewer with touch support
- `error-handler.js` - Comprehensive error management
- `logger.js` - Structured frontend logging

**Build Process:**
- Webpack 5 with multiple entry points
- Code splitting for optimal loading
- Terser for minification
- CSS extraction and optimization

### 2. **Backend Architecture**

Express.js server with layered middleware architecture:

**Request Flow:**
1. **Security Layer:** Helmet, rate limiting, CSRF protection
2. **Session Management:** File-based or MongoDB sessions
3. **Authentication:** Session-based admin auth with bcrypt
4. **API Routes:** RESTful endpoints for data operations
5. **Static Serving:** Optimized asset delivery with caching

**Security Features:**
- Rate limiting (100 requests/15min general, 10/15min for login)
- CSRF tokens for form submissions
- Secure session configuration
- Input validation and sanitization
- Comprehensive error handling

### 3. **Data Architecture**

**Current State:**
- Artwork data stored in JSON file (`artwork-data.json`)
- 40+ artwork entries with metadata
- Categories: Floral, Towns, Birds
- Session data in file system or MongoDB

**Data Structure:**
```json
{
  "id": "unique-identifier",
  "title": "Artwork Title",
  "category": "birds|floral|towns",
  "dimensions": "20cm X 20cm",
  "medium": "Acrylic on Canvas",
  "price": 500,
  "image": "path/to/webp/image",
  "featured": false
}
```

## Current Implementation Status

### ✅ Completed Features (35/50 - 70%)

1. **Core Functionality**
   - Responsive design with mobile optimization
   - Gallery with category filtering
   - Shopping cart with persistence
   - Real-time search functionality
   - Image optimization and lazy loading

2. **Infrastructure**
   - Comprehensive logging system (Winston)
   - Build pipeline with Webpack
   - PM2 deployment configuration
   - HTTPS support with SSL
   - Session management

3. **Security**
   - Admin authentication system
   - CSRF protection
   - Rate limiting
   - Input validation
   - Secure headers (Helmet)

### 🚧 In Progress / Planned

**High Priority:**
1. **Database Migration** (3-5 days)
   - Move from JSON to PostgreSQL
   - Design proper schema
   - Implement migration scripts

**Medium Priority:**
1. **API Architecture** (2 days) - 60% complete
   - Versioned API structure (/api/v1/)
   - OpenAPI documentation
   - Consistent error responses

2. **Progressive Web App** (2 days) - 33% complete
   - Service worker implementation
   - Offline functionality
   - Enhanced caching strategy

3. **Testing Suite** (3-4 days) - Not started
   - Jest unit tests
   - Cypress E2E tests
   - 70% coverage target

4. **CSS Optimization** (1 day) - 66% complete
   - Critical CSS inlining
   - Remove unused styles

5. **Analytics Integration** (0.5 days)
   - Google Analytics 4 setup

**Low Priority:**
- Email integration
- Advanced image optimization
- A/B testing framework
- Multi-language support
- Visitor analytics dashboard

## Performance Characteristics

**Current Performance:**
- **Initial Load:** ~2-3s (with images)
- **Time to Interactive:** <1s
- **Bundle Sizes:**
  - Main: ~50KB (minified)
  - Artwork: ~30KB (lazy loaded)
  - Admin: ~20KB (authenticated only)

**Optimization Strategies:**
- Code splitting by route
- Image lazy loading
- WebP format for images
- Gzip compression
- Static asset caching (1 day)
- Minification of JS/CSS

## Security Considerations

1. **Authentication:**
   - Bcrypt password hashing
   - Session-based auth
   - 1-hour session timeout
   - Session regeneration on login

2. **Request Protection:**
   - CSRF tokens
   - Rate limiting
   - Input validation
   - XSS prevention (DOMPurify ready)

3. **Infrastructure:**
   - HTTPS enforcement
   - Secure headers
   - Environment variable configuration
   - No hardcoded secrets

## Deployment Architecture

**Production Setup:**
1. **Process Management:** PM2 with clustering
2. **SSL/TLS:** Self-signed or CA certificates
3. **Environment:** Production/Development modes
4. **Monitoring:** PM2 status, logs, and metrics
5. **Sessions:** Persistent file storage or MongoDB

**Deployment Commands:**
```bash
npm run build:prod          # Production build
npm run run-pm2:prod       # Start with PM2
npm run pm2:logs           # View logs
npm run pm2:status         # Check status
```

## Future Roadmap

### Phase 1: Database & API (Q1 2025)
- PostgreSQL implementation
- RESTful API v1
- Data migration tools
- API documentation

### Phase 2: Testing & Quality (Q2 2025)
- Comprehensive test suite
- CI/CD pipeline
- Performance monitoring
- Error tracking (Sentry)

### Phase 3: Features & Scale (Q3 2025)
- Customer accounts
- Order management
- Email notifications
- Payment integration
- Multi-artist support

### Phase 4: Advanced Features (Q4 2025)
- AI-powered recommendations
- Virtual gallery tours
- Social media integration
- Mobile app consideration

## Development Guidelines

1. **Code Organization:**
   - Modular JavaScript with single responsibility
   - Consistent naming conventions
   - Comprehensive error handling
   - Structured logging throughout

2. **Performance:**
   - Lazy load non-critical resources
   - Optimize images before upload
   - Monitor bundle sizes
   - Use performance budgets

3. **Security:**
   - Validate all inputs
   - Use prepared statements (future DB)
   - Keep dependencies updated
   - Regular security audits

4. **Testing:**
   - Write tests for new features
   - Maintain 70% coverage
   - Test across devices/browsers
   - Performance testing

## Conclusion

The Evgenia Art Portfolio represents a well-architected, modern web application with a solid foundation for growth. The recent refactoring has positioned it well for future enhancements, with clear separation of concerns and modular architecture. The immediate priority is database migration, followed by comprehensive testing and API formalization. The project demonstrates best practices in security, performance, and maintainability while providing an elegant user experience for showcasing and selling artwork.