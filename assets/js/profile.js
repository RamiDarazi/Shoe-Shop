document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    initializeProfile();
    setupEventListeners();
    handleUrlHash();
});

function handleUrlHash() {
    const hash = window.location.hash.substring(1);
    if (hash && ['overview', 'personal', 'orders', 'addresses', 'security'].includes(hash)) {
        switchSection(hash);
    }
}

function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.name) {
        document.getElementById('userName').textContent = userData.name;
        document.getElementById('userEmail').textContent = userData.email;
    }
}

function initializeProfile() {
    loadUserData();
    loadOverviewData();
    loadUserOrders();
    loadUserAddresses();
}

function setupEventListeners() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            switchSection(section);
        });
    });

    document.getElementById('personalInfoForm').addEventListener('submit', handlePersonalInfoUpdate);
    document.getElementById('passwordChangeForm').addEventListener('submit', handlePasswordChange);
    document.getElementById('addAddressForm').addEventListener('submit', handleAddAddress);
    document.getElementById('orderStatusFilter').addEventListener('change', filterOrders);

    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });

    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

function switchSection(sectionName) {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.content-section');
    
    menuItems.forEach(item => item.classList.remove('active'));
    sections.forEach(section => section.classList.remove('active'));
    
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    document.getElementById(`${sectionName}Section`).classList.add('active');
    
    if (sectionName === 'orders') {
        loadUserOrders();
    } else if (sectionName === 'addresses') {
        loadUserAddresses();
    }
}

async function loadUserData() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            populatePersonalForm(userData);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

function populatePersonalForm(userData) {
    document.getElementById('firstName').value = userData.first_name || '';
    document.getElementById('lastName').value = userData.last_name || '';
    document.getElementById('email').value = userData.email || '';
    document.getElementById('phone').value = userData.phone || '';
    document.getElementById('dateOfBirth').value = userData.date_of_birth || '';
    document.getElementById('gender').value = userData.gender || '';
}

async function loadOverviewData() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/user/overview', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('totalOrders').textContent = data.totalOrders || 0;
            document.getElementById('totalSpent').textContent = `$${data.totalSpent || 0}`;
            document.getElementById('wishlistItems').textContent = data.wishlistItems || 0;
            
            displayRecentOrders(data.recentOrders || []);
        }
    } catch (error) {
        console.error('Error loading overview data:', error);
        document.getElementById('recentOrdersList').innerHTML = '<p>Unable to load recent orders</p>';
    }
}

function displayRecentOrders(orders) {
    const container = document.getElementById('recentOrdersList');
    
    if (orders.length === 0) {
        container.innerHTML = '<p>No recent orders found</p>';
        return;
    }
    
    const ordersHtml = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-number">Order #${order.id}</span>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            <div class="order-details">
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <div class="item-image">
                                <i class="fas fa-shoe-prints"></i>
                            </div>
                            <div class="item-info">
                                <div class="item-name">${item.name}</div>
                                <div class="item-details">Size: ${item.size} | Qty: ${item.quantity}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">
                    <div class="total-amount">$${order.total}</div>
                    <div class="order-date">${new Date(order.created_at).toLocaleDateString()}</div>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = ordersHtml;
}

async function loadUserOrders() {
    try {
        showLoading();
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/user/orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const orders = await response.json();
            displayAllOrders(orders);
        } else {
            document.getElementById('ordersList').innerHTML = '<p>Unable to load orders</p>';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('ordersList').innerHTML = '<p>Error loading orders</p>';
    } finally {
        hideLoading();
    }
}

function displayAllOrders(orders) {
    const container = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        container.innerHTML = '<p>No orders found</p>';
        return;
    }
    
    const ordersHtml = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-number">Order #${order.id}</span>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            <div class="order-details">
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <div class="item-image">
                                <i class="fas fa-shoe-prints"></i>
                            </div>
                            <div class="item-info">
                                <div class="item-name">${item.name}</div>
                                <div class="item-details">Size: ${item.size} | Qty: ${item.quantity} | $${item.price}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">
                    <div class="total-amount">$${order.total}</div>
                    <div class="order-date">${new Date(order.created_at).toLocaleDateString()}</div>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = ordersHtml;
}

