-- Seed data for Evgenia Art Gallery Database
-- This populates the database with initial categories and sample data

-- Insert categories
INSERT INTO categories (name, title, description, display_order) VALUES
('birds', 'Birds', 'Beautiful bird paintings capturing the essence of avian life', 1),
('floral', 'Floral', 'Vibrant floral compositions showcasing natures beauty', 2),
('towns', 'Towns & Landscapes', 'Charming townscapes and landscape paintings', 3),
('featured', 'Featured Works', 'Specially selected artworks showcasing the artists range', 4);

-- Insert sample newsletter subscription (remove in production)
INSERT INTO newsletter_subscriptions (email, name, subscription_source) VALUES
('contact@evgeniaart.com', 'Evgenia Portnov', 'admin');

-- Insert sample contact submission (remove in production)
INSERT INTO contact_submissions (name, email, subject, message, status) VALUES
('Sample Visitor', 'visitor@example.com', 'Beautiful artwork!', 'I love your bird paintings. Do you do commissions?', 'new');

-- Note: Artwork data will be migrated from the JSON file using the migration script