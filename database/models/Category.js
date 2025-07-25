/**
 * Category Model
 * Handles all category-related database operations
 */

const { pool } = require('../config');

class Category {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.title = data.title;
    this.description = data.description;
    this.image_path = data.image_path;
    this.display_order = data.display_order || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Get all categories
   */
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT c.*, COUNT(a.id) as artwork_count
        FROM categories c
        LEFT JOIN artworks a ON c.id = a.category_id AND a.available = true
        GROUP BY c.id
      `;

      // Add sorting
      const sortBy = options.sortBy || 'display_order';
      const sortOrder = options.sortOrder || 'ASC';
      query += ` ORDER BY c.${sortBy} ${sortOrder}`;

      const result = await pool.query(query);
      return result.rows.map(row => {
        const category = new Category(row);
        category.artwork_count = parseInt(row.artwork_count);
        return category;
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Get category by ID
   */
  static async getById(id) {
    try {
      const query = `
        SELECT c.*, COUNT(a.id) as artwork_count
        FROM categories c
        LEFT JOIN artworks a ON c.id = a.category_id AND a.available = true
        WHERE c.id = $1
        GROUP BY c.id
      `;
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const category = new Category(result.rows[0]);
      category.artwork_count = parseInt(result.rows[0].artwork_count);
      return category;
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      throw error;
    }
  }

  /**
   * Get category by name
   */
  static async getByName(name) {
    try {
      const query = `
        SELECT c.*, COUNT(a.id) as artwork_count
        FROM categories c
        LEFT JOIN artworks a ON c.id = a.category_id AND a.available = true
        WHERE c.name = $1
        GROUP BY c.id
      `;
      const result = await pool.query(query, [name]);

      if (result.rows.length === 0) {
        return null;
      }

      const category = new Category(result.rows[0]);
      category.artwork_count = parseInt(result.rows[0].artwork_count);
      return category;
    } catch (error) {
      console.error('Error fetching category by name:', error);
      throw error;
    }
  }

  /**
   * Create new category
   */
  static async create(categoryData) {
    try {
      const query = `
        INSERT INTO categories (name, title, description, image_path, display_order)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const params = [
        categoryData.name,
        categoryData.title,
        categoryData.description,
        categoryData.image_path,
        categoryData.display_order || 0,
      ];

      const result = await pool.query(query, params);
      return new Category(result.rows[0]);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Update category
   */
  static async update(id, categoryData) {
    try {
      const setClause = [];
      const params = [];
      let paramIndex = 1;

      // Build dynamic SET clause
      Object.keys(categoryData).forEach(key => {
        if (categoryData[key] !== undefined && key !== 'id') {
          setClause.push(`${key} = $${paramIndex}`);
          params.push(categoryData[key]);
          paramIndex++;
        }
      });

      if (setClause.length === 0) {
        throw new Error('No fields to update');
      }

      const query = `
        UPDATE categories 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      params.push(id);

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return null;
      }

      return new Category(result.rows[0]);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Delete category
   */
  static async delete(id) {
    try {
      // First check if there are artworks in this category
      const artworkCheck = await pool.query(
        'SELECT COUNT(*) FROM artworks WHERE category_id = $1',
        [id]
      );

      if (parseInt(artworkCheck.rows[0].count) > 0) {
        throw new Error('Cannot delete category with existing artworks');
      }

      const query = 'DELETE FROM categories WHERE id = $1 RETURNING *';
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return new Category(result.rows[0]);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Get categories with artwork counts
   */
  static async getCategoriesWithArtworkCounts() {
    try {
      const query = `
        SELECT 
          c.*,
          COUNT(a.id) as artwork_count,
          COUNT(CASE WHEN a.featured = true THEN 1 END) as featured_count
        FROM categories c
        LEFT JOIN artworks a ON c.id = a.category_id AND a.available = true
        GROUP BY c.id
        ORDER BY c.display_order ASC
      `;

      const result = await pool.query(query);
      return result.rows.map(row => {
        const category = new Category(row);
        category.artwork_count = parseInt(row.artwork_count);
        category.featured_count = parseInt(row.featured_count);
        return category;
      });
    } catch (error) {
      console.error('Error fetching categories with artwork counts:', error);
      throw error;
    }
  }

  /**
   * Update display order for multiple categories
   */
  static async updateDisplayOrder(categoryOrders) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const { id, display_order } of categoryOrders) {
        await client.query('UPDATE categories SET display_order = $1 WHERE id = $2', [
          display_order,
          id,
        ]);
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating category display order:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Instance method to save category
   */
  async save() {
    try {
      if (this.id) {
        const updated = await Category.update(this.id, this);
        if (updated) {
          Object.assign(this, updated);
        }
        return this;
      } else {
        const created = await Category.create(this);
        Object.assign(this, created);
        return this;
      }
    } catch (error) {
      console.error('Error saving category:', error);
      throw error;
    }
  }

  /**
   * Instance method to delete category
   */
  async remove() {
    try {
      if (this.id) {
        return await Category.delete(this.id);
      }
      return null;
    } catch (error) {
      console.error('Error removing category:', error);
      throw error;
    }
  }

  /**
   * Convert to JSON (for API responses)
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      title: this.title,
      description: this.description,
      image: this.image_path,
      display_order: this.display_order,
      artwork_count: this.artwork_count,
      featured_count: this.featured_count,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

module.exports = Category;
