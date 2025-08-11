let cart = [];
let products = [];
let currentFilter = 'all';
let currentPage = 1;
const productsPerPage = 8;

// Sample Products Data
const sampleProducts = [
    {
        id: 1,
        name: "Nike Air Max 270",
        category: "sports",
        price: 129.99,
        oldPrice: 159.99,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        rating: 4.5,
        reviews: 128,
        badge: "New"
    },
    {
        id: 2,
        name: "Adidas Ultraboost 22",
        category: "sports",
        price: 179.99,
        oldPrice: null,
        image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        rating: 4.8,
        reviews: 95,
        badge: "Popular"
    },
    {
        id: 3,
        name: "Converse Chuck Taylor",
        category: "men",
        price: 64.99,
        oldPrice: 79.99,
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        rating: 4.3,
        reviews: 203,
        badge: "Sale"
    },
    {
        id: 4,
        name: "Vans Old Skool",
        category: "men",
        price: 59.99,
        oldPrice: null,
        image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        rating: 4.4,
        reviews: 156,
        badge: null
    },
    {
        id: 5,
        name: "Christian Louboutin Heels",
        category: "women",
        price: 399.99,
        oldPrice: null,
        image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        rating: 4.9,
        reviews: 67,
        badge: "Premium"
    },
    {
        id: 6,
        name: "Jimmy Choo Pumps",
        category: "women",
        price: 249.99,
        oldPrice: 299.99,
        image: "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        rating: 4.7,
        reviews: 89,
        badge: "Sale"
    },
    {
        id: 7,
        name: "Puma RS-X",
        category: "sports",
        price: 99.99,
        oldPrice: 129.99,
        image: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        rating: 4.2,
        reviews: 134,
        badge: "Sale"
    },
    {
        id: 8,
        name: "New Balance 990v5",
        category: "sports",
        price: 149.99,
        oldPrice: null,
        image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        rating: 4.6,
        reviews: 78,
        badge: "New"
    },
    {
        id: 9,
        name: "Dr. Martens 1460",
        category: "men",
        price: 169.99,
        oldPrice: null,
        image: "https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        rating: 4.5,
        reviews: 167,
        badge: "Classic"
    },
    {
        id: 10,
        name: "Balenciaga Triple S",
        category: "women",
        price: 549.99,
        oldPrice: null,
        image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        rating: 4.1,
        reviews: 45,
        badge: "Luxury"
    },
    {
        id: 11,
        name: "Timberland 6-Inch",
        category: "men",
        price: 199.99,
        oldPrice: 249.99,
        image: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        rating: 4.7,
        reviews: 234,
        badge: "Sale"
    },
    {
        id: 12,
        name: "Gucci Ace Sneakers",
        category: "women",
        price: 369.99,
        oldPrice: null,
        image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
        rating: 4.8,
        reviews: 92,
        badge: "Luxury"
    }
];

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    checkAuthStatus();
});

function initializeApp() {
    products = [...sampleProducts];
    setupEventListeners();
    renderProducts();
    updateCartUI();
    setupSmoothScrolling();
    setupMobileMenu();
    loadCartFromStorage();
}

