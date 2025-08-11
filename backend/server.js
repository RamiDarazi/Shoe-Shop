const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../')));

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shoe_shop',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const JWT_SECRET = process.env.JWT_SECRET || 'topsecretramikey2025';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../assets/uploads/'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

const authenticateAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const [rows] = await pool.execute(
            'SELECT * FROM admin_users WHERE id = ? AND is_active = TRUE',
            [decoded.id]
        );

        if (rows.length === 0) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.admin = rows[0];
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'SoleStyle API is running' });
});


app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, phone } = req.body;

        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, passwordHash, firstName, lastName, phone || null]
        );

        const token = jwt.sign(
            { id: result.insertId, username, email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: result.insertId,
                username,
                email,
                firstName,
                lastName
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const [users] = await pool.execute(
            'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = TRUE',
            [username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        await pool.execute(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find admin user
        const [admins] = await pool.execute(
            'SELECT * FROM admin_users WHERE (username = ? OR email = ?) AND is_active = TRUE',
            [username, username]
        );

        if (admins.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const admin = admins[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        await pool.execute(
            'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [admin.id]
        );

        const token = jwt.sign(
            { id: admin.id, username: admin.username, role: admin.role, isAdmin: true },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Admin login successful',
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                firstName: admin.first_name,
                lastName: admin.last_name,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Product Routes

// Get all products with filtering and pagination
app.get('/api/products', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            brand,
            minPrice,
            maxPrice,
            gender,
            search,
            featured,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = ['p.is_active = TRUE'];
        let queryParams = [];

        // Build WHERE conditions
        if (category) {
            whereConditions.push('c.slug = ?');
            queryParams.push(category);
        }
        if (brand) {
            whereConditions.push('b.slug = ?');
            queryParams.push(brand);
        }
        if (minPrice) {
            whereConditions.push('p.price >= ?');
            queryParams.push(parseFloat(minPrice));
        }
        if (maxPrice) {
            whereConditions.push('p.price <= ?');
            queryParams.push(parseFloat(maxPrice));
        }
        if (gender && gender !== 'all') {
            whereConditions.push('p.gender = ?');
            queryParams.push(gender);
        }
        if (search) {
            whereConditions.push('(p.name LIKE ? OR p.description LIKE ? OR b.name LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }
        if (featured === 'true') {
            whereConditions.push('p.is_featured = TRUE');
        }

        const whereClause = whereConditions.join(' AND ');

        const validSortColumns = ['name', 'price', 'created_at', 'average_rating'];
        const validSortOrders = ['ASC', 'DESC'];
        const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
        const finalSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        const productsQuery = `
            SELECT 
                p.id, p.name, p.slug, p.short_description, p.price, p.old_price,
                p.stock_quantity, p.color, p.gender, p.is_featured,
                c.name as category_name, c.slug as category_slug,
                b.name as brand_name, b.slug as brand_slug,
                pi.image_url as primary_image,
                COALESCE(AVG(pr.rating), 0) as average_rating,
                COUNT(pr.id) as review_count
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
            LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = TRUE
            WHERE ${whereClause}
            GROUP BY p.id, pi.image_url
            ORDER BY ${finalSortBy} ${finalSortOrder}
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(limit), parseInt(offset));
        const [products] = await pool.execute(productsQuery, queryParams);

        const countQuery = `
            SELECT COUNT(DISTINCT p.id) as total
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE ${whereClause}
        `;

        const countParams = queryParams.slice(0, -2); // Remove limit and offset
        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/products/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        const isNumeric = /^\d+$/.test(identifier);
        
        const query = `
            SELECT 
                p.*,
                c.name as category_name, c.slug as category_slug,
                b.name as brand_name, b.slug as brand_slug,
                COALESCE(AVG(pr.rating), 0) as average_rating,
                COUNT(pr.id) as review_count
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = TRUE
            WHERE ${isNumeric ? 'p.id = ?' : 'p.slug = ?'} AND p.is_active = TRUE
            GROUP BY p.id
        `;

        const [products] = await pool.execute(query, [identifier]);
        
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = products[0];

        const [images] = await pool.execute(
            'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, id',
            [product.id]
        );

        const [sizes] = await pool.execute(
            'SELECT * FROM product_sizes WHERE product_id = ? AND is_available = TRUE ORDER BY size',
            [product.id]
        );

        const [reviews] = await pool.execute(`
            SELECT 
                pr.*,
                u.first_name, u.last_name
            FROM product_reviews pr
            LEFT JOIN users u ON pr.user_id = u.id
            WHERE pr.product_id = ? AND pr.is_approved = TRUE
            ORDER BY pr.created_at DESC
            LIMIT 10
        `, [product.id]);

        res.json({
            ...product,
            images,
            sizes,
            reviews
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const [categories] = await pool.execute(
            'SELECT * FROM categories WHERE is_active = TRUE ORDER BY sort_order, name'
        );
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/brands', async (req, res) => {
    try {
        const [brands] = await pool.execute(
            'SELECT * FROM brands WHERE is_active = TRUE ORDER BY name'
        );
        res.json(brands);
    } catch (error) {
        console.error('Get brands error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Get user's cart
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const [cartItems] = await pool.execute(`
            SELECT 
                sc.*,
                p.name, p.price, p.stock_quantity,
                pi.image_url
            FROM shopping_cart sc
            LEFT JOIN products p ON sc.product_id = p.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
            WHERE sc.user_id = ?
            ORDER BY sc.created_at DESC
        `, [req.user.id]);

        res.json(cartItems);
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add item to cart
app.post('/api/cart', authenticateToken, async (req, res) => {
    try {
        const { productId, size, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        const [products] = await pool.execute(
            'SELECT * FROM products WHERE id = ? AND is_active = TRUE',
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const [existingItems] = await pool.execute(
            'SELECT * FROM shopping_cart WHERE user_id = ? AND product_id = ? AND size = ?',
            [req.user.id, productId, size || null]
        );

        if (existingItems.length > 0) {
            // Update quantity
            await pool.execute(
                'UPDATE shopping_cart SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [quantity, existingItems[0].id]
            );
        } else {
            // Add new item
            await pool.execute(
                'INSERT INTO shopping_cart (user_id, product_id, size, quantity) VALUES (?, ?, ?, ?)',
                [req.user.id, productId, size || null, quantity]
            );
        }

        res.json({ message: 'Item added to cart successfully' });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/cart/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Valid quantity is required' });
        }

        const [result] = await pool.execute(
            'UPDATE shopping_cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
            [quantity, id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        res.json({ message: 'Cart item updated successfully' });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/cart/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            'DELETE FROM shopping_cart WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        res.json({ message: 'Item removed from cart successfully' });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/cart', authenticateToken, async (req, res) => {
    try {
        await pool.execute(
            'DELETE FROM shopping_cart WHERE user_id = ?',
            [req.user.id]
        );

        res.json({ message: 'Cart cleared successfully' });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }

        await pool.execute(
            'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
            [name, email, subject || null, message]
        );

        res.json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Newsletter subscription
app.post('/api/newsletter', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Check if already subscribed
        const [existing] = await pool.execute(
            'SELECT id FROM newsletter_subscribers WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email already subscribed' });
        }

        await pool.execute(
            'INSERT INTO newsletter_subscribers (email) VALUES (?)',
            [email]
        );

        res.json({ message: 'Successfully subscribed to newsletter' });
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin Routes

// Get dashboard stats
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
    try {
        const [productCount] = await pool.execute('SELECT COUNT(*) as count FROM products WHERE is_active = TRUE');
        const [orderCount] = await pool.execute('SELECT COUNT(*) as count FROM orders');
        const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
        const [revenue] = await pool.execute('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = "paid"');

        res.json({
            totalProducts: productCount[0].count,
            totalOrders: orderCount[0].count,
            totalUsers: userCount[0].count,
            totalRevenue: revenue[0].total
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get recent orders for dashboard
app.get('/api/admin/orders/recent', authenticateAdmin, async (req, res) => {
    try {
        const [orders] = await pool.execute(`
            SELECT 
                o.id, o.order_number, o.status, o.total_amount, o.created_at,
                u.first_name, u.last_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 10
        `);

        res.json(orders);
    } catch (error) {
        console.error('Recent orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all products for admin
app.get('/api/admin/products', authenticateAdmin, async (req, res) => {
    try {
        const [products] = await pool.execute(`
            SELECT 
                p.id, p.name, p.price, p.stock_quantity, p.is_active,
                c.name as category_name,
                pi.image_url as primary_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
            ORDER BY p.created_at DESC
        `);

        res.json(products);
    } catch (error) {
        console.error('Admin products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all orders for admin
app.get('/api/admin/orders', authenticateAdmin, async (req, res) => {
    try {
        const [orders] = await pool.execute(`
            SELECT 
                o.id, o.order_number, o.status, o.payment_status, o.total_amount, o.created_at,
                u.first_name, u.last_name,
                COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `);

        res.json(orders);
    } catch (error) {
        console.error('Admin orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all users for admin
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
    try {
        const [users] = await pool.execute(`
            SELECT 
                id, first_name, last_name, email, phone, is_active, created_at
            FROM users
            ORDER BY created_at DESC
        `);

        res.json(users);
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all categories for admin
app.get('/api/admin/categories', authenticateAdmin, async (req, res) => {
    try {
        const [categories] = await pool.execute(`
            SELECT 
                c.id, c.name, c.slug, c.is_active,
                COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE
            GROUP BY c.id
            ORDER BY c.name
        `);

        res.json(categories);
    } catch (error) {
        console.error('Admin categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all contact messages for admin
app.get('/api/admin/messages', authenticateAdmin, async (req, res) => {
    try {
        const [messages] = await pool.execute(`
            SELECT id, name, email, subject, message, is_read, created_at
            FROM contact_messages
            ORDER BY created_at DESC
        `);

        res.json(messages);
    } catch (error) {
        console.error('Admin messages error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, email, first_name, last_name, phone, date_of_birth, gender, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(users[0]);
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const { first_name, last_name, email, phone, date_of_birth, gender } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, date_of_birth = ?, gender = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [first_name, last_name, email, phone, date_of_birth, gender, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/user/overview', authenticateToken, async (req, res) => {
    try {
        const [orderStats] = await pool.execute(
            'SELECT COUNT(*) as totalOrders, COALESCE(SUM(total_amount), 0) as totalSpent FROM orders WHERE user_id = ?',
            [req.user.id]
        );
        
        const [recentOrders] = await pool.execute(
            'SELECT o.*, GROUP_CONCAT(CONCAT(oi.product_name, "|", oi.size, "|", oi.quantity, "|", oi.price) SEPARATOR ";") as items FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id WHERE o.user_id = ? GROUP BY o.id ORDER BY o.created_at DESC LIMIT 3',
            [req.user.id]
        );
        
        const formattedOrders = recentOrders.map(order => ({
            ...order,
            items: order.items ? order.items.split(';').map(item => {
                const [name, size, quantity, price] = item.split('|');
                return { name, size, quantity: parseInt(quantity), price: parseFloat(price) };
            }) : []
        }));
        
        res.json({
            totalOrders: orderStats[0].totalOrders,
            totalSpent: orderStats[0].totalSpent,
            wishlistItems: 0,
            recentOrders: formattedOrders
        });
    } catch (error) {
        console.error('Get user overview error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/user/orders', authenticateToken, async (req, res) => {
    try {
        const [orders] = await pool.execute(
            'SELECT o.*, GROUP_CONCAT(CONCAT(oi.product_name, "|", oi.size, "|", oi.quantity, "|", oi.price) SEPARATOR ";") as items FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id WHERE o.user_id = ? GROUP BY o.id ORDER BY o.created_at DESC',
            [req.user.id]
        );
        
        const formattedOrders = orders.map(order => ({
            ...order,
            items: order.items ? order.items.split(';').map(item => {
                const [name, size, quantity, price] = item.split('|');
                return { name, size, quantity: parseInt(quantity), price: parseFloat(price) };
            }) : []
        }));
        
        res.json(formattedOrders);
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/user/addresses', authenticateToken, async (req, res) => {
    try {
        const [addresses] = await pool.execute(
            'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
            [req.user.id]
        );
        res.json(addresses);
    } catch (error) {
        console.error('Get user addresses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/user/addresses', authenticateToken, async (req, res) => {
    try {
        const { type, first_name, last_name, company, address_line_1, address_line_2, city, state, postal_code, country, phone, is_default } = req.body;
        
        if (is_default) {
            await pool.execute(
                'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
                [req.user.id]
            );
        }
        
        const [result] = await pool.execute(
            'INSERT INTO user_addresses (user_id, type, first_name, last_name, company, address_line_1, address_line_2, city, state, postal_code, country, phone, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, type, first_name, last_name, company, address_line_1, address_line_2, city, state, postal_code, country, phone, is_default ? 1 : 0]
        );
        
        res.json({ message: 'Address added successfully', id: result.insertId });
    } catch (error) {
        console.error('Add address error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/user/addresses/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute(
            'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Address not found' });
        }
        
        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/user/addresses/:id/default', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.execute(
            'UPDATE user_addresses SET is_default = 0 WHERE user_id = ?',
            [req.user.id]
        );
        
        const [result] = await pool.execute(
            'UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Address not found' });
        }
        
        res.json({ message: 'Default address updated successfully' });
    } catch (error) {
        console.error('Update default address error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/user/change-password', authenticateToken, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        
        const [users] = await pool.execute(
            'SELECT password_hash FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const isValidPassword = await bcrypt.compare(current_password, users[0].password_hash);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }
        
        const hashedPassword = await bcrypt.hash(new_password, 12);
        
        await pool.execute(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, req.user.id]
        );
        
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 SoleStyle Server is running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log(`💾 Database: ${dbConfig.database}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await pool.end();
    process.exit(0);
});

module.exports = app;