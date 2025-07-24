// Main JavaScript File

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initMobileMenu();

    // Only initialize the hero slider if it's not being dynamically loaded
    const heroSlider = document.querySelector('.hero-slider');
    if (heroSlider && !heroSlider.hasAttribute('data-dynamic')) {
        initHeroSlider();
    }

    initFaqToggle();
    shopifyCartIntegration();
    initLightbox();
    initSearchFunctionality();

    // Initialize cart count from localStorage on page load
    updateCartCountFromStorage();
});

// Function to ensure all items in cart use the current currency
function normalizeCurrencyInCart() {
    // Get the cart from localStorage
    let cart = [];
    try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    } catch (e) {
        console.error('Error reading cart in normalizeCurrencyInCart:', e);
        return;
    }

    if (!cart || !Array.isArray(cart) || cart.length === 0) return;

    // Get current currency
    let currentCurrency = '₪';
    if (window.currentCurrency) {
        currentCurrency = window.currentCurrency;
    }

    let hasChanges = false;
    cart.forEach(item => {
        if (item.price) {
            const match = item.price.match(/^[^\d\s]+/);
            if (match && match[0] !== currentCurrency) {
                // Get the numeric part and format with current currency
                const numericPrice = parseFloat(item.price.replace(/[^\d.]/g, ''));
                item.price = `${currentCurrency}${numericPrice.toFixed(2)}`;
                hasChanges = true;
            } else if (!match) {
                // No currency symbol, add it
                item.price = `${currentCurrency}${item.price}`;
                hasChanges = true;
            }
        }
    });

    if (hasChanges) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }
}

// Mobile Menu Toggle
function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (navLinks && navLinks.classList.contains('active') &&
            !navLinks.contains(e.target) &&
            !mobileMenuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });
}

// Hero Slider
function initHeroSlider() {
    const heroSlider = document.querySelector('.hero-slider');

    // If the slider is already initialized by artwork-loader.js, skip initialization
    if (heroSlider && heroSlider.hasAttribute('data-initialized')) {
        return;
    }

    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (slides.length <= 1) return; // No need for slider with one or zero slides

    let currentIndex = 0;
    let slideInterval;
    const intervalDuration = 5000; // 5 seconds between auto-slides

    function showSlide(index) {
        // Hide all slides
        slides.forEach(slide => {
            slide.classList.remove('active');
        });

        // Show the current slide
        slides[index].classList.add('active');
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        showSlide(currentIndex);
    }

    // Reset the auto-slide timer
    function resetSlideTimer() {
        // Clear existing timer
        clearInterval(slideInterval);
        // Start a new timer
        slideInterval = setInterval(nextSlide, intervalDuration);
    }

    // Initialize the timer
    resetSlideTimer();

    // Add event listeners to buttons with timer reset
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            nextSlide();
            resetSlideTimer(); // Reset timer after manual navigation
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            prevSlide();
            resetSlideTimer(); // Reset timer after manual navigation
        });
    }

    // Pause auto slide on hover
    if (heroSlider) {
        heroSlider.addEventListener('mouseenter', function() {
            clearInterval(slideInterval);
        });

        heroSlider.addEventListener('mouseleave', function() {
            resetSlideTimer(); // Use the same reset function for consistency
        });

        // Mark as initialized
        heroSlider.setAttribute('data-initialized', 'true');
    }
}

// FAQ Toggle
function initFaqToggle() {
    const faqQuestions = document.querySelectorAll('.faq-question');

    if (faqQuestions.length === 0) return;

    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            // Toggle active class on the parent
            const faqItem = this.parentElement;
            faqItem.classList.toggle('active');

            // Close other FAQ items
            const allItems = document.querySelectorAll('.faq-item');
            allItems.forEach(item => {
                if (item !== faqItem && item.classList.contains('active')) {
                    item.classList.remove('active');
                }
            });
        });
    });
}

// Image Lightbox Functionality
function initLightbox() {
    // Create lightbox elements if they don't exist
    if (!document.querySelector('.lightbox-overlay')) {
        const lightboxOverlay = document.createElement('div');
        lightboxOverlay.className = 'lightbox-overlay';

        const lightboxImage = document.createElement('img');
        lightboxImage.className = 'lightbox-image';
        lightboxOverlay.appendChild(lightboxImage);

        const lightboxClose = document.createElement('div');
        lightboxClose.className = 'lightbox-close';
        lightboxClose.innerHTML = '<i class="fas fa-times"></i>';
        lightboxOverlay.appendChild(lightboxClose);

        document.body.appendChild(lightboxOverlay);

        // Close lightbox when clicking the close button or the overlay
        lightboxClose.addEventListener('click', closeLightbox);
        lightboxOverlay.addEventListener('click', function(e) {
            if (e.target === lightboxOverlay) {
                closeLightbox();
            }
        });

        // Close lightbox when pressing Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && lightboxOverlay.classList.contains('active')) {
                closeLightbox();
            }
        });
    }

    // Get all artwork images
    const artworkImages = document.querySelectorAll('.artwork-image img');

    // Add click event to each image
    artworkImages.forEach(img => {
        img.addEventListener('click', function() {
            openLightbox(this.src, this.alt);
        });

        // Add a cursor pointer style to indicate the image is clickable
        img.style.cursor = 'pointer';
    });
}