function setupEventListeners() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            setActiveFilter(btn, filter);
            filterProducts(filter);
        });
    });

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreProducts);
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    const cartIcon = document.querySelector('.cart-icon');
    const cartModal = document.getElementById('cartModal');
    const closeModal = document.querySelector('.close');
    const clearCartBtn = document.getElementById('clearCart');
    const checkoutBtn = document.getElementById('checkout');

    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            cartModal.style.display = 'block';
            renderCartItems();
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            cartModal.style.display = 'none';
        });
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });

    // Contact form
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    // Newsletter form
    const newsletterForm = document.querySelector('.newsletter');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletter);
    }

    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', handleAuthSubmit);
    }

    const authSwitchLink = document.getElementById('authSwitchLink');
    if (authSwitchLink) {
        authSwitchLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthMode();
        });
    }

    const loginModal = document.getElementById('loginModal');
    const loginModalClose = loginModal ? loginModal.querySelector('.close') : null;
    if (loginModalClose) {
        loginModalClose.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
    }

    if (loginModal) {
        window.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.style.display = 'none';
            }
        });
    }

    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        const btn = card.querySelector('.btn-outline');
        if (btn) {
            btn.addEventListener('click', () => {
                const category = card.querySelector('h3').textContent.toLowerCase();
                let filter = 'all';
                if (category.includes('men')) filter = 'men';
                else if (category.includes('women')) filter = 'women';
                else if (category.includes('sport')) filter = 'sports';
                
                document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    const filterBtn = document.querySelector(`[data-filter="${filter}"]`);
                    if (filterBtn) {
                        setActiveFilter(filterBtn, filter);
                        filterProducts(filter);
                    }
                }, 500);
            });
        }
    });
}

function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

function setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    const filteredProducts = getFilteredProducts();
    const startIndex = 0;
    const endIndex = currentPage * productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);

    productsGrid.innerHTML = '';
    
    productsToShow.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        if (endIndex >= filteredProducts.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }

    const cards = productsGrid.querySelectorAll('.product-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('fade-in-up');
        }, index * 100);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-category', product.category);

    const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));
    const oldPriceHTML = product.oldPrice ? `<span class="old-price">${product.oldPrice} ₺</span>` : '';
    const badgeHTML = product.badge ? `<div class="product-badge">${product.badge}</div>` : '';

    card.innerHTML = `
        <div class="product-image">
            <img src="${product.image}" alt="${product.name}">
            ${badgeHTML}
            <div class="product-actions">
                <button class="action-btn" onclick="toggleWishlist(${product.id})">
                    <i class="far fa-heart"></i>
                </button>
                <button class="action-btn" onclick="quickView(${product.id})">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-category">${getCategoryName(product.category)}</p>
            <div class="product-price">
                <span class="current-price">${product.price} ₺</span>
                ${oldPriceHTML}
            </div>
            <div class="product-rating">
                <div class="stars">${stars}</div>
                <span class="rating-text">(${product.reviews} reviews)</span>
            </div>
            <button class="add-to-cart" onclick="addToCart(${product.id})">
                <i class="fas fa-shopping-cart"></i> Add to Cart
            </button>
        </div>
    `;

    return card;
}

function getCategoryName(category) {
    const categoryNames = {
        'men': 'Men\'s Shoes',
        'women': 'Women\'s Shoes',
        'sports': 'Sports Shoes'
    };
    return categoryNames[category] || 'Shoes';
}

function filterProducts(filter) {
    currentFilter = filter;
    currentPage = 1;
    renderProducts();
}

function getFilteredProducts() {
    if (currentFilter === 'all') {
        return products;
    }
    return products.filter(product => product.category === currentFilter);
}

function setActiveFilter(activeBtn, filter) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

function loadMoreProducts() {
    currentPage++;
    renderProducts();
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm === '') {
        products = [...sampleProducts];
    } else {
        products = sampleProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            getCategoryName(product.category).toLowerCase().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    renderProducts();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function addToCart(productId, size = 'M', quantity = 1, buttonElement = null) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Show loading state on button if provided
    if (buttonElement) {
        buttonElement.classList.add('btn-loading');
        buttonElement.disabled = true;
    }
    
    // Simulate API call delay
    setTimeout(() => {
        const existingItem = cart.find(item => item.id === productId && item.size === size);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                ...product,
                size: size,
                quantity: quantity
            });
        }
        
        updateCartUI();
        saveCartToStorage();
        showNotification(`${product.name} added to cart!`, 'success');
        
        // Remove loading state
        if (buttonElement) {
            buttonElement.classList.remove('btn-loading');
            buttonElement.disabled = false;
        }
    }, 800);
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
    saveCartToStorage();
    renderCartItems();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCartUI();
        saveCartToStorage();
        renderCartItems();
    }
}

