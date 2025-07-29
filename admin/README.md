# Artwork Management System - Admin Panel

**Last Updated:** January 29, 2025
**System Version:** Database API v1 (Current Architecture)

> **⚡ REAL-TIME DATABASE OPERATIONS** - All changes are immediately saved to the database. No manual file downloads or uploads required.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Getting Started](#getting-started)
3. [Core Operations](#core-operations)
4. [Image Management](#image-management)
5. [Troubleshooting](#troubleshooting)
6. [API Reference](#api-reference)
7. [Migration Guide](#migration-guide)

---

## System Architecture

### Modern Database-Driven System

The artwork management system uses a **real-time database architecture** with the following components:

1. **Database Backend**: PostgreSQL database with Sequelize ORM
2. **REST API Layer**: Secure API endpoints for all operations
3. **Admin Panel**: Web interface that communicates directly with the database
4. **Authentication System**: Session-based security with admin access control

### Key Benefits

- ✅ **Real-time operations** - Changes are immediately visible across all pages
- ✅ **Database reliability** - All data stored securely in PostgreSQL
- ✅ **Audit logging** - Complete activity tracking for all admin actions
- ✅ **Secure authentication** - Session-based login with automatic expiration
- ✅ **Performance optimized** - Efficient database queries and caching

---

## Getting Started

### Accessing the Admin Panel

1. Navigate to `/admin/` on your website
2. Log in with your admin credentials
3. The system will automatically load all artwork data from the database

### First-Time Setup Verification

Upon successful login, you should see:

- ✅ **Dashboard tab** with artwork statistics
- ✅ **Artworks tab** with all current artworks loaded
- ✅ **Categories tab** with auto-generated categories
- ✅ **Settings tab** with system configuration

If any data fails to load, see the [Troubleshooting](#troubleshooting) section.

---

## Core Operations

### Creating New Artworks

1. **Navigate** to the "Artworks" tab
2. **Click** "Add New Artwork" button
3. **Fill out** the artwork form:
   - **Title**: Display name for the artwork
   - **Category**: Main category (birds, landscapes, etc.)
   - **Subcategory**: Optional subcategorization
   - **Dimensions**: Physical size (e.g., "20cm X 20cm")
   - **Medium**: Art materials used (e.g., "Acrylic on Canvas")
   - **Price**: Numeric value (currency handled automatically)
   - **Description**: Detailed artwork description
   - **Image**: File path or uploaded image reference
   - **Featured**: Mark as featured artwork
4. **Click** "Save" - artwork is immediately added to database

### Editing Existing Artworks

1. **Find** the artwork in the Artworks tab
2. **Click** "Edit" on the artwork card
3. **Modify** any fields as needed
4. **Click** "Save" - changes are immediately saved to database

### Deleting Artworks

1. **Find** the artwork in the Artworks tab
2. **Click** "Delete" on the artwork card
3. **Confirm** deletion when prompted
4. **Artwork removed** immediately from database and all pages

### Batch Operations

The system supports bulk operations for efficiency:

- **Import JSON data** from previous systems
- **Bulk edit** multiple artworks simultaneously
- **Mass upload** of images with automatic artwork creation

---

## Image Management

### Uploading Images

The admin panel includes integrated image upload functionality:

1. **Navigate** to Settings tab → "Image Upload" section
2. **Select** image files (JPEG, PNG, WebP supported)
3. **Choose** target category for organization
4. **Upload** - images are automatically processed and optimized
5. **Reference** uploaded images in artwork forms

### Image Organization

Images are automatically organized by category:

```
public/assets/images/artwork/
├── birds/
├── landscapes/
├── floral/
├── abstracts/
├── portraits/
└── towns/
```

### Image Optimization

- **Automatic WebP conversion** for web performance
- **Original format preservation** for archival purposes
- **Responsive size generation** for different display contexts

---

## Troubleshooting

### Database Connection Issues

**Symptoms**: Data not loading, "API error" messages, empty artwork list

**Solutions**:

1. **Check server status**: Ensure the web server is running
2. **Verify database connection**: Check database service status
3. **Review server logs**: Look for connection errors in system logs
4. **Clear browser cache**: Force refresh with Ctrl+F5 (or Cmd+Shift+R on Mac)
5. **Check admin session**: Re-login if session expired

### Authentication Problems

**Symptoms**: Cannot access admin panel, redirect to login page

**Solutions**:

1. **Verify credentials**: Ensure username and password are correct
2. **Check session**: Admin sessions expire after 1 hour of inactivity
3. **Clear cookies**: Remove any corrupted session cookies
4. **Contact administrator**: If credentials are forgotten

### API Errors

**Common Error Messages**:

- `"Authentication required"` → Login session expired, please re-login
- `"Failed to create artwork"` → Check required fields and data validation
- `"Database connection failed"` → Server-side issue, contact technical support
- `"CSRF validation failed"` → Refresh page and try again

### Performance Issues

**If admin panel is slow**:

1. **Check network connection** to server
2. **Clear browser cache** and reload
3. **Verify server resources** (CPU, memory usage)
4. **Review database performance** (contact technical support if needed)

---

## API Reference

### Authentication

All admin operations require valid session authentication. Login at `/admin/login` to establish session.

### Core Endpoints

#### Artwork Management

- `GET /api/v1/artworks/all` - Get all artworks and categories
- `POST /api/artworks` - Create new artwork (admin only)
- `PUT /api/artworks/:id` - Update artwork (admin only)
- `DELETE /api/artworks/:id` - Delete artwork (admin only)

#### Batch Operations

- `POST /api/v1/admin/artworks/batch` - Bulk create/update artworks (admin only)

#### Image Upload

- `POST /api/v1/admin/upload` - Upload images (admin only)

#### System

- `GET /api/v1/admin/session` - Check authentication status
- `GET /api/health` - System health check

### Request Format

All POST/PUT requests require:

- `Content-Type: application/json`
- Valid admin session cookie
- CSRF token for state-changing operations

### Response Format

```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

---

## Migration Guide

### For Users Familiar with JSON Workflow

**Previous System (Obsolete)**:

- Manual JSON file downloads
- Manual file uploads to server
- Local JSON file management

**Current System (Database-Driven)**:

- ✅ Real-time database operations
- ✅ Automatic synchronization
- ✅ No manual file handling required

### Key Workflow Changes

| Old Process              | New Process                     |
| ------------------------ | ------------------------------- |
| 1. Edit artwork in admin | 1. Edit artwork in admin        |
| 2. Click "Save"          | 2. Click "Save"                 |
| 3. Download JSON file    | ✅ **DONE** - Saved to database |
| 4. Upload to server      | ❌ No longer needed             |
| 5. Refresh website       | ✅ Changes immediately visible  |

### Data Import from Previous Systems

If you have artwork data in JSON format from previous systems:

1. **Navigate** to Artworks tab
2. **Click** "Import" button
3. **Select** your JSON file
4. **Review** imported data
5. **Save** - data is converted and stored in database

### Backup Procedures

**Automatic Backups**: Database backups are handled at the server level

**Manual Export**: Use the "Export" button in Settings tab to download a backup copy of your artwork data in JSON format for archival purposes.

---

## Security Notes

- **Session Security**: Admin sessions automatically expire after 1 hour of inactivity
- **Audit Logging**: All admin actions are logged for security monitoring
- **CSRF Protection**: Built-in protection against cross-site request forgery
- **Rate Limiting**: Login attempts are rate-limited to prevent brute force attacks

---

## Support & Maintenance

For technical support or questions about this system:

1. **Check logs**: Review browser console for error messages
2. **Verify connectivity**: Ensure stable internet connection to server
3. **Clear cache**: Try clearing browser cache and reloading
4. **Contact support**: Provide error messages and steps to reproduce issues

---

_Documentation Version: 2.0 - Database Architecture_
_System Architecture: REST API + PostgreSQL Database_
_Last Updated: January 29, 2025_