// Open the lightbox with a specific image
function openLightbox(src, alt) {
    const lightboxOverlay = document.querySelector('.lightbox-overlay');
    const lightboxImage = document.querySelector('.lightbox-image');

    if (lightboxOverlay && lightboxImage) {
        // Set the image source and alt text
        lightboxImage.src = src;
        lightboxImage.alt = alt || 'Artwork Image';

        // Show the lightbox
        lightboxOverlay.classList.add('active');

        // Prevent scrolling on the body
        document.body.style.overflow = 'hidden';
    }
}

// Close the lightbox
function closeLightbox() {
    const lightboxOverlay = document.querySelector('.lightbox-overlay');

    if (lightboxOverlay) {
        // Hide the lightbox
        lightboxOverlay.classList.remove('active');

        // Re-enable scrolling on the body
        document.body.style.overflow = '';
    }
}

// Handle scroll events
window.addEventListener('scroll', function() {
    // Add 'scrolled' class to header when scrolling
    const header = document.querySelector('header');
    if (header) {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
});

// Basic Shopify Cart Integration
function shopifyCartIntegration() {
    // Store the current currency (from settings loaded by artwork-loader.js)
    let currentCurrency = '₪';

    // Make currency accessible globally
    window.currentCurrency = currentCurrency;

    // Try to get the currency from different sources in order of preference
    if (window.artworkData && window.artworkData.settings && window.artworkData.settings.currency) {
        // 1. From window.artworkData if available
        currentCurrency = window.artworkData.settings.currency;
        window.currentCurrency = currentCurrency;
    } else {
        // 2. From localStorage as fallback
        try {
            const savedData = localStorage.getItem('evgenia-artwork-data');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                if (parsedData && parsedData.settings && parsedData.settings.currency) {
                    currentCurrency = parsedData.settings.currency;
                    window.currentCurrency = currentCurrency;
                }
            }

            // Also check if there's a currency embedded in any cart item
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                const cart = JSON.parse(savedCart);
                if (cart.length > 0 && cart[0].price) {
                    const match = cart[0].price.match(/^[^\d\s]+/);
                    if (match && match[0]) {
                        currentCurrency = match[0];
                        window.currentCurrency = currentCurrency;
                    }
                }
            }
        } catch (e) {
            console.error('Error getting currency from localStorage:', e);
        }
    }

    console.log('Using currency:', currentCurrency);

    // Initialize cart from localStorage if it exists
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Ensure all prices use the current currency
    normalizeCurrencyInCart();

    const cartCount = document.querySelector('.cart-count');

    // Update the cart count in the header
    function updateCartCount() {
        if (cartCount) {
            const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
            cartCount.textContent = totalItems;

            // Show cart count if there are items
            if (totalItems > 0) {
                cartCount.style.display = 'flex';
            } else {
                cartCount.style.display = 'none';
            }
        }
    }

    // Add item to cart
    window.addToCart = function(item) {
        console.log('Adding item to cart:', item);

        // Ensure the cart is up-to-date from localStorage
        const freshCartData = localStorage.getItem('cart');
        if (freshCartData) {
            try {
                cart = JSON.parse(freshCartData);
            } catch (e) {
                console.error('Error parsing cart data from localStorage', e);
                cart = [];
            }
        }

        console.log('Cart before add:', JSON.parse(JSON.stringify(cart)));

        // Make sure the item has the correct currency
        if (item.price && item.price.match(/^[^\d\s]+/)) {
            // Get the numeric part
            const numericPrice = parseFloat(item.price.replace(/[^\d.]/g, ''));
            // Use current currency with consistent decimal formatting
            item.price = `${currentCurrency}${numericPrice.toFixed(2)}`;
        } else if (item.price) {
            // Add currency if none exists
            const numericPrice = parseFloat(item.price.replace(/[^\d.]/g, ''));
            item.price = `${currentCurrency}${numericPrice.toFixed(2)}`;
        }

        // Ensure image path is absolute
        if (item.image) {
            item.image = item.image.startsWith('/') ? item.image : `/${item.image}`;
        }

        // Check if item already exists in cart
        const existingItem = cart.find(cartItem => cartItem.id === item.id);

        if (existingItem) {
            // Increase quantity if item exists
            existingItem.quantity += 1;
            // Update price to ensure currency consistency
            existingItem.price = item.price;
            // Update image path to ensure it's absolute
            existingItem.image = item.image;
            console.log('Item exists, updated quantity to:', existingItem.quantity);
        } else {
            // Add new item with quantity 1
            cart.push({
                ...item,
                quantity: 1
            });
            console.log('Added new item to cart');
        }

        // Save cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));

        // Ensure all prices use the current currency
        normalizeCurrencyInCart();

        // Update cart count
        updateCartCount();

        // If the cart modal is open, update the cart display
        const cartModal = document.querySelector('.cart-modal-overlay');
        if (cartModal && cartModal.classList.contains('active')) {
            // Re-render the cart items
            renderCartItems();
        }

        console.log('Cart after add:', JSON.parse(JSON.stringify(cart)));

        return true;
    };

    // Remove item from cart
    function removeFromCart(itemId) {
        console.log('Removing item with ID:', itemId);
        console.log('Cart before removal:', JSON.parse(JSON.stringify(cart)));

        // Filter out the item with the matching ID
        cart = cart.filter(item => item.id !== itemId);

        // Save the updated cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cart));

        // Update the cart count display
        updateCartCount();

        console.log('Cart after removal:', JSON.parse(JSON.stringify(cart)));

        // Force re-render the cart to ensure everything is updated
        renderCartItems();
    }

    // Update item quantity
    function updateQuantity(itemId, quantity) {
        const itemIndex = cart.findIndex(item => item.id === itemId);

        if (itemIndex !== -1) {
            if (quantity <= 0) {
                // Remove item if quantity is 0 or less
                cart.splice(itemIndex, 1);
            } else {
                // Update quantity
                cart[itemIndex].quantity = quantity;
            }

            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();

            // Force re-render the cart to ensure everything is updated
            renderCartItems();
        }
    }

    // Calculate cart total
    function calculateTotal() {
        return cart.reduce((total, item) => {
            // Extract the numeric part of the price (handle different currency symbols)
            const numericPrice = parseFloat(item.price.replace(/[^\d.]/g, ''));
            return total + (numericPrice * item.quantity);
        }, 0).toFixed(2);
    }

    // Add to cart functionality for product buttons
    const addToCartButtons = document.querySelectorAll('.artwork-item .primary-btn');

    if (addToCartButtons.length > 0) {
        addToCartButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();

                // Get artwork details
                const artworkItem = this.closest('.artwork-item');
                const title = artworkItem.querySelector('h3').textContent;
                let price = artworkItem.querySelector('.artwork-price').textContent;
                let image = artworkItem.querySelector('.artwork-image img').src;
                const dimensions = artworkItem.querySelector('.artwork-dimensions').textContent;

                // Convert relative URLs to paths that work universally
                // Remove domain and protocol if present (converts full URLs to paths)
                if (image.includes('://')) {
                    image = new URL(image).pathname;
                }
                // Remove any base path from the URL itself that isn't part of the image path
                // For example, if we're on /artwork/something, we need to keep just the image path
                const currentPath = window.location.pathname;
                if (currentPath.startsWith('/artwork/') && !image.startsWith('/public')) {
                    // Extract only the image path part
                    const pathParts = image.split('/');
                    const publicIndex = pathParts.findIndex(part => part === 'public');
                    if (publicIndex !== -1) {
                        image = '/' + pathParts.slice(publicIndex).join('/');
                    }
                }

                // Create a consistent ID based only on the title (without random numbers)
                const id = title.toLowerCase().replace(/\s+/g, '-');

                // Ensure price has correct currency symbol
                if (price.match(/^[^\d\s]+/)) {
                    // Replace existing currency with the current one
                    price = currentCurrency + price.replace(/^[^\d\s]+/, '');
                } else {
                    // Add currency if none exists
                    price = currentCurrency + price;
                }

                // Add item to cart
                addToCart({
                    id,
                    title,
                    price,
                    image,
                    dimensions
                });

                // Show visual feedback on the button
                const originalButtonText = this.textContent;
                this.textContent = "Added!";
                this.classList.add('added-to-cart');

                // Revert button text after 1.5 seconds
                setTimeout(() => {
                    this.textContent = originalButtonText;
                    this.classList.remove('added-to-cart');
                }, 1500);

                // Show success message
                const message = document.createElement('div');
                message.classList.add('cart-message');
                message.textContent = `${title} added to cart`;
                document.body.appendChild(message);

                // Remove message after 2 seconds
                setTimeout(() => {
                    message.classList.add('fade-out');
                    setTimeout(() => {
                        document.body.removeChild(message);
                    }, 300);
                }, 2000);
            });
        });
    }

    // Initialize cart modal functionality regardless of whether there are "Add to Cart" buttons
    initCartModal(cart, updateQuantity, removeFromCart, calculateTotal, currentCurrency);

    // Initial update of cart count
    updateCartCount();
}