function updateCartUI() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

function renderCartItems() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItems || !cartTotal) return;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Your cart is empty</p>';
        cartTotal.textContent = '$0.00';
        return;
    }

    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">$${item.price}</div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
            <div class="remove-item" onclick="removeFromCart(${item.id})">
                <i class="fas fa-trash"></i>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });

    cartTotal.textContent = `$${total.toFixed(2)}`;
}

// Clear Cart
function clearCart() {
    cart = [];
    updateCartUI();
    saveCartToStorage();
    renderCartItems();
    showNotification('Cart cleared!', 'info');
}

// Checkout
function checkout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }

    showLoadingOverlay();
    showNotification('Processing your order...', 'info');
    
    setTimeout(() => {
        clearCart();
        document.getElementById('cartModal').style.display = 'none';
        hideLoadingOverlay();
        showNotification('Order placed successfully!', 'success');
    }, 3000);
}

function saveCartToStorage() {
    localStorage.setItem('shoeShopCart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('shoeShopCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
}

function toggleWishlist(productId) {
    // This would typically interact with a backend
    showNotification('Added to favorites!', 'success');
}

function quickView(productId) {
    const product = sampleProducts.find(p => p.id === productId);
    if (!product) return;
    
    showProductModal(product);
}

// Product Detail Modal Functions
let selectedSize = null;
let productQuantity = 1;

function showProductModal(product) {
    const modal = document.getElementById('productModal');
    const mainImage = document.getElementById('mainProductImage');
    const productName = document.getElementById('productDetailName');
    const productRating = document.getElementById('productDetailRating');
    const productReviews = document.getElementById('productDetailReviews');
    const productPrice = document.getElementById('productDetailPrice');
    const productOldPrice = document.getElementById('productDetailOldPrice');
    const productDescription = document.getElementById('productDetailDescription');
    const sizeOptions = document.getElementById('sizeOptions');
    const productQuantityEl = document.getElementById('productQuantity');
    const productReviewsSection = document.getElementById('productReviews');
    
    mainImage.src = product.image;
    mainImage.alt = product.name;
    productName.textContent = product.name;
    productPrice.textContent = `$${product.price}`;
    
    if (product.oldPrice) {
        productOldPrice.textContent = `$${product.oldPrice}`;
        productOldPrice.style.display = 'inline';
    } else {
        productOldPrice.style.display = 'none';
    }
    
    productRating.innerHTML = generateStars(product.rating);
    productReviews.textContent = `(${product.reviews} reviews)`;
    
    productDescription.textContent = getProductDescription(product);
    
    generateSizeOptions(sizeOptions);
    
    productQuantity = 1;
    productQuantityEl.textContent = productQuantity;
    
    generateProductReviews(productReviewsSection, product);
    
    modal.style.display = 'block';
    
    setupProductModalListeners(product);
}

function generateStars(rating) {
    let starsHtml = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star star"></i>';
    }
    
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt star"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star star empty"></i>';
    }
    
    return starsHtml;
}

function getProductDescription(product) {
    const descriptions = {
        1: "Nike Air Max 270 offers perfect comfort and style for daily use. Maximum comfort with every step thanks to air cushion technology.",
        2: "Adidas Ultraboost 22, advanced technology that enhances your running performance. Energy return with Boost midsole.",
        3: "Classic Converse Chuck Taylor, timeless design and durability. Ideal choice for users of all ages.",
        4: "Vans Old Skool, the essential of street fashion. Durable canvas and suede combination.",
        5: "Christian Louboutin heels, special design that combines luxury and elegance.",
        6: "Jimmy Choo stiletto, perfect choice for special occasions. Made with Italian craftsmanship.",
        7: "Puma RS-X, the meeting of retro design and modern technology. Ideal for daily use.",
        8: "New Balance 990v5, quality sports shoe made with premium materials.",
        9: "Dr. Martens 1460, durable leather and classic design. Quality you can use for many years.",
        10: "Balenciaga Triple S, avant-garde design and luxury materials. Special for fashion enthusiasts.",
        11: "Timberland 6-Inch, durable and waterproof design for outdoor activities.",
        12: "Gucci Ace sneaker, perfect combination of Italian luxury and sports shoe comfort."
    };
    
    return descriptions[product.id] || "Premium quality production, comfort and style combined.";
}

