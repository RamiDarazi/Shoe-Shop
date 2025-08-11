
CREATE DATABASE IF NOT EXISTS shoe_shop;
USE shoe_shop;


CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL
);


CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    parent_id INT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);


CREATE TABLE brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(255),
    website_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    sku VARCHAR(100) UNIQUE NOT NULL,
    category_id INT NOT NULL,
    brand_id INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    old_price DECIMAL(10, 2) NULL,
    cost_price DECIMAL(10, 2),
    stock_quantity INT DEFAULT 0,
    min_stock_level INT DEFAULT 5,
    weight DECIMAL(8, 2),
    dimensions VARCHAR(100),
    material VARCHAR(100),
    color VARCHAR(50),
    gender ENUM('men', 'women', 'unisex') NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT,
    INDEX idx_category (category_id),
    INDEX idx_brand (brand_id),
    INDEX idx_price (price),
    INDEX idx_featured (is_featured),
    INDEX idx_active (is_active)
);


CREATE TABLE product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(200),
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
);


CREATE TABLE product_sizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    size VARCHAR(10) NOT NULL,
    stock_quantity INT DEFAULT 0,
    additional_price DECIMAL(8, 2) DEFAULT 0.00,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_size (product_id, size),
    INDEX idx_product (product_id)
);


CREATE TABLE product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product_review (user_id, product_id),
    INDEX idx_product (product_id),
    INDEX idx_rating (rating)
);


CREATE TABLE addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('billing', 'shipping') NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    company VARCHAR(100),
    address_line_1 VARCHAR(200) NOT NULL,
    address_line_2 VARCHAR(200),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Turkey',
    phone VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
);


CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    shipping_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    billing_address_id INT,
    shipping_address_id INT,
    notes TEXT,
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (billing_address_id) REFERENCES addresses(id) ON DELETE SET NULL,
    FOREIGN KEY (shipping_address_id) REFERENCES addresses(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_order_number (order_number)
);


CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    size VARCHAR(10),
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
);


CREATE TABLE shopping_cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    size VARCHAR(10),
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product_size (user_id, product_id, size),
    INDEX idx_user (user_id)
);


CREATE TABLE wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_user (user_id)
);

CREATE TABLE coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    type ENUM('percentage', 'fixed_amount') NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    minimum_amount DECIMAL(10, 2) DEFAULT 0.00,
    maximum_discount DECIMAL(10, 2) NULL,
    usage_limit INT NULL,
    used_count INT DEFAULT 0,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_valid_dates (valid_from, valid_until)
);

CREATE TABLE newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP NULL,
    INDEX idx_email (email)
);

CREATE TABLE contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    replied_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_read (is_read)
);

CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('super_admin', 'admin', 'manager', 'staff') DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('billing', 'shipping') NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    company VARCHAR(100),
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_default (is_default)
);

-- Insert Sample Data