// Cart Modal Functionality
function initCartModal(cart, updateQuantity, removeFromCart, calculateTotal, currentCurrency = '₪') {
    const cartIcon = document.querySelector('.cart-icon');
    const cartModal = document.querySelector('.cart-modal-overlay');
    const cartClose = document.querySelector('.cart-close');
    const cartItemsContainer = document.querySelector('.cart-items-container');
    const cartTotalAmount = document.querySelector('.cart-total-amount');
    const cartEmptyBtn = document.querySelector('.cart-empty');
    const cartCheckoutBtn = document.querySelector('.cart-checkout');

    if (!cartModal) {
        console.error('Cart modal not found in the DOM');
        return;
    }

    if (!cartIcon) {
        console.error('Cart icon not found in the DOM');
        return;
    }

    console.log('Initializing cart modal', {
        cartExists: !!cartModal,
        cartIconExists: !!cartIcon,
        currency: currentCurrency
    });

    // Open cart modal
    cartIcon.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Cart icon clicked');

        // Always re-render cart items when opening the modal to ensure latest data
        renderCartItems();

        // Show modal
        cartModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    });

    // Close cart modal
    cartClose.addEventListener('click', function() {
        cartModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    });

    // Prevent unwanted click bubbling inside cart modal
    cartModal.addEventListener('click', function(e) {
        // Only close if clicking outside the modal content
        if (e.target === cartModal) {
            cartModal.classList.remove('active');
            document.body.style.overflow = '';
        }
        // Prevent clicks inside the modal from bubbling up
        else if (e.target.closest('.cart-modal')) {
            e.stopPropagation();
        }
    });

    // Empty cart
    cartEmptyBtn.addEventListener('click', function() {
        // Instead of default browser confirm, create custom modal
        const confirmModal = document.createElement('div');
        confirmModal.className = 'custom-confirm-modal';

        confirmModal.innerHTML = `
            <div class="confirm-modal-content">
                <div class="confirm-modal-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h3 class="confirm-modal-title">Empty Your Cart?</h3>
                <p class="confirm-modal-text">This will remove all items from your cart. This action cannot be undone.</p>
                <div class="confirm-modal-buttons">
                    <button class="btn secondary-btn cancel-btn">Cancel</button>
                    <button class="btn danger-btn confirm-btn">Empty Cart</button>
                </div>
            </div>
        `;

        // Add styles for the modal
        const style = document.createElement('style');
        style.textContent = `
            .custom-confirm-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .confirm-modal-content {
                background-color: white;
                border-radius: 8px;
                padding: 2rem;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                text-align: center;
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }

            .confirm-modal-icon {
                color: #e74c3c;
                margin-bottom: 1rem;
                animation: pulse 2s infinite;
            }

            .confirm-modal-title {
                font-size: 1.5rem;
                margin-bottom: 0.5rem;
                color: #333;
            }

            .confirm-modal-text {
                margin-bottom: 1.5rem;
                color: #666;
                line-height: 1.5;
            }

            .confirm-modal-buttons {
                display: flex;
                justify-content: center;
                gap: 1rem;
            }

            .cancel-btn {
                background-color: #f8f9fa;
                color: #333;
                border: 1px solid #ddd;
                transition: all 0.2s ease;
            }

            .cancel-btn:hover {
                background-color: #e9ecef;
            }

            .danger-btn {
                background-color: #e74c3c;
                color: white;
                border: none;
                transition: all 0.2s ease;
            }

            .danger-btn:hover {
                background-color: #c0392b;
                transform: scale(1.05);
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            .custom-confirm-modal.active {
                opacity: 1;
            }

            .custom-confirm-modal.active .confirm-modal-content {
                transform: scale(1);
            }
        `;
        document.head.appendChild(style);

        // Add the modal to the DOM
        document.body.appendChild(confirmModal);

        // Trigger animation after a tiny delay (for DOM to update)
        setTimeout(() => {
            confirmModal.classList.add('active');
        }, 10);

        // Handle cancel button click
        const cancelBtn = confirmModal.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', function() {
            // Animate out
            confirmModal.style.opacity = '0';
            confirmModal.querySelector('.confirm-modal-content').style.transform = 'scale(0.9)';

            // Remove from DOM after animation
            setTimeout(() => {
                if (confirmModal.parentNode) {
                    confirmModal.parentNode.removeChild(confirmModal);
                }
            }, 300);
        });

        // Handle confirm button click
        const confirmBtn = confirmModal.querySelector('.confirm-btn');
        confirmBtn.addEventListener('click', function() {
            // Clear cart array
            cart.length = 0;

            // Save to localStorage
            localStorage.setItem('cart', JSON.stringify(cart));

            // Create modern empty cart message
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

            // Clear and add the empty cart message
            cartItemsContainer.innerHTML = '';
            cartItemsContainer.appendChild(emptyCartMessage);
            cartTotalAmount.textContent = `${currentCurrency}0.00`;

            // Add animation for the empty cart
            emptyCartMessage.style.animation = 'fadeIn 0.5s ease-out';

            // Add functionality to the continue shopping button
            const continueShoppingBtn = emptyCartMessage.querySelector('.continue-shopping-btn');
            if (continueShoppingBtn) {
                continueShoppingBtn.addEventListener('click', function() {
                    // Close the cart modal and redirect to gallery
                    cartModal.classList.remove('active');
                    document.body.style.overflow = '';
                    window.location.href = '/gallery';
                });
            }

            // Update cart count in header
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                cartCount.textContent = '0';
                cartCount.style.display = 'none';
            }

            // Close the modal with success animation
            confirmModal.querySelector('.confirm-modal-icon').innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            `;
            confirmModal.querySelector('.confirm-modal-title').textContent = 'Cart Emptied';
            confirmModal.querySelector('.confirm-modal-text').textContent = 'Your cart has been emptied successfully.';
            confirmModal.querySelector('.confirm-modal-buttons').style.display = 'none';

            // Auto-close after animation
            setTimeout(() => {
                confirmModal.style.opacity = '0';
                confirmModal.querySelector('.confirm-modal-content').style.transform = 'scale(0.9)';

                setTimeout(() => {
                    if (confirmModal.parentNode) {
                        confirmModal.parentNode.removeChild(confirmModal);
                    }
                }, 300);
            }, 1500);
        });

        // Close on click outside
        confirmModal.addEventListener('click', function(e) {
            if (e.target === confirmModal) {
                cancelBtn.click();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && confirmModal.parentNode) {
                cancelBtn.click();
            }
        });
    });

    // Checkout
    cartCheckoutBtn.addEventListener('click', function() {
        // In a real implementation, this would redirect to a checkout page
        // or process the checkout with Shopify
        alert('Proceeding to checkout...');

        // For demonstration, we'll just clear the cart
        cart.length = 0;
        localStorage.setItem('cart', JSON.stringify(cart));

        // Create modern empty cart message with success message
        const emptyCartMessage = document.createElement('div');
        emptyCartMessage.className = 'empty-cart-container';

        emptyCartMessage.innerHTML = `
            <div class="empty-cart-icon success">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <h3 class="empty-cart-title">Order Placed!</h3>
            <p class="empty-cart-subtitle">Thank you for your purchase.</p>
            <button class="btn primary-btn continue-shopping-btn">Continue Shopping</button>
        `;

        // Clear and add the empty cart message
        cartItemsContainer.innerHTML = '';
        cartItemsContainer.appendChild(emptyCartMessage);
        cartTotalAmount.textContent = `${currentCurrency}0.00`;

        // Add success styling
        const style = document.createElement('style');
        style.textContent = `
            .empty-cart-icon.success {
                color: #4CAF50;
                animation: success-pulse 2s infinite;
            }

            @keyframes success-pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);

        // Add functionality to the continue shopping button
        const continueShoppingBtn = emptyCartMessage.querySelector('.continue-shopping-btn');
        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', function() {
                // Close the cart modal and redirect to gallery
                cartModal.classList.remove('active');
                document.body.style.overflow = '';
                window.location.href = '/gallery';
            });
        }

        // Update cart count in header
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = '0';
            cartCount.style.display = 'none';
        }

        // We'll close the modal after a short delay to let the user see the success message
        setTimeout(() => {
            cartModal.classList.remove('active');
            document.body.style.overflow = '';
        }, 3000);
    });

    // Render cart items
    window.renderCartItems = function() {
        if (!cartItemsContainer) return;

        // Clear container completely
        cartItemsContainer.innerHTML = '';

        // Refresh the cart from localStorage to ensure we have the latest data
        const freshCartData = localStorage.getItem('cart');
        if (freshCartData) {
            try {
                cart = JSON.parse(freshCartData);
            } catch (e) {
                console.error('Error parsing cart data from localStorage', e);
            }
        }

        // Ensure all prices use the current currency
        normalizeCurrencyInCart();

        // Log current cart for debugging
        console.log('Current cart:', JSON.parse(JSON.stringify(cart)));

        if (!cart || cart.length === 0) {
            // Create a modern empty cart message with visual elements
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

            cartItemsContainer.appendChild(emptyCartMessage);
            cartTotalAmount.textContent = `${currentCurrency}0.00`;

            // Add some animation and functionality to the empty cart
            const continueShoppingBtn = emptyCartMessage.querySelector('.continue-shopping-btn');
            if (continueShoppingBtn) {
                continueShoppingBtn.addEventListener('click', function() {
                    // Close the cart modal and redirect to gallery
                    cartModal.classList.remove('active');
                    document.body.style.overflow = '';
                    window.location.href = '/gallery';
                });
            }

            // Empty cart styles are now in additional-styles.css

            return;
        }

        // Add each item to the container
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.setAttribute('data-item-id', item.id);

            // Ensure the price is properly formatted
            if (!item.price.startsWith(currentCurrency)) {
                // Force the correct currency if somehow it's still wrong
                const numericPrice = parseFloat(item.price.replace(/[^\d.]/g, ''));
                item.price = `${currentCurrency}${numericPrice.toFixed(2)}`;
            }

            // Ensure image path is absolute (starts with /)
            const imagePath = item.image.startsWith('/') ? item.image : `/${item.image}`;

            cartItem.innerHTML = `
                <img src="${imagePath}" alt="${item.title}" class="cart-item-image">
                <div class="cart-item-details">
                    <h3 class="cart-item-title">${item.title}</h3>
                    <p class="cart-item-dimensions">${item.dimensions}</p>
                    <p class="cart-item-price">${item.price}</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-minus">-</button>
                    <input type="number" value="${item.quantity}" min="0" max="99">
                    <button class="quantity-plus">+</button>
                </div>
                <button class="cart-item-remove"><i class="fas fa-trash"></i></button>
            `;

            // Add event listeners for quantity buttons
            const quantityMinus = cartItem.querySelector('.quantity-minus');
            const quantityPlus = cartItem.querySelector('.quantity-plus');
            const quantityInput = cartItem.querySelector('input');
            const removeButton = cartItem.querySelector('.cart-item-remove');

            quantityMinus.addEventListener('click', function() {
                const newQuantity = parseInt(quantityInput.value) - 1;
                if (newQuantity >= 0) {
                    quantityInput.value = newQuantity;
                    updateQuantity(item.id, newQuantity);
                }
            });

            quantityPlus.addEventListener('click', function() {
                const newQuantity = parseInt(quantityInput.value) + 1;
                if (newQuantity <= 99) {
                    quantityInput.value = newQuantity;
                    updateQuantity(item.id, newQuantity);
                }
            });

            quantityInput.addEventListener('change', function() {
                const newQuantity = parseInt(this.value);
                if (newQuantity >= 0 && newQuantity <= 99) {
                    updateQuantity(item.id, newQuantity);
                } else if (newQuantity > 99) {
                    // Reset to valid value if over maximum
                    this.value = 99;
                    updateQuantity(item.id, 99);
                } else {
                    // Reset to 0 for negative values
                    this.value = 0;
                    updateQuantity(item.id, 0);
                }
            });

            // Handle clicks on the remove button
            removeButton.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent any default action
                e.stopPropagation(); // Stop event from propagating to parent elements

                // Get the cart item element
                const cartItemElement = this.closest('.cart-item');
                const itemId = item.id;

                // Add visual feedback - animate it out
                cartItemElement.style.transition = 'all 0.3s ease';
                cartItemElement.style.opacity = '0';
                cartItemElement.style.transform = 'translateX(30px)';

                // Remove the cart item from the DOM after animation
                setTimeout(() => {
                    if (cartItemElement.parentNode) {
                        cartItemElement.parentNode.removeChild(cartItemElement);
                    }

                    // Remove from data model
                    removeFromCart(itemId);

                    // If cart is now empty after removal, show the modern empty cart message
                    if (cart.length === 0) {
                        // Create the same modern empty cart UI as in renderCartItems
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

                        // Clear and add the empty cart message
                        cartItemsContainer.innerHTML = '';
                        cartItemsContainer.appendChild(emptyCartMessage);
                        cartTotalAmount.textContent = `${currentCurrency}0.00`;

                        // Add functionality to the continue shopping button
                        const continueShoppingBtn = emptyCartMessage.querySelector('.continue-shopping-btn');
                        if (continueShoppingBtn) {
                            continueShoppingBtn.addEventListener('click', function() {
                                // Close the cart modal and redirect to gallery
                                cartModal.classList.remove('active');
                                document.body.style.overflow = '';
                                window.location.href = '/gallery';
                            });
                        }
                    }
                }, 300);
            });

            cartItemsContainer.appendChild(cartItem);
        });

        // Update total amount with the correct currency
        cartTotalAmount.textContent = `${currentCurrency}${calculateTotal()}`;
    }

    // Initialize the cart data in localStorage if not already set
    if (!localStorage.getItem('cart')) {
        localStorage.setItem('cart', JSON.stringify([]));
    }
}

