let adminToken = null;
let currentAdmin = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    initializeEventListeners();
});

function initializeEventListeners() {
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }

    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            switchSection(section);
        });
    });

    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
    });

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

function checkAdminAuth() {
    adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (adminToken && adminData) {
        currentAdmin = JSON.parse(adminData);
        showDashboard();
        loadDashboardData();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('dashboardSection').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    
    if (currentAdmin) {
        document.getElementById('adminUserName').textContent = `${currentAdmin.firstName} ${currentAdmin.lastName}`;
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const loginBtn = document.getElementById('adminLoginBtn');
    
    if (!username || !password) {
        showError('usernameError', 'Username and password are required');
        return;
    }
    
    loginBtn.classList.add('btn-loading');
    loginBtn.disabled = true;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            adminToken = data.token;
            currentAdmin = data.admin;
            
            localStorage.setItem('adminToken', adminToken);
            localStorage.setItem('adminData', JSON.stringify(currentAdmin));
            
            showDashboard();
            loadDashboardData();
            showNotification('Login successful!', 'success');
        } else {
            showError('passwordError', data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Admin login error:', error);
        showError('passwordError', 'Network error. Please try again.');
    } finally {
        loginBtn.classList.remove('btn-loading');
        loginBtn.disabled = false;
    }
}

function adminLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    adminToken = null;
    currentAdmin = null;
    showLogin();
    showNotification('Logged out successfully!', 'success');
}

function switchSection(sectionName) {
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    menuItems.forEach(item => item.classList.remove('active'));
    contentSections.forEach(section => section.classList.remove('active'));
    
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    document.getElementById(`${sectionName}Content`).classList.add('active');
    
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'products':
            loadProducts();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'users':
            loadUsers();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'messages':
            loadMessages();
            break;
    }
}