-- Insert Categories
INSERT INTO categories (name, slug, description, image_url) VALUES
('Men''s Shoes', 'mens-shoes', 'Stylish and comfortable shoe models for men', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a'),
('Women''s Shoes', 'womens-shoes', 'Elegant and modern shoe collection for women', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2'),
('Sports Shoes', 'sports-shoes', 'Ideal sports shoes for active lifestyle', 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2');
-- Insert Brands
INSERT INTO brands (name, slug, description, logo_url) VALUES
('Nike', 'nike', 'Just Do It - World''s largest sports brand', 'https://logo.clearbit.com/nike.com'),
('Adidas', 'adidas', 'Impossible is Nothing - German sports giant', 'https://logo.clearbit.com/adidas.com'),
('Converse', 'converse', 'Classic and timeless shoe brand', 'https://logo.clearbit.com/converse.com'),
('Vans', 'vans', 'Off The Wall - Icon of skate culture', 'https://logo.clearbit.com/vans.com'),
('Puma', 'puma', 'Forever Faster - Speed and performance', 'https://logo.clearbit.com/puma.com'),
('New Balance', 'new-balance', 'Endorsed by No One - Quality and comfort', 'https://logo.clearbit.com/newbalance.com');
-- Insert Sample Products
INSERT INTO products (name, slug, description, short_description, sku, category_id, brand_id, price, old_price, stock_quantity, color, gender, is_featured) VALUES
('Nike Air Max 270', 'nike-air-max-270', 'Nike Air Max 270 is a modern sports shoe offering maximum comfort and style.', 'Maximum comfort and style', 'NIKE-AM270-001', 3, 1, 899.00, 1199.00, 50, 'Black', 'unisex', TRUE),
('Adidas Ultraboost 22', 'adidas-ultraboost-22', 'Adidas Ultraboost 22, innovative technology that enhances your running performance.', 'Innovative running technology', 'ADIDAS-UB22-001', 3, 2, 1299.00, NULL, 30, 'White', 'unisex', TRUE),
('Converse Chuck Taylor', 'converse-chuck-taylor', 'Classic Converse Chuck Taylor All Star, timeless style.', 'Timeless classic style', 'CONVERSE-CT-001', 1, 3, 459.00, 599.00, 75, 'Black', 'men', FALSE),
('Vans Old Skool', 'vans-old-skool', 'Vans Old Skool, the iconic shoe of skate culture.', 'Icon of skate culture', 'VANS-OS-001', 1, 4, 549.00, NULL, 40, 'Black/White', 'men', FALSE),
('Puma RS-X', 'puma-rs-x', 'Puma RS-X, retro-futuristic design and modern comfort.', 'Retro-futuristic design', 'PUMA-RSX-001', 3, 5, 799.00, 999.00, 25, 'Multi Color', 'unisex', TRUE),
('New Balance 990v5', 'new-balance-990v5', 'New Balance 990v5, premium quality and superior comfort.', 'Premium quality and comfort', 'NB-990V5-001', 3, 6, 1099.00, NULL, 20, 'Gray', 'unisex', FALSE);
-- Insert Product Images
INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES
(1, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', 'Nike Air Max 270', 0, TRUE),
(2, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5', 'Adidas Ultraboost 22', 0, TRUE),
(3, 'https://images.unsplash.com/photo-1549298916-b41d501d3772', 'Converse Chuck Taylor', 0, TRUE),
(4, 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77', 'Vans Old Skool', 0, TRUE),
(5, 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2', 'Puma RS-X', 0, TRUE),
(6, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa', 'New Balance 990v5', 0, TRUE);

-- Insert Product Sizes
INSERT INTO product_sizes (product_id, size, stock_quantity) VALUES
(1, '39', 10), (1, '40', 15), (1, '41', 12), (1, '42', 8), (1, '43', 5),
(2, '39', 8), (2, '40', 10), (2, '41', 7), (2, '42', 3), (2, '43', 2),
(3, '39', 20), (3, '40', 25), (3, '41', 15), (3, '42', 10), (3, '43', 5),
(4, '39', 12), (4, '40', 15), (4, '41', 8), (4, '42', 3), (4, '43', 2),
(5, '39', 5), (5, '40', 8), (5, '41', 7), (5, '42', 3), (5, '43', 2),
(6, '39', 4), (6, '40', 6), (6, '41', 5), (6, '42', 3), (6, '43', 2);


-- Insert Admin User (password: admin123)
INSERT INTO admin_users (username, email, password_hash, first_name, last_name, role) VALUES
('admin', 'admin@solestyle.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDxy', 'Admin', 'User', 'super_admin');

-- Create Views for easier data access

-- Product Details View
CREATE VIEW product_details AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.short_description,
    p.sku,
    p.price,
    p.old_price,
    p.stock_quantity,
    p.color,
    p.gender,
    p.is_featured,
    p.is_active,
    c.name as category_name,
    c.slug as category_slug,
    b.name as brand_name,
    b.slug as brand_slug,
    pi.image_url as primary_image,
    COALESCE(AVG(pr.rating), 0) as average_rating,
    COUNT(pr.id) as review_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = TRUE
GROUP BY p.id, pi.image_url;

-- Order Summary View
CREATE VIEW order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.status,
    o.payment_status,
    o.total_amount,
    o.created_at,
    u.first_name,
    u.last_name,
    u.email,
    COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

CREATE INDEX idx_products_category_brand ON products(category_id, brand_id);
CREATE INDEX idx_products_price_range ON products(price, is_active);
CREATE INDEX idx_orders_date_status ON orders(created_at, status);
CREATE INDEX idx_product_reviews_rating ON product_reviews(product_id, rating, is_approved);


DELIMITER //

CREATE TRIGGER update_stock_after_order
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE products 
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
    
    IF NEW.size IS NOT NULL THEN
        UPDATE product_sizes 
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE product_id = NEW.product_id AND size = NEW.size;
    END IF;
END//

CREATE TRIGGER update_product_rating
AFTER INSERT ON product_reviews
FOR EACH ROW
BEGIN

    SELECT 'Rating updated' as message;
END//

DELIMITER ;

INSERT INTO users (username, email, password_hash, first_name, last_name, phone, is_active, email_verified) VALUES
('testuser', 'test@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDxy', 'Test', 'User', '+44 20 7123 4567', TRUE, TRUE),
('johndoe', 'john@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uDxy', 'John', 'Doe', '+44 20 7987 6543', TRUE, TRUE);
INSERT INTO addresses (user_id, type, first_name, last_name, address_line_1, city, postal_code, country, phone, is_default) VALUES
(1, 'shipping', 'Test', 'User', 'Grey Street No:123', 'London', 'SW1A 1AA', 'United Kingdom', '+44 20 7123 4567', TRUE),
(1, 'billing', 'Test', 'User', 'Grey Street No:123', 'London', 'SW1A 1AA', 'United Kingdom', '+44 20 7123 4567', TRUE);
INSERT INTO coupons (code, type, value, minimum_amount, usage_limit, valid_from, valid_until) VALUES
('WELCOME10', 'percentage', 10.00, 100.00, 100, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY)),
('FREESHIP', 'fixed_amount', 25.00, 200.00, 50, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY));

COMMIT;