-- Evgenia Art Gallery Database Schema
-- This creates the initial database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_path VARCHAR(500),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Artworks table
CREATE TABLE artworks (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly identifier
    title VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    subcategory VARCHAR(100),
    dimensions VARCHAR(100),
    medium VARCHAR(255),
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    image_path VARCHAR(500),
    thumbnail_path VARCHAR(500),
    featured BOOLEAN DEFAULT false,
    available BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Artwork images table (for multiple images per artwork)
CREATE TABLE artwork_images (
    id SERIAL PRIMARY KEY,
    artwork_id INTEGER REFERENCES artworks(id) ON DELETE CASCADE,
    image_path VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cart sessions table
CREATE TABLE cart_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL,
    artwork_id INTEGER REFERENCES artworks(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    price DECIMAL(10,2), -- Store price at time of adding
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analytics table for tracking artwork views
CREATE TABLE artwork_analytics (
    id SERIAL PRIMARY KEY,
    artwork_id INTEGER REFERENCES artworks(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'view', 'cart_add', 'purchase', etc.
    user_session VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contact form submissions
CREATE TABLE contact_submissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    artwork_id INTEGER REFERENCES artworks(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'new', -- 'new', 'read', 'replied', 'closed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter subscriptions
CREATE TABLE newsletter_subscriptions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'unsubscribed'
    subscription_source VARCHAR(100), -- 'footer', 'contact_form', 'popup'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_artworks_category ON artworks(category_id);
CREATE INDEX idx_artworks_featured ON artworks(featured);
CREATE INDEX idx_artworks_available ON artworks(available);
CREATE INDEX idx_artworks_slug ON artworks(slug);
CREATE INDEX idx_artworks_created_at ON artworks(created_at);
CREATE INDEX idx_cart_sessions_session_id ON cart_sessions(session_id);
CREATE INDEX idx_artwork_analytics_artwork_id ON artwork_analytics(artwork_id);
CREATE INDEX idx_artwork_analytics_created_at ON artwork_analytics(created_at);

-- Create full-text search index
CREATE INDEX idx_artworks_search ON artworks USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to tables with updated_at columns
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artworks_updated_at BEFORE UPDATE ON artworks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_sessions_updated_at BEFORE UPDATE ON cart_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_submissions_updated_at BEFORE UPDATE ON contact_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_subscriptions_updated_at BEFORE UPDATE ON newsletter_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();