// Newsletter subscription
document.addEventListener('DOMContentLoaded', function() {
    const newsletterForm = document.querySelector('.newsletter-form');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const emailInput = this.querySelector('input[type="email"]');
            const submitButton = this.querySelector('button[type="submit"]');
            const email = emailInput.value;

            if (email) {
                // Disable button and show loading state
                submitButton.disabled = true;
                const originalButtonText = submitButton.textContent;
                submitButton.textContent = 'Subscribing...';

                // Make API call to server
                fetch('/newsletter/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email })
                })
                .then(response => response.json())
                .then(data => {
                    const formContainer = this.parentElement;
                    const message = document.createElement('p');
                    message.classList.add(data.success ? 'success-message' : 'error-message');
                    message.textContent = data.message;

                    if (data.success) {
                        // Replace form with success message
                        this.style.display = 'none';
                        formContainer.appendChild(message);
                    } else {
                        // Show error message above form
                        formContainer.insertBefore(message, this);
                        
                        // Re-enable button
                        submitButton.disabled = false;
                        submitButton.textContent = originalButtonText;
                    }
                })
                .catch(error => {
                    console.error('Newsletter subscription error:', error);
                    
                    // Show error message
                    const formContainer = this.parentElement;
                    const errorMessage = document.createElement('p');
                    errorMessage.classList.add('error-message');
                    errorMessage.textContent = 'Sorry, there was an error. Please try again later.';
                    formContainer.insertBefore(errorMessage, this);

                    // Re-enable button
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                });
            }
        });
    }
});