async function loadDashboardData() {
    try {
        showLoading();
        
        const [statsResponse, ordersResponse] = await Promise.all([
            fetch('/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }),
            fetch('/api/admin/orders/recent', {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            })
        ]);
        
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            updateDashboardStats(stats);
        }
        
        if (ordersResponse.ok) {
            const orders = await ordersResponse.json();
            updateRecentOrders(orders);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    } finally {
        hideLoading();
    }
}

function updateDashboardStats(stats) {
    document.getElementById('totalProducts').textContent = stats.totalProducts || 0;
    document.getElementById('totalOrders').textContent = stats.totalOrders || 0;
    document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
    document.getElementById('totalRevenue').textContent = `$${stats.totalRevenue || 0}`;
}

function updateRecentOrders(orders) {
    const tbody = document.querySelector('#recentOrdersTable tbody');
    tbody.innerHTML = '';
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${order.order_number}</td>
            <td>${order.first_name} ${order.last_name}</td>
            <td>$${order.total_amount}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>${new Date(order.created_at).toLocaleDateString()}</td>
        `;
        tbody.appendChild(row);
    });
}

async function loadProducts() {
    try {
        showLoading();
        
        const response = await fetch('/api/admin/products', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            const products = await response.json();
            updateProductsTable(products);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products', 'error');
    } finally {
        hideLoading();
    }
}

function updateProductsTable(products) {
    const tbody = document.querySelector('#productsTable tbody');
    tbody.innerHTML = '';
    
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${product.primary_image || '/assets/images/placeholder.jpg'}" alt="${product.name}" class="product-image"></td>
            <td>${product.name}</td>
            <td>${product.category_name || 'N/A'}</td>
            <td>$${product.price}</td>
            <td>${product.stock_quantity}</td>
            <td><span class="status-badge ${product.is_active ? 'status-active' : 'status-inactive'}">${product.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-edit" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-delete" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function loadOrders() {
    try {
        showLoading();
        
        const response = await fetch('/api/admin/orders', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            const orders = await response.json();
            updateOrdersTable(orders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('Error loading orders', 'error');
    } finally {
        hideLoading();
    }
}

function updateOrdersTable(orders) {
    const tbody = document.querySelector('#ordersTable tbody');
    tbody.innerHTML = '';
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${order.order_number}</td>
            <td>${order.first_name} ${order.last_name}</td>
            <td>${order.item_count} items</td>
            <td>$${order.total_amount}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td><span class="status-badge status-${order.payment_status}">${order.payment_status}</span></td>
            <td>${new Date(order.created_at).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-view" onclick="viewOrder(${order.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-edit" onclick="updateOrderStatus(${order.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function loadUsers() {
    try {
        showLoading();
        
        const response = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            const users = await response.json();
            updateUsersTable(users);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error loading users', 'error');
    } finally {
        hideLoading();
    }
}

function updateUsersTable(users) {
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.first_name} ${user.last_name}</td>
            <td>${user.email}</td>
            <td>${user.phone || 'N/A'}</td>
            <td><span class="status-badge ${user.is_active ? 'status-active' : 'status-inactive'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-view" onclick="viewUser(${user.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-edit" onclick="toggleUserStatus(${user.id}, ${user.is_active})">
                        <i class="fas fa-${user.is_active ? 'ban' : 'check'}"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function loadCategories() {
    try {
        showLoading();
        
        const response = await fetch('/api/admin/categories', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            const categories = await response.json();
            updateCategoriesTable(categories);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showNotification('Error loading categories', 'error');
    } finally {
        hideLoading();
    }
}

function updateCategoriesTable(categories) {
    const tbody = document.querySelector('#categoriesTable tbody');
    tbody.innerHTML = '';
    
    categories.forEach(category => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category.name}</td>
            <td>${category.slug}</td>
            <td>${category.product_count || 0}</td>
            <td><span class="status-badge ${category.is_active ? 'status-active' : 'status-inactive'}">${category.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-edit" onclick="editCategory(${category.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-delete" onclick="deleteCategory(${category.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function loadMessages() {
    try {
        showLoading();
        
        const response = await fetch('/api/admin/messages', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            const messages = await response.json();
            updateMessagesTable(messages);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        showNotification('Error loading messages', 'error');
    } finally {
        hideLoading();
    }
}

function updateMessagesTable(messages) {
    const tbody = document.querySelector('#messagesTable tbody');
    tbody.innerHTML = '';
    
    messages.forEach(message => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${message.name}</td>
            <td>${message.email}</td>
            <td>${message.subject || 'No Subject'}</td>
            <td><span class="status-badge ${message.is_read ? 'status-active' : 'status-pending'}">${message.is_read ? 'Read' : 'Unread'}</span></td>
            <td>${new Date(message.created_at).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-view" onclick="viewMessage(${message.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-delete" onclick="deleteMessage(${message.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showAddProductModal() {
    document.getElementById('addProductModal').style.display = 'block';
    loadProductFormData();
}

function showAddCategoryModal() {
    showNotification('Add category functionality coming soon!', 'info');
}

async function loadProductFormData() {
    try {
        const [categoriesResponse, brandsResponse] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/brands')
        ]);
        
        if (categoriesResponse.ok) {
            const categories = await categoriesResponse.json();
            const categorySelect = document.getElementById('productCategory');
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            categories.forEach(category => {
                categorySelect.innerHTML += `<option value="${category.id}">${category.name}</option>`;
            });
        }
        
        if (brandsResponse.ok) {
            const brands = await brandsResponse.json();
            const brandSelect = document.getElementById('productBrand');
            brandSelect.innerHTML = '<option value="">Select Brand</option>';
            brands.forEach(brand => {
                brandSelect.innerHTML += `<option value="${brand.id}">${brand.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading form data:', error);
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function editProduct(productId) {
    showNotification('Edit product functionality coming soon!', 'info');
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        showNotification('Delete product functionality coming soon!', 'info');
    }
}

function viewOrder(orderId) {
    showNotification('View order details functionality coming soon!', 'info');
}

function updateOrderStatus(orderId) {
    showNotification('Update order status functionality coming soon!', 'info');
}

function viewUser(userId) {
    showNotification('View user details functionality coming soon!', 'info');
}

function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} this user?`)) {
        showNotification('Toggle user status functionality coming soon!', 'info');
    }
}

function editCategory(categoryId) {
    showNotification('Edit category functionality coming soon!', 'info');
}

function deleteCategory(categoryId) {
    if (confirm('Are you sure you want to delete this category?')) {
        showNotification('Delete category functionality coming soon!', 'info');
    }
}

function viewMessage(messageId) {
    showNotification('View message functionality coming soon!', 'info');
}

function deleteMessage(messageId) {
    if (confirm('Are you sure you want to delete this message?')) {
        showNotification('Delete message functionality coming soon!', 'info');
    }
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    
    switch(type) {
        case 'success':
            notification.style.background = '#28a745';
            break;
        case 'error':
            notification.style.background = '#dc3545';
            break;
        case 'warning':
            notification.style.background = '#ffc107';
            notification.style.color = '#333';
            break;
        default:
            notification.style.background = '#17a2b8';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}