function generateSizeOptions(container) {
    const sizes = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
    container.innerHTML = '';
    
    sizes.forEach(size => {
        const sizeEl = document.createElement('div');
        sizeEl.className = 'size-option';
        sizeEl.textContent = size;
        sizeEl.addEventListener('click', () => selectSize(size, sizeEl));
        container.appendChild(sizeEl);
    });
}

function selectSize(size, element) {
    document.querySelectorAll('.size-option').forEach(el => el.classList.remove('selected'));
    
    element.classList.add('selected');
    selectedSize = size;
}

function generateProductReviews(container, product) {
    const sampleReviews = [
        {
            author: "John D.",
            rating: 5,
            text: "Excellent quality and very comfortable. Highly recommended!"
        },
        {
            author: "Sarah M.",
            rating: 4,
            text: "Great shoes, good value for money. Fast delivery too."
        },
        {
            author: "Mike R.",
            rating: 5,
            text: "Perfect fit and amazing style. Will definitely buy again."
        }
    ];
    
    container.innerHTML = '';
    
    sampleReviews.forEach(review => {
        const reviewEl = document.createElement('div');
        reviewEl.className = 'review-item';
        reviewEl.innerHTML = `
            <div class="review-header">
                <span class="review-author">${review.author}</span>
                <div class="review-rating">${generateStars(review.rating)}</div>
            </div>
            <div class="review-text">${review.text}</div>
        `;
        container.appendChild(reviewEl);
    });
}

function setupProductModalListeners(product) {
    const modal = document.getElementById('productModal');
    const closeBtn = modal.querySelector('.close');
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');
    const addToCartBtn = document.getElementById('addToCartModal');
    
    // Close modal
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        selectedSize = null;
        productQuantity = 1;
    };
    
    decreaseBtn.onclick = () => {
        if (productQuantity > 1) {
            productQuantity--;
            document.getElementById('productQuantity').textContent = productQuantity;
        }
    };
    
    increaseBtn.onclick = () => {
        productQuantity++;
        document.getElementById('productQuantity').textContent = productQuantity;
    };
    
    addToCartBtn.onclick = () => {
        if (!selectedSize) {
            showNotification('Please select a size', 'error');
            return;
        }
        
        for (let i = 0; i < productQuantity; i++) {
            addToCart(product.id);
        }
        
        showNotification(`Added ${productQuantity} ${product.name} (Size ${selectedSize}) to cart!`, 'success');
        modal.style.display = 'none';
        selectedSize = null;
        productQuantity = 1;
    };
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            selectedSize = null;
            productQuantity = 1;
        }
    };
}

function handleContactForm(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    // Validate form
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    if (!validateContactForm(name, email, message)) {
        return;
    }
    
    // Show loading state
    showLoadingOverlay();
    form.classList.add('form-loading');
    
    // Simulate API call
    setTimeout(() => {
        hideLoadingOverlay();
        form.classList.remove('form-loading');
        form.reset();
        showNotification('Message sent successfully!', 'success');
    }, 2000);
}

function validateContactForm(name, email, message) {
    let isValid = true;
    
    if (!name || name.trim().length < 2) {
        showNotification('Name must be at least 2 characters long', 'error');
        isValid = false;
    }
    
    if (!validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        isValid = false;
    }
    
    if (!message || message.trim().length < 10) {
        showNotification('Message must be at least 10 characters long', 'error');
        isValid = false;
    }
    
    return isValid;
}

function handleNewsletter(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.querySelector('input[type="email"]').value;
    
    if (!validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button');
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
        form.reset();
        showNotification('Successfully subscribed to newsletter!', 'success');
    }, 2000);
}