// Contact Form Submission
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('.contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = this.querySelector('#name').value;
            const email = this.querySelector('#email').value;
            const subject = this.querySelector('#subject').value;
            const message = this.querySelector('#message').value;
            const submitButton = this.querySelector('button[type="submit"]');

            // Disable button and show loading state
            submitButton.disabled = true;
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Sending...';

            // Make API call to server
            fetch('/contact/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, subject, message })
            })
            .then(response => response.json())
            .then(data => {
                const formContainer = this.parentElement;
                const messageDiv = document.createElement('div');
                messageDiv.classList.add(data.success ? 'success-message' : 'error-message');
                
                if (data.success) {
                    messageDiv.innerHTML = `
                        <h3>Message Sent Successfully!</h3>
                        <p>${data.message}</p>
                    `;
                    // Replace form with success message
                    this.style.display = 'none';
                    formContainer.appendChild(messageDiv);
                } else {
                    messageDiv.innerHTML = `
                        <h3>Error</h3>
                        <p>${data.message}</p>
                    `;
                    // Show error message above form
                    formContainer.insertBefore(messageDiv, this);
                    
                    // Re-enable button
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            })
            .catch(error => {
                console.error('Contact form error:', error);
                
                // Show error message
                const formContainer = this.parentElement;
                const errorMessage = document.createElement('div');
                errorMessage.classList.add('error-message');
                errorMessage.innerHTML = `
                    <h3>Error</h3>
                    <p>Sorry, there was an error sending your message. Please try again later.</p>
                `;
                formContainer.insertBefore(errorMessage, this);

                // Re-enable button
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            });
        });
    }
});

