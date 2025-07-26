/**
 * Artwork Model
 * Handles all artwork-related database operations
 */

const { pool } = require('../config');

class Artwork {
  constructor(data = {}) {
    this.id = data.id;
    this.slug = data.slug;
    this.title = data.title;
    this.category_id = data.category_id;
    this.category_name = data.category_name; // Add this line for category name from JOIN
    this.subcategory = data.subcategory;
    this.dimensions = data.dimensions;
    this.medium = data.medium;
    this.price = data.price;
    this.currency = data.currency || 'USD';
    this.description = data.description;
    this.image_path = data.image_path;
    this.thumbnail_path = data.thumbnail_path;
    this.featured = data.featured || false;
    this.available = data.available !== undefined ? data.available : true;
    this.views_count = data.views_count || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Get all artworks with optional filtering
   */
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT a.*, c.name as category_name, c.title as category_title
        FROM artworks a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE 1=1
      `;

      console.log('🔍 SQL Query:', query);
      const params = [];
      let paramIndex = 1;

      // Add filters
      if (filters.category) {
        query += ` AND c.name = $${paramIndex}`;
        params.push(filters.category);
        paramIndex++;
      }

      if (filters.featured !== undefined) {
        query += ` AND a.featured = $${paramIndex}`;
        params.push(filters.featured);
        paramIndex++;
      }

      if (filters.available !== undefined) {
        query += ` AND a.available = $${paramIndex}`;
        params.push(filters.available);
        paramIndex++;
      }

      if (filters.search) {
        query += ` AND (a.title ILIKE $${paramIndex} OR a.description ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      // Add sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'DESC';
      query += ` ORDER BY a.${sortBy} ${sortOrder}`;

      // Add pagination
      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;

        if (filters.offset) {
          query += ` OFFSET $${paramIndex}`;
          params.push(filters.offset);
          paramIndex++;
        }
      }

      const result = await pool.query(query, params);

      console.log('🔍 First row data:', result.rows[0]);
      console.log('🔍 First row category_name:', result.rows[0]?.category_name);

      return result.rows.map(row => new Artwork(row));
    } catch (error) {
      console.error('Error fetching artworks:', error);
      throw error;
    }
  }

  /**
   * Get artwork by ID
   */
  static async getById(id) {
    try {
      const query = `
        SELECT a.*, c.name as category_name, c.title as category_title
        FROM artworks a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.id = $1
      `;
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return new Artwork(result.rows[0]);
    } catch (error) {
      console.error('Error fetching artwork by ID:', error);
      throw error;
    }
  }

  /**
   * Get artwork by slug
   */
  static async getBySlug(slug) {
    try {
      const query = `
        SELECT a.*, c.name as category_name, c.title as category_title
        FROM artworks a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.slug = $1
      `;
      const result = await pool.query(query, [slug]);

      if (result.rows.length === 0) {
        return null;
      }

      return new Artwork(result.rows[0]);
    } catch (error) {
      console.error('Error fetching artwork by slug:', error);
      throw error;
    }
  }

  /**
   * Create new artwork
   */
  static async create(artworkData) {
    try {
      const query = `
        INSERT INTO artworks (
          slug, title, category_id, subcategory, dimensions, medium, 
          price, currency, description, image_path, thumbnail_path, 
          featured, available
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        ) RETURNING *
      `;

      const params = [
        artworkData.slug,
        artworkData.title,
        artworkData.category_id,
        artworkData.subcategory,
        artworkData.dimensions,
        artworkData.medium,
        artworkData.price,
        artworkData.currency || 'USD',
        artworkData.description,
        artworkData.image_path,
        artworkData.thumbnail_path,
        artworkData.featured || false,
        artworkData.available !== undefined ? artworkData.available : true,
      ];

      const result = await pool.query(query, params);
      return new Artwork(result.rows[0]);
    } catch (error) {
      console.error('Error creating artwork:', error);
      throw error;
    }
  }

  /**
   * Update artwork
   */
  static async update(id, artworkData) {
    try {
      const setClause = [];
      const params = [];
      let paramIndex = 1;

      // Build dynamic SET clause
      Object.keys(artworkData).forEach(key => {
        if (artworkData[key] !== undefined && key !== 'id') {
          setClause.push(`${key} = $${paramIndex}`);
          params.push(artworkData[key]);
          paramIndex++;
        }
      });

      if (setClause.length === 0) {
        throw new Error('No fields to update');
      }

      const query = `
        UPDATE artworks 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      params.push(id);

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return null;
      }

      return new Artwork(result.rows[0]);
    } catch (error) {
      console.error('Error updating artwork:', error);
      throw error;
    }
  }

  /**
   * Delete artwork
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM artworks WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return new Artwork(result.rows[0]);
    } catch (error) {
      console.error('Error deleting artwork:', error);
      throw error;
    }
  }

  /**
   * Increment view count
   */
  static async incrementViews(id) {
    try {
      const query = `
        UPDATE artworks 
        SET views_count = views_count + 1 
        WHERE id = $1 
        RETURNING views_count
      `;
      const result = await pool.query(query, [id]);
      return result.rows[0]?.views_count || 0;
    } catch (error) {
      console.error('Error incrementing views:', error);
      throw error;
    }
  }

  /**
   * Get featured artworks
   */
  static async getFeatured(limit = 6) {
    try {
      const query = `
        SELECT a.*, c.name as category_name, c.title as category_title
        FROM artworks a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.featured = true AND a.available = true
        ORDER BY a.created_at DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);
      return result.rows.map(row => new Artwork(row));
    } catch (error) {
      console.error('Error fetching featured artworks:', error);
      throw error;
    }
  }

  /**
   * Search artworks with full-text search
   */
  static async search(searchTerm, options = {}) {
    try {
      const query = `
        SELECT a.*, c.name as category_name, c.title as category_title,
               ts_rank(to_tsvector('english', a.title || ' ' || COALESCE(a.description, '')), 
                       plainto_tsquery('english', $1)) as rank
        FROM artworks a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE to_tsvector('english', a.title || ' ' || COALESCE(a.description, '')) 
              @@ plainto_tsquery('english', $1)
        ORDER BY rank DESC, a.created_at DESC
        LIMIT ${options.limit || 20}
      `;

      const result = await pool.query(query, [searchTerm]);
      return result.rows.map(row => new Artwork(row));
    } catch (error) {
      console.error('Error searching artworks:', error);
      throw error;
    }
  }

  /**
   * Get artwork statistics
   */
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_artworks,
          COUNT(CASE WHEN available = true THEN 1 END) as available_artworks,
          COUNT(CASE WHEN featured = true THEN 1 END) as featured_artworks,
          AVG(price) as average_price,
          SUM(views_count) as total_views
        FROM artworks
      `;

      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching artwork statistics:', error);
      throw error;
    }
  }

  /**
   * Generate unique slug from title
   */
  static async generateSlug(title) {
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Ensure uniqueness by checking database and adding counter if needed
    let slug = baseSlug;
    let counter = 1;

    while (await this.slugExists(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Check if slug already exists in database
   */
  static async slugExists(slug) {
    try {
      const result = await pool.query('SELECT 1 FROM artworks WHERE slug = $1', [slug]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking slug existence:', error);
      return false;
    }
  }

  /**
   * Instance method to save artwork
   */
  async save() {
    try {
      if (this.id) {
        const updated = await Artwork.update(this.id, this);
        if (updated) {
          Object.assign(this, updated);
        }
        return this;
      } else {
        const created = await Artwork.create(this);
        Object.assign(this, created);
        return this;
      }
    } catch (error) {
      console.error('Error saving artwork:', error);
      throw error;
    }
  }

  /**
   * Instance method to delete artwork
   */
  async remove() {
    try {
      if (this.id) {
        return await Artwork.delete(this.id);
      }
      return null;
    } catch (error) {
      console.error('Error removing artwork:', error);
      throw error;
    }
  }

  /**
   * Convert to JSON (for API responses)
   */
  toJSON() {
    return {
      id: this.id,
      slug: this.slug,
      title: this.title,
      category: this.category_name,
      subcategory: this.subcategory,
      dimensions: this.dimensions,
      medium: this.medium,
      price: this.price,
      currency: this.currency,
      description: this.description,
      image: this.image_path,
      thumbnail: this.thumbnail_path,
      featured: this.featured,
      available: this.available,
      views: this.views_count,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = Artwork;