// Loading Overlay Functions
function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Email Validation Function
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;

    document.body.appendChild(notification);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Authentication System
let isLoginMode = true;
let currentUser = null;

// Check if user is logged in on page load
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
        currentUser = JSON.parse(userData);
        updateAuthUI(true);
    }
}

function updateAuthUI(isLoggedIn) {
    const loginBtn = document.querySelector('.login-btn');
    const userMenu = document.querySelector('.user-menu');
    
    if (isLoggedIn && currentUser) {
        if (loginBtn) {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> ${currentUser.name}`;
            loginBtn.onclick = toggleUserMenu;
        }
        
        if (!userMenu) {
            createUserMenu();
        }
    } else {
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-user"></i> Login';
            loginBtn.onclick = toggleAuthModal;
        }
        
        if (userMenu) {
            userMenu.remove();
        }
    }
}

// Create user dropdown menu
function createUserMenu() {
    const header = document.querySelector('.header');
    const loginBtn = document.querySelector('.login-btn');
    
    if (!loginBtn) return;
    
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.style.cssText = `
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        min-width: 200px;
        display: none;
        z-index: 1000;
    `;
    
    userMenu.innerHTML = `
        <div style="padding: 15px; border-bottom: 1px solid #eee;">
            <strong>${currentUser.name}</strong>
            <div style="color: #666; font-size: 14px;">${currentUser.email}</div>
        </div>
        <div style="padding: 10px 0;">
            <a href="#" onclick="showProfile()" style="display: block; padding: 10px 15px; text-decoration: none; color: #333; transition: background 0.3s;">
                <i class="fas fa-user"></i> Profile
            </a>
            <a href="#" onclick="showOrders()" style="display: block; padding: 10px 15px; text-decoration: none; color: #333; transition: background 0.3s;">
                <i class="fas fa-shopping-bag"></i> My Orders
            </a>
            <a href="#" onclick="logout()" style="display: block; padding: 10px 15px; text-decoration: none; color: #e74c3c; transition: background 0.3s;">
                <i class="fas fa-sign-out-alt"></i> Logout
            </a>
        </div>
    `;
    
    loginBtn.parentElement.style.position = 'relative';
    loginBtn.parentElement.appendChild(userMenu);
}

// Toggle user menu
function toggleUserMenu() {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
    }
}

document.addEventListener('click', (e) => {
    const userMenu = document.querySelector('.user-menu');
    const loginBtn = document.querySelector('.login-btn');
    
    if (userMenu && !userMenu.contains(e.target) && !loginBtn.contains(e.target)) {
        userMenu.style.display = 'none';
    }
});

function showProfile() {
    window.location.href = 'profile.html';
    toggleUserMenu();
}

function showOrders() {
    window.location.href = 'profile.html#orders';
    toggleUserMenu();
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    currentUser = null;
    updateAuthUI(false);
    showNotification('Logged out successfully!', 'success');
    toggleUserMenu();
}

// Toggle auth modal
function toggleAuthModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
        if (modal.style.display === 'block') {
            document.getElementById('email').focus();
        }
    }
}

function switchAuthMode() {
    isLoginMode = !isLoginMode;
    const modalTitle = document.getElementById('modalTitle');
    const authSubmit = document.getElementById('authSubmit');
    const authSwitchText = document.getElementById('authSwitchText');
    const authSwitchLink = document.getElementById('authSwitchLink');
    const nameGroup = document.getElementById('nameGroup');
    
    if (isLoginMode) {
        modalTitle.textContent = 'Login';
        authSubmit.textContent = 'Login';
        authSwitchText.textContent = "Don't have an account?";
        authSwitchLink.textContent = 'Register';
        nameGroup.style.display = 'none';
        document.getElementById('fullName').required = false;
    } else {
        modalTitle.textContent = 'Register';
        authSubmit.textContent = 'Register';
        authSwitchText.textContent = 'Already have an account?';
        authSwitchLink.textContent = 'Login';
        nameGroup.style.display = 'block';
        document.getElementById('fullName').required = true;
    }
    
    document.getElementById('authForm').reset();
}

function handleAuthSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const fullName = document.getElementById('fullName').value;
    
    // Clear previous error messages
    clearFormErrors();
    
    // Validate form
    if (!validateAuthForm(email, password, fullName)) {
        return;
    }
    
    // Show loading state
    const submitBtn = document.getElementById('authSubmit');
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    
    if (isLoginMode) {
        handleLogin(email, password);
    } else {
        handleRegister(email, password, fullName);
    }
}

function validateAuthForm(email, password, fullName) {
    let isValid = true;
    
    // Email validation
    if (!validateEmail(email)) {
        showFieldError('emailError', 'Please enter a valid email address');
        markFieldInvalid('email');
        isValid = false;
    } else {
        markFieldValid('email');
    }
    
    // Password validation
    if (password.length < 6) {
        showFieldError('passwordError', 'Password must be at least 6 characters long');
        markFieldInvalid('password');
        isValid = false;
    } else {
        markFieldValid('password');
    }
    
    // Full name validation (for registration)
    if (!isLoginMode) {
        if (!fullName || fullName.trim().length < 2) {
            showFieldError('nameError', 'Full name must be at least 2 characters long');
            markFieldInvalid('fullName');
            isValid = false;
        } else {
            markFieldValid('fullName');
        }
    }
    
    return isValid;
}

function showFieldError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function clearFormErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.classList.remove('show');
        element.textContent = '';
    });
    
    const inputs = document.querySelectorAll('.form-group input');
    inputs.forEach(input => {
        input.classList.remove('valid', 'invalid');
    });
}

function markFieldValid(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.remove('invalid');
        field.classList.add('valid');
    }
}

function markFieldInvalid(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.classList.remove('valid');
        field.classList.add('invalid');
    }
}

async function handleLogin(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            currentUser = data.user;
            updateAuthUI(true);
            toggleAuthModal();
            showNotification('Login successful!', 'success');
        } else {
            showNotification(data.message || 'Login failed!', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Network error. Please try again.', 'error');
    } finally {
        // Remove loading state
        const submitBtn = document.getElementById('authSubmit');
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }
}

// Handle registration
async function handleRegister(email, password, fullName) {
    if (!fullName.trim()) {
        showNotification('Please enter your full name.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long.', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email, 
                password, 
                full_name: fullName 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userData', JSON.stringify(data.user));
            currentUser = data.user;
            updateAuthUI(true);
            toggleAuthModal();
            showNotification('Registration successful! Welcome!', 'success');
        } else {
            showNotification(data.message || 'Registration failed!', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Network error. Please try again.', 'error');
    } finally {
        // Remove loading state
        const submitBtn = document.getElementById('authSubmit');
        submitBtn.classList.remove('btn-loading');
        submitBtn.disabled = false;
    }
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    return icons[type] || 'fa-info-circle';
}

// Search function
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (searchTerm.trim() === '') {
        displayedProducts = [...products];
    } else {
        displayedProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    renderProducts();
    
    if (displayedProducts.length === 0) {
        showNotification('No products found matching your criteria.', 'info');
    }
}

const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
`;
document.head.appendChild(notificationStyles);

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    let scrollTopBtn = document.getElementById('scrollTopBtn');
    if (!scrollTopBtn) {
        scrollTopBtn = document.createElement('button');
        scrollTopBtn.id = 'scrollTopBtn';
        scrollTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        scrollTopBtn.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            z-index: 1000;
        `;
        
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        document.body.appendChild(scrollTopBtn);
    }
    
    if (scrollTop > 300) {
        scrollTopBtn.style.display = 'flex';
    } else {
        scrollTopBtn.style.display = 'none';
    }
});

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.category-card, .feature, .contact-item');
    animateElements.forEach(el => observer.observe(el));
});