// Update cart count from localStorage
function updateCartCountFromStorage() {
    const cartCount = document.querySelector('.cart-count');
    const savedCart = localStorage.getItem('cart');

    if (cartCount && savedCart) {
        try {
            const cart = JSON.parse(savedCart);
            if (Array.isArray(cart)) {
                const totalItems = cart.reduce((total, item) => total + (item.quantity || 0), 0);

                cartCount.textContent = totalItems;

                // Show cart count if there are items
                if (totalItems > 0) {
                    cartCount.style.display = 'flex';
                } else {
                    cartCount.style.display = 'none';
                }
            } else {
                // Reset cart if invalid
                localStorage.setItem('cart', JSON.stringify([]));
                cartCount.style.display = 'none';
            }
        } catch (e) {
            console.error('Error parsing cart data:', e);
            // Reset cart if corrupted
            localStorage.setItem('cart', JSON.stringify([]));
            cartCount.style.display = 'none';
        }
    } else if (cartCount) {
        cartCount.style.display = 'none';
    }
}

// When artwork data is loaded, store the currency setting for use in the cart
document.addEventListener('DOMContentLoaded', function() {
    // Listen for the artwork data being loaded
    window.addEventListener('artwork-data-loaded', function(e) {
        if (e.detail && e.detail.settings && e.detail.settings.currency) {
            // Store the artwork data
            window.artworkData = e.detail;

            // If the currency has changed, update all cart items
            const newCurrency = e.detail.settings.currency;
            if (window.currentCurrency !== newCurrency) {
                window.currentCurrency = newCurrency;

                // Update any cart item prices with the new currency
                const savedCart = localStorage.getItem('cart');
                if (savedCart) {
                    try {
                        const cart = JSON.parse(savedCart);
                        let hasChanges = false;

                        if (Array.isArray(cart) && cart.length > 0) {
                            cart.forEach(item => {
                                if (item.price) {
                                    const numericPrice = parseFloat(item.price.replace(/[^\d.]/g, ''));
                                    item.price = `${newCurrency}${numericPrice.toFixed(2)}`;
                                    hasChanges = true;
                                }
                            });

                            if (hasChanges) {
                                localStorage.setItem('cart', JSON.stringify(cart));
                                console.log('Updated cart items with new currency:', newCurrency);

                                // If there's a cart count, update that too
                                updateCartCountFromStorage();

                                // If there's an open cart modal, refresh it
                                const cartModal = document.querySelector('.cart-modal-overlay');
                                if (cartModal && cartModal.classList.contains('active') && window.renderCartItems) {
                                    window.renderCartItems();
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Error updating cart currency:', e);
                    }
                }
            }
        }
    });
});

// Utility function for debouncing
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

// Search Functionality
function initSearchFunctionality() {
    // Create search modal if it doesn't exist
    if (!document.querySelector('.search-modal-overlay')) {
        createSearchModal();
    }

    // Add click listener to search icon
    const searchIcon = document.querySelector('.search-icon');
    if (searchIcon) {
        searchIcon.addEventListener('click', function(e) {
            e.preventDefault();
            openSearchModal();
        });
    }
}

// Create the search modal
function createSearchModal() {
    const searchModal = document.createElement('div');
    searchModal.className = 'search-modal-overlay';

    searchModal.innerHTML = `
        <div class="search-modal">
            <div class="search-header">
                <h2>Search Artwork</h2>
                <button class="search-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="search-form-container">
                <form class="search-form">
                    <div class="search-input-group">
                        <input type="text" class="search-input" placeholder="Search by title, medium, or description..." autocomplete="off">
                        <button type="submit" class="search-btn">
                            <i class="fas fa-search"></i>
                        </button>
                        <button type="button" class="search-clear" style="display: none;">
                            <i class="fas fa-times-circle"></i>
                        </button>
                    </div>
                </form>
            </div>
            <div class="search-results-container">
                <!-- Search results will appear here -->
            </div>
            <div class="search-no-results" style="display: none;">
                <div class="no-results-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                </div>
                <h3>No Artwork Found</h3>
                <p>Try different keywords or browse the gallery</p>
                <a href="/gallery" class="btn primary-btn">Browse Gallery</a>
            </div>
        </div>
    `;

    // Search modal styles are now in search-modal.css

    // Add to DOM
    document.body.appendChild(searchModal);

    // Add event listeners
    const closeBtn = searchModal.querySelector('.search-close');
    closeBtn.addEventListener('click', closeSearchModal);

    // Close on click outside the modal
    searchModal.addEventListener('click', function(e) {
        if (e.target === searchModal) {
            closeSearchModal();
        }
    });

    // Close on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && searchModal.classList.contains('active')) {
            closeSearchModal();
        }
    });

    // Add form submit handler
    const searchForm = searchModal.querySelector('.search-form');
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        performSearch();
    });

    // Input handler for real-time search with debouncing
    const searchInput = searchModal.querySelector('.search-input');
    const clearBtn = searchModal.querySelector('.search-clear');
    
    // Create debounced search function
    const debouncedSearch = debounce(performSearch, 300);

    searchInput.addEventListener('input', function() {
        if (this.value.length > 0) {
            clearBtn.style.display = 'block';
            debouncedSearch();
        } else {
            clearBtn.style.display = 'none';
            clearSearchResults();
        }
    });

    // Clear button handler
    clearBtn.addEventListener('click', function() {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        clearSearchResults();
        searchInput.focus();
    });
}

