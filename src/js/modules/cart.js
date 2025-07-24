// Cart Module - Handles all shopping cart functionality
// Optimized with better error handling and performance improvements

class CartManager {
    constructor() {
        this.cart = [];
        this.currentCurrency = '₪';
        this.cartCountElement = null;
        this.cartModal = null;
        this.isInitialized = false;

        // Performance optimizations
        this.renderQueue = [];
        this.isRendering = false;
        this.lastRenderTime = 0;
        this.renderThrottle = 100; // ms

        // State management
        this.state = {
            isOpen: false,
            isLoading: false,
            lastUpdated: null,
            version: 1
        };

        // Caching
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes

        // Performance tracking
        this.performanceMetrics = {
            addToCartTime: [],
            renderTime: [],
            storageTime: []
        };

        // Bind methods to preserve context
        this.addToCart = this.addToCart.bind(this);
        this.removeFromCart = this.removeFromCart.bind(this);
        this.updateQuantity = this.updateQuantity.bind(this);
        this.renderCartItems = this.renderCartItems.bind(this);

        // Error handling
        this.setupErrorHandling();
    }

    // State management
    setState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };

        // Dispatch state change event
        window.dispatchEvent(new CustomEvent('cart-state-change', {
            detail: { oldState, newState: this.state }
        }));
    }

    // Cache management
    setCache(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        // Check if cache is expired
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }

        return cached.value;
    }

    clearCache() {
        this.cache.clear();
    }

    // Performance tracking
    trackPerformance(operation, duration) {
        if (this.performanceMetrics[operation]) {
            this.performanceMetrics[operation].push({
                duration: Math.round(duration * 100) / 100,
                timestamp: Date.now()
            });

            // Keep only last 100 entries
            if (this.performanceMetrics[operation].length > 100) {
                this.performanceMetrics[operation] = this.performanceMetrics[operation].slice(-100);
            }
        }
    }

    // Optimized render queue system
    queueRender() {
        this.renderQueue.push(Date.now());

        if (!this.isRendering) {
            this.processRenderQueue();
        }
    }

    processRenderQueue() {
        const now = Date.now();

        // Throttle renders
        if (now - this.lastRenderTime < this.renderThrottle) {
            setTimeout(() => this.processRenderQueue(), this.renderThrottle);
            return;
        }

        this.isRendering = true;
        this.lastRenderTime = now;

        const startTime = performance.now();

        try {
            // Update cart display if modal is open
            if (this.cartModal?.classList.contains('active')) {
                this.renderCartItems();
            }

            // Track render performance
            const duration = performance.now() - startTime;
            this.trackPerformance('renderTime', duration);

        } catch (error) {
            this.handleError('Error during render', error);
        } finally {
            this.isRendering = false;
            this.renderQueue = [];
        }
    }

    // Initialize the cart system
    init() {
        if (this.isInitialized) {
            console.warn('Cart manager already initialized');
            return;
        }

        try {
            this.loadCartFromStorage();
            this.detectCurrency();
            this.normalizeCurrencyInCart();
            this.setupDOM();
            this.initCartModal();
            this.initAddToCartButtons();
            this.updateCartCountFromStorage();
            this.isInitialized = true;

            // Make addToCart globally accessible for compatibility
            window.addToCart = this.addToCart;
            window.renderCartItems = this.renderCartItems;

            console.log('Cart manager initialized successfully');
        } catch (error) {
            this.handleError('Failed to initialize cart', error);
        }
    }

    // Setup error handling
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            if (event.filename && event.filename.includes('cart.js')) {
                this.handleError('Cart module error', event.error);
            }
        });
    }

    // Improved error handling with user feedback
    handleError(message, error) {
        console.error(`Cart Error: ${message}`, error);

        // Show user-friendly error message
        this.showNotification(`Something went wrong with your cart. Please try refreshing the page.`, 'error');

        // Try to recover by resetting cart if it's corrupted
        if (message.includes('parsing') || message.includes('corrupted')) {
            this.resetCart();
        }
    }

    // Load cart from localStorage with error handling
    loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                if (Array.isArray(parsedCart)) {
                    this.cart = parsedCart;
                } else {
                    throw new Error('Invalid cart data structure');
                }
            }
        } catch (error) {
            this.handleError('Error loading cart from storage', error);
            this.cart = [];
            this.saveCartToStorage();
        }
    }

    // Save cart to localStorage with error handling
    saveCartToStorage() {
        try {
            localStorage.setItem('cart', JSON.stringify(this.cart));
        } catch (error) {
            this.handleError('Error saving cart to storage', error);
        }
    }

    // Detect currency from various sources
    detectCurrency() {
        try {
            // Priority: window.artworkData > localStorage > cart items > default
            if (window.artworkData?.settings?.currency) {
                this.currentCurrency = window.artworkData.settings.currency;
            } else {
                const savedData = localStorage.getItem('evgenia-artwork-data');
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    if (parsedData?.settings?.currency) {
                        this.currentCurrency = parsedData.settings.currency;
                    }
                }
            }

            // Extract currency from existing cart items if available
            if (this.cart.length > 0 && this.cart[0].price) {
                const match = this.cart[0].price.match(/^[^\d\s]+/);
                if (match?.[0]) {
                    this.currentCurrency = match[0];
                }
            }

            window.currentCurrency = this.currentCurrency;
        } catch (error) {
            this.handleError('Error detecting currency', error);
        }
    }

    // Normalize currency across all cart items
    normalizeCurrencyInCart() {
        if (!this.cart.length) return;

        try {
            let hasChanges = false;
            this.cart.forEach(item => {
                if (item.price) {
                    const match = item.price.match(/^[^\d\s]+/);
                    if (match && match[0] !== this.currentCurrency) {
                        const numericPrice = parseFloat(item.price.replace(/[^\d.]/g, ''));
                        if (!isNaN(numericPrice)) {
                            item.price = `${this.currentCurrency}${numericPrice.toFixed(2)}`;
                            hasChanges = true;
                        }
                    } else if (!match) {
                        const numericPrice = parseFloat(item.price.replace(/[^\d.]/g, ''));
                        if (!isNaN(numericPrice)) {
                            item.price = `${this.currentCurrency}${numericPrice.toFixed(2)}`;
                            hasChanges = true;
                        }
                    }
                }
            });

            if (hasChanges) {
                this.saveCartToStorage();
            }
        } catch (error) {
            this.handleError('Error normalizing currency', error);
        }
    }

    // Setup DOM elements
    setupDOM() {
        this.cartCountElement = document.querySelector('.cart-count');
        this.cartModal = document.querySelector('.cart-modal-overlay');

        if (!this.cartModal) {
            console.warn('Cart modal not found in DOM');
        }
    }

    // Add item to cart with validation and optimization
    addToCart(item) {
        const startTime = performance.now();

        try {
            // Validate input
            if (!item || !item.id || !item.title) {
                throw new Error('Invalid item data');
            }

            // Set loading state
            this.setState({ isLoading: true });

            // Check cache first
            const cacheKey = `item_${item.id}`;
            const cachedItem = this.getFromCache(cacheKey);

            if (cachedItem) {
                item = { ...cachedItem, ...item }; // Merge with cached data
            }

            // Refresh cart from storage to ensure consistency
            this.loadCartFromStorage();

            // Ensure proper currency formatting
            if (item.price) {
                const numericPrice = parseFloat(item.price.replace(/[^\d.]/g, ''));
                if (!isNaN(numericPrice)) {
                    item.price = `${this.currentCurrency}${numericPrice.toFixed(2)}`;
                }
            }

            // Ensure image path is absolute
            if (item.image && !item.image.startsWith('/')) {
                item.image = `/${item.image}`;
            }

            // Cache the processed item
            this.setCache(cacheKey, item);

            // Check if item already exists
            const existingItemIndex = this.cart.findIndex(cartItem => cartItem.id === item.id);

            if (existingItemIndex !== -1) {
                // Artwork is unique - don't allow duplicates
                this.showNotification(`${item.title} is already in your cart`, 'info');
                this.setState({ isLoading: false });
                return false;
            } else {
                // Add new item (quantity is always 1 for unique artworks)
                this.cart.push({ ...item, quantity: 1 });
            }

            this.saveCartToStorage();
            this.normalizeCurrencyInCart();
            this.updateCartCount();

            // Queue render instead of immediate render for better performance
            this.queueRender();

            this.showNotification(`${item.title} added to cart`, 'success');

            // Track performance
            const duration = performance.now() - startTime;
            this.trackPerformance('addToCart', duration);

            this.setState({ isLoading: false, lastUpdated: Date.now() });
            return true;

        } catch (error) {
            this.setState({ isLoading: false });
            this.handleError('Error adding item to cart', error);
            return false;
        }
    }

    // Remove item from cart
    removeFromCart(itemId) {
        try {
            const initialLength = this.cart.length;
            this.cart = this.cart.filter(item => item.id !== itemId);

            if (this.cart.length < initialLength) {
                this.saveCartToStorage();
                this.updateCartCount();
                this.renderCartItems();
                this.showNotification('Item removed from cart', 'info');
            }
        } catch (error) {
            this.handleError('Error removing item from cart', error);
        }
    }

    // Update item quantity
    updateQuantity(itemId, quantity) {
        try {
            const itemIndex = this.cart.findIndex(item => item.id === itemId);

            if (itemIndex !== -1) {
                if (quantity <= 0) {
                    this.cart.splice(itemIndex, 1);
                } else {
                    this.cart[itemIndex].quantity = Math.max(1, Math.min(99, quantity));
                }

                this.saveCartToStorage();
                this.updateCartCount();
                this.renderCartItems();
            }
        } catch (error) {
            this.handleError('Error updating quantity', error);
        }
    }

    // Calculate cart total
    calculateTotal() {
        try {
            return this.cart.reduce((total, item) => {
                const numericPrice = parseFloat(item.price.replace(/[^\d.]/g, ''));
                return total + (isNaN(numericPrice) ? 0 : numericPrice * item.quantity);
            }, 0).toFixed(2);
        } catch (error) {
            this.handleError('Error calculating total', error);
            return '0.00';
        }
    }

    // Update cart count display
    updateCartCount() {
        if (!this.cartCountElement) return;

        try {
            const totalItems = this.cart.reduce((total, item) => total + item.quantity, 0);
            this.cartCountElement.textContent = totalItems;

            // Update add to cart button states
            this.updateAddToCartButtonStates();
            this.cartCountElement.style.display = totalItems > 0 ? 'flex' : 'none';
        } catch (error) {
            this.handleError('Error updating cart count', error);
        }
    }

    // Update add to cart button states based on cart contents
    updateAddToCartButtonStates() {
        try {
            document.querySelectorAll('.add-to-cart, .add-to-cart-btn').forEach(button => {
                const artworkId = button.getAttribute('data-id') || button.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
                if (artworkId) {
                    const isInCart = this.cart.some(item => item.id === artworkId);
                    if (isInCart) {
                        button.textContent = 'Already in Cart';
                        button.classList.add('in-cart');
                        button.disabled = true;
                    } else {
                        button.textContent = 'Add to Cart';
                        button.classList.remove('in-cart');
                        button.disabled = false;
                    }
                }
            });
        } catch (error) {
            this.handleError('Error updating button states', error);
        }
    }

    // Schedule button state update with delay to ensure DOM is ready
    scheduleButtonStateUpdate() {
        // Update immediately
        this.updateAddToCartButtonStates();
        
        // Also update after a short delay in case buttons aren't ready yet
        setTimeout(() => {
            this.updateAddToCartButtonStates();
        }, 100);
        
        // Also update after page is fully loaded
        setTimeout(() => {
            this.updateAddToCartButtonStates();
        }, 500);
    }

    // Update cart count from storage (for page loads)
    updateCartCountFromStorage() {
        try {
            this.loadCartFromStorage();
            this.updateCartCount();
            // Schedule button state update to handle timing issues
            this.scheduleButtonStateUpdate();
        } catch (error) {
            this.handleError('Error updating cart count from storage', error);
        }
    }

    // Show user notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `cart-notification cart-notification-${type}`;
        notification.textContent = message;

        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '4px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            backgroundColor: type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'
        });

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Reset cart (for error recovery)
    resetCart() {
        this.cart = [];
        this.saveCartToStorage();
        this.updateCartCount();
        if (this.cartModal?.classList.contains('active')) {
            this.renderCartItems();
        }
    }

    // Initialize add to cart buttons (for compatibility with artwork-loader.js)
    initAddToCartButtons() {
        // This method is called by the external artwork loader
        // The actual button handling is done in the artwork-loader.js file
        // We just ensure the global addToCart function is available
        console.log('Cart buttons initialized');
    }

    // Initialize cart modal functionality
    initCartModal() {
        if (!this.cartModal) return;

        try {
            const cartIcon = document.querySelector('.cart-icon');
            const cartClose = document.querySelector('.cart-close');
            const cartEmptyBtn = document.querySelector('.cart-empty');
            const cartCheckoutBtn = document.querySelector('.cart-checkout');

            if (!cartIcon) {
                console.warn('Cart icon not found');
                return;
            }

            // Open cart modal
            cartIcon.addEventListener('click', (e) => {
                e.preventDefault();
                this.renderCartItems();
                this.cartModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });

            // Close cart modal
            if (cartClose) {
                cartClose.addEventListener('click', () => {
                    this.cartModal.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }

            // Close on outside click
            this.cartModal.addEventListener('click', (e) => {
                if (e.target === this.cartModal) {
                    this.cartModal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });

            // Empty cart
            if (cartEmptyBtn) {
                cartEmptyBtn.addEventListener('click', () => {
                    this.showEmptyCartConfirmation();
                });
            }

            // Checkout
            if (cartCheckoutBtn) {
                cartCheckoutBtn.addEventListener('click', () => {
                    this.processCheckout();
                });
            }

        } catch (error) {
            this.handleError('Error initializing cart modal', error);
        }
    }

    // Show empty cart confirmation
    showEmptyCartConfirmation() {
        this.showCustomConfirmation(
            'Empty Cart',
            'Are you sure you want to empty your cart? This action cannot be undone.',
            () => {
                this.resetCart();
                this.showNotification('Cart emptied successfully', 'info');
            }
        );
    }

    // Show custom confirmation dialog with animations
    showCustomConfirmation(title, message, onConfirm) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'confirmation-overlay';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'confirmation-modal';
        
        modal.innerHTML = `
            <div class="confirmation-header">
                <h3>${title}</h3>
            </div>
            <div class="confirmation-body">
                <p>${message}</p>
            </div>
            <div class="confirmation-actions">
                <button class="btn outline-btn confirmation-cancel">Cancel</button>
                <button class="btn primary-btn confirmation-confirm">Confirm</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Add animation
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);
        
        // Handle actions
        const cancelBtn = modal.querySelector('.confirmation-cancel');
        const confirmBtn = modal.querySelector('.confirmation-confirm');
        
        const closeModal = () => {
            overlay.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 300);
        };
        
        cancelBtn.addEventListener('click', closeModal);
        confirmBtn.addEventListener('click', () => {
            closeModal();
            onConfirm();
        });
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });
        
        // Close on ESC key
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        document.addEventListener('keydown', handleKeyPress);
    }

    // Process checkout (placeholder for now)
    processCheckout() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty', 'error');
            return;
        }

        // In a real implementation, this would integrate with a payment processor
        this.showNotification('Checkout functionality would be implemented here', 'info');

        // For demo purposes, clear the cart
        setTimeout(() => {
            this.resetCart();
            this.cartModal.classList.remove('active');
            document.body.style.overflow = '';
            this.showNotification('Thank you for your order!', 'success');
        }, 1000);
    }

    // Render cart items in the modal
    renderCartItems() {
        const cartItemsContainer = document.querySelector('.cart-items-container');
        const cartTotalAmount = document.querySelector('.cart-total-amount');

        if (!cartItemsContainer || !cartTotalAmount) return;

        try {
            // Clear container
            cartItemsContainer.innerHTML = '';

            // Refresh cart from storage
            this.loadCartFromStorage();
            this.normalizeCurrencyInCart();

            if (this.cart.length === 0) {
                this.renderEmptyCart(cartItemsContainer);
                cartTotalAmount.textContent = `${this.currentCurrency}0.00`;
                return;
            }

            // Render each cart item
            this.cart.forEach(item => {
                const cartItem = this.createCartItemElement(item);
                cartItemsContainer.appendChild(cartItem);
            });

            // Update total
            cartTotalAmount.textContent = `${this.currentCurrency}${this.calculateTotal()}`;

        } catch (error) {
            this.handleError('Error rendering cart items', error);
        }
    }

    // Create cart item element
    createCartItemElement(item) {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.setAttribute('data-item-id', item.id);

        const imagePath = item.image.startsWith('/') ? item.image : `/${item.image}`;

        cartItem.innerHTML = `
            <img src="${imagePath}" alt="${item.title}" class="cart-item-image"
                 onerror="this.onerror=null;this.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';">
            <div class="cart-item-details">
                <h3 class="cart-item-title">${item.title}</h3>
                <p class="cart-item-dimensions">${item.dimensions || 'Dimensions not specified'}</p>
                <p class="cart-item-price">${item.price || `${this.currentCurrency}0.00`}</p>
                <p class="cart-item-unique">Unique artwork</p>
            </div>
            <button class="cart-item-remove" aria-label="Remove item">
                <i class="fas fa-trash"></i>
            </button>
        `;

        // Add event listeners
        this.addCartItemEventListeners(cartItem, item);

        return cartItem;
    }

    // Add event listeners to cart item
    addCartItemEventListeners(cartItem, item) {
        const removeButton = cartItem.querySelector('.cart-item-remove');

        removeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Animate removal
            cartItem.style.transition = 'all 0.3s ease';
            cartItem.style.opacity = '0';
            cartItem.style.transform = 'translateX(30px)';

            setTimeout(() => {
                this.removeFromCart(item.id);
            }, 300);
        });
    }

    // Render empty cart message
    renderEmptyCart(container) {
        const emptyCartMessage = document.createElement('div');
        emptyCartMessage.className = 'empty-cart-container';

        emptyCartMessage.innerHTML = `
            <div class="empty-cart-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
            </div>
            <h3 class="empty-cart-title">Your Cart is Empty</h3>
            <p class="empty-cart-subtitle">Add some artwork to make it happy!</p>
            <button class="btn primary-btn continue-shopping-btn">Continue Shopping</button>
        `;

        container.appendChild(emptyCartMessage);

        // Add continue shopping functionality
        const continueBtn = emptyCartMessage.querySelector('.continue-shopping-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.cartModal.classList.remove('active');
                document.body.style.overflow = '';
                window.location.href = '/gallery';
            });
        }
    }

    // Listen for artwork data updates
    listenForArtworkDataUpdates() {
        window.addEventListener('artwork-data-loaded', (e) => {
            if (e.detail?.settings?.currency) {
                const newCurrency = e.detail.settings.currency;
                if (this.currentCurrency !== newCurrency) {
                    this.currentCurrency = newCurrency;
                    window.currentCurrency = newCurrency;
                    this.normalizeCurrencyInCart();
                    this.updateCartCountFromStorage();

                    if (this.cartModal?.classList.contains('active')) {
                        this.renderCartItems();
                    }
                }
            }
        });
    }
}

// Export for module systems and create global instance
const cartManager = new CartManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        cartManager.init();
        cartManager.listenForArtworkDataUpdates();
    });
} else {
    cartManager.init();
    cartManager.listenForArtworkDataUpdates();
}

// Add cleanup and performance reporting methods
cartManager.cleanup = function() {
    console.log('🧹 Cleaning up cart manager...');

    // Clear cache
    this.clearCache();

    // Clean old performance data
    const cutoff = Date.now() - (10 * 60 * 1000); // Keep last 10 minutes
    Object.keys(this.performanceMetrics).forEach(key => {
        this.performanceMetrics[key] = this.performanceMetrics[key].filter(
            entry => entry.timestamp > cutoff
        );
    });

    // Clear render queue
    this.renderQueue = [];
    this.isRendering = false;
};

cartManager.getPerformanceReport = function() {
    const report = {};

    Object.keys(this.performanceMetrics).forEach(operation => {
        const metrics = this.performanceMetrics[operation];
        if (metrics.length > 0) {
            const durations = metrics.map(m => m.duration);
            report[operation] = {
                count: metrics.length,
                average: Math.round((durations.reduce((a, b) => a + b, 0) / metrics.length) * 100) / 100,
                min: Math.min(...durations),
                max: Math.max(...durations),
                total: Math.round(durations.reduce((a, b) => a + b, 0) * 100) / 100
            };
        }
    });

    return {
        operations: report,
        cacheSize: this.cache.size,
        cartSize: this.cart.length,
        state: { ...this.state }
    };
};

// Make cart manager globally accessible
window.cartManager = cartManager;