function filterOrders() {
    const filterValue = document.getElementById('orderStatusFilter').value;
    const orderCards = document.querySelectorAll('.order-card');
    
    orderCards.forEach(card => {
        const status = card.querySelector('.order-status').textContent.toLowerCase();
        if (!filterValue || status === filterValue) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

async function loadUserAddresses() {
    try {
        showLoading();
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/user/addresses', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const addresses = await response.json();
            displayAddresses(addresses);
        } else {
            document.getElementById('addressesList').innerHTML = '<p>Unable to load addresses</p>';
        }
    } catch (error) {
        console.error('Error loading addresses:', error);
        document.getElementById('addressesList').innerHTML = '<p>Error loading addresses</p>';
    } finally {
        hideLoading();
    }
}

function displayAddresses(addresses) {
    const container = document.getElementById('addressesList');
    
    if (addresses.length === 0) {
        container.innerHTML = '<p>No addresses found. Add your first address to get started.</p>';
        return;
    }
    
    const addressesHtml = addresses.map(address => `
        <div class="address-card ${address.is_default ? 'default' : ''}">
            ${address.is_default ? '<div class="default-badge">Default</div>' : ''}
            <div class="address-type">${address.type}</div>
            <div class="address-name">${address.first_name} ${address.last_name}</div>
            <div class="address-details">
                ${address.company ? `${address.company}<br>` : ''}
                ${address.address_line_1}<br>
                ${address.address_line_2 ? `${address.address_line_2}<br>` : ''}
                ${address.city}, ${address.state} ${address.postal_code}<br>
                ${address.country}
                ${address.phone ? `<br>Phone: ${address.phone}` : ''}
            </div>
            <div class="address-actions">
                <button class="btn btn-small btn-secondary" onclick="editAddress(${address.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-small btn-danger" onclick="deleteAddress(${address.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
                ${!address.is_default ? `<button class="btn btn-small btn-primary" onclick="setDefaultAddress(${address.id})">Set Default</button>` : ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = addressesHtml;
}

async function handlePersonalInfoUpdate(e) {
    e.preventDefault();
    
    const formData = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        date_of_birth: document.getElementById('dateOfBirth').value,
        gender: document.getElementById('gender').value
    };
    
    try {
        showLoading();
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification('Profile updated successfully!', 'success');
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            userData.name = `${formData.first_name} ${formData.last_name}`;
            userData.email = formData.email;
            localStorage.setItem('userData', JSON.stringify(userData));
            
            document.getElementById('userName').textContent = userData.name;
            document.getElementById('userEmail').textContent = userData.email;
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('An error occurred while updating profile', 'error');
    } finally {
        hideLoading();
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }
    
    try {
        showLoading();
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/user/change-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        if (response.ok) {
            showNotification('Password changed successfully!', 'success');
            document.getElementById('passwordChangeForm').reset();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification('An error occurred while changing password', 'error');
    } finally {
        hideLoading();
    }
}

function showAddAddressModal() {
    document.getElementById('addAddressModal').classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

async function handleAddAddress(e) {
    e.preventDefault();
    
    const formData = {
        type: document.getElementById('addressType').value,
        first_name: document.getElementById('addressFirstName').value,
        last_name: document.getElementById('addressLastName').value,
        company: document.getElementById('addressCompany').value,
        address_line_1: document.getElementById('addressLine1').value,
        address_line_2: document.getElementById('addressLine2').value,
        city: document.getElementById('addressCity').value,
        state: document.getElementById('addressState').value,
        postal_code: document.getElementById('addressPostalCode').value,
        country: document.getElementById('addressCountry').value,
        phone: document.getElementById('addressPhone').value,
        is_default: document.getElementById('isDefaultAddress').checked
    };
    
    try {
        showLoading();
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/user/addresses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showNotification('Address added successfully!', 'success');
            closeModal('addAddressModal');
            document.getElementById('addAddressForm').reset();
            loadUserAddresses();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to add address', 'error');
        }
    } catch (error) {
        console.error('Error adding address:', error);
        showNotification('An error occurred while adding address', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteAddress(addressId) {
    if (!confirm('Are you sure you want to delete this address?')) {
        return;
    }
    
    try {
        showLoading();
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/user/addresses/${addressId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showNotification('Address deleted successfully!', 'success');
            loadUserAddresses();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to delete address', 'error');
        }
    } catch (error) {
        console.error('Error deleting address:', error);
        showNotification('An error occurred while deleting address', 'error');
    } finally {
        hideLoading();
    }
}

async function setDefaultAddress(addressId) {
    try {
        showLoading();
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/user/addresses/${addressId}/default`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showNotification('Default address updated!', 'success');
            loadUserAddresses();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Failed to update default address', 'error');
        }
    } catch (error) {
        console.error('Error updating default address:', error);
        showNotification('An error occurred while updating default address', 'error');
    } finally {
        hideLoading();
    }
}

function editAddress(addressId) {
    showNotification('Edit address feature coming soon!', 'info');
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}