// Open search modal
function openSearchModal() {
    const searchModal = document.querySelector('.search-modal-overlay');
    if (searchModal) {
        searchModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus the search input after a small delay (for animation)
        setTimeout(() => {
            const searchInput = searchModal.querySelector('.search-input');
            if (searchInput) searchInput.focus();
        }, 300);
    }
}

// Close search modal
function closeSearchModal() {
    const searchModal = document.querySelector('.search-modal-overlay');
    if (searchModal) {
        searchModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Clear search results
function clearSearchResults() {
    const resultsContainer = document.querySelector('.search-results-container');
    const noResultsMessage = document.querySelector('.search-no-results');

    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }

    if (noResultsMessage) {
        noResultsMessage.style.display = 'none';
    }
}

// Perform the search
function performSearch() {
    // Get the search query
    const searchInput = document.querySelector('.search-input');
    const query = searchInput.value.trim().toLowerCase();

    if (query.length === 0) {
        clearSearchResults();
        return;
    }

    // Try to get the artwork data
    let artworkData;

    // Check if window.artworkData is available
    if (window.artworkData && window.artworkData.artworks) {
        artworkData = window.artworkData;
    } else {
        // Try to get from localStorage as fallback
        try {
            const savedData = localStorage.getItem('evgenia-artwork-data');
            if (savedData) {
                artworkData = JSON.parse(savedData);
            }
        } catch (e) {
            console.error('Error retrieving artwork data for search:', e);
        }
    }

    if (!artworkData || !artworkData.artworks || !Array.isArray(artworkData.artworks)) {
        console.error('No artwork data available for search');
        return;
    }

    // Filter the artwork based on the search query
    const results = artworkData.artworks.filter(artwork => {
        return (
            (artwork.title && artwork.title.toLowerCase().includes(query)) ||
            (artwork.medium && artwork.medium.toLowerCase().includes(query)) ||
            (artwork.description && artwork.description.toLowerCase().includes(query))
        );
    });

    // Display the results
    displaySearchResults(results, query, artworkData.settings);
}

// Display search results
function displaySearchResults(results, query, settings) {
    const resultsContainer = document.querySelector('.search-results-container');
    const noResultsMessage = document.querySelector('.search-no-results');

    if (!resultsContainer || !noResultsMessage) return;

    // Clear previous results
    resultsContainer.innerHTML = '';

    if (results.length === 0) {
        // Show no results message
        resultsContainer.style.display = 'none';
        noResultsMessage.style.display = 'block';
        return;
    }

    // Show results
    resultsContainer.style.display = 'block';
    noResultsMessage.style.display = 'none';

    // Create a grid for results
    const resultsGrid = document.createElement('div');
    resultsGrid.className = 'search-results-grid';

    // Get the currency from settings
    const currency = settings && settings.currency ? settings.currency : '₪';

    // Add each result to the grid
    results.forEach(artwork => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';

        // Highlight matching text
        const highlightedTitle = highlightText(artwork.title, query);
        const highlightedMedium = highlightText(artwork.medium, query);
        const highlightedDescription = highlightText(
            artwork.description || 'No description available',
            query
        );

        // Format the price
        const formattedPrice = (artwork.price !== null && artwork.price !== undefined) ? `${currency}${artwork.price}` : 'Price on request';

        resultItem.innerHTML = `
            <a href="/artwork/${artwork.id}" class="search-result-link">
                <img src="${artwork.image}" alt="${artwork.title}" class="search-result-image"
                    onerror="this.onerror=null;this.src='data:image/png;base64,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';">
                <div class="search-result-info">
                    <h3>${highlightedTitle}</h3>
                    <p>${highlightedMedium}</p>
                    <p class="search-result-price">${formattedPrice}</p>
                    <p class="search-result-dimensions">${artwork.dimensions || ''}</p>
                </div>
            </a>
            <div class="search-result-actions">
                <a href="/gallery?collection=${artwork.category}" class="btn outline-btn btn-sm">View Collection</a>
                <button class="btn primary-btn btn-sm add-to-cart-btn" data-id="${artwork.id}">Add to Cart</button>
            </div>
        `;

        // Add event listener for the Add to Cart button
        const addToCartBtn = resultItem.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', function() {
                if (window.addToCart) {
                    // Create an item object to add to the cart
                    const item = {
                        id: artwork.id,
                        title: artwork.title,
                        price: formattedPrice,
                        image: artwork.image,
                        dimensions: artwork.dimensions || 'Dimensions not specified'
                    };

                    window.addToCart(item);

                    // Show success message
                    this.innerHTML = 'Added!';
                    this.disabled = true;

                    setTimeout(() => {
                        this.innerHTML = 'Add to Cart';
                        this.disabled = false;
                    }, 1500);
                }
            });
        }

        resultsGrid.appendChild(resultItem);
    });

    // Add additional styles for the new layout
    if (!document.getElementById('search-result-styles')) {
        const style = document.createElement('style');
        style.id = 'search-result-styles';
        style.textContent = `
            .search-result-link {
                display: block;
                color: inherit;
                text-decoration: none;
            }

            .search-result-actions {
                display: flex;
                justify-content: space-between;
                padding: 0 1rem 1rem;
                gap: 0.5rem;
            }

            .search-result-actions .btn {
                flex: 1;
                font-size: 0.85rem;
                padding: 0.4rem 0.6rem;
                text-align: center;
            }

            .search-result-item:hover .search-result-image {
                transform: scale(1.05);
            }

            .search-result-image {
                transition: transform 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }

    resultsContainer.appendChild(resultsGrid);
}

// Helper function to highlight matching text
function highlightText(text, query) {
    if (!text) return '';

    // Escape the query for use in regex
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Create a regex that's case insensitive
    const regex = new RegExp(`(${escapedQuery})`, 'gi');

    // Replace matching text with highlighted version
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}