// UI Module - Handles basic user interface components
// Mobile menu, FAQ toggle, scroll effects, and other UI interactions

class UIManager {
    constructor() {
        this.isInitialized = false;
        this.mobileMenuOpen = false;
        this.scrollThreshold = 100;

        // Bind methods
        this.handleScroll = this.debounce(this.handleScroll.bind(this), 10);
        this.handleResize = this.debounce(this.handleResize.bind(this), 250);
    }

    // Initialize all UI components
    init() {
        if (this.isInitialized) {
            console.warn('UI manager already initialized');
            return;
        }

        try {
            this.initMobileMenu();
            this.initFaqToggle();
            this.initScrollEffects();
            this.initResponsiveHandling();
            this.isInitialized = true;

            console.log('UI manager initialized successfully');
        } catch (error) {
            console.error('Error initializing UI manager:', error);
        }
    }

    // Mobile Menu Toggle with improved accessibility
    initMobileMenu() {
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (!mobileMenuToggle || !navLinks) {
            console.log('Mobile menu elements not found');
            return;
        }

        // Add ARIA attributes for accessibility
        mobileMenuToggle.setAttribute('aria-label', 'Toggle mobile menu');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        mobileMenuToggle.setAttribute('aria-controls', 'mobile-nav');
        navLinks.setAttribute('id', 'mobile-nav');

        // Toggle menu on button click
        mobileMenuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMobileMenu();
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.mobileMenuOpen &&
                !navLinks.contains(e.target) &&
                !mobileMenuToggle.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.mobileMenuOpen) {
                this.closeMobileMenu();
                mobileMenuToggle.focus(); // Return focus to button
            }
        });

        // Close menu when clicking on navigation links
        const menuLinks = navLinks.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });
    }

    // Toggle mobile menu state
    toggleMobileMenu() {
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (!mobileMenuToggle || !navLinks) return;

        this.mobileMenuOpen = !this.mobileMenuOpen;

        navLinks.classList.toggle('active', this.mobileMenuOpen);
        document.body.classList.toggle('menu-open', this.mobileMenuOpen);

        // Update ARIA attributes
        mobileMenuToggle.setAttribute('aria-expanded', this.mobileMenuOpen.toString());

        // Prevent body scroll when menu is open
        if (this.mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        // Animate hamburger icon if it exists
        this.animateHamburgerIcon(this.mobileMenuOpen);
    }

    // Close mobile menu
    closeMobileMenu() {
        if (!this.mobileMenuOpen) return;

        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (!mobileMenuToggle || !navLinks) return;

        this.mobileMenuOpen = false;
        navLinks.classList.remove('active');
        document.body.classList.remove('menu-open');
        document.body.style.overflow = '';

        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        this.animateHamburgerIcon(false);
    }

    // Animate hamburger icon (if styling supports it)
    animateHamburgerIcon(isOpen) {
        const icon = document.querySelector('.mobile-menu-toggle');
        if (icon) {
            icon.classList.toggle('active', isOpen);
        }
    }

    // FAQ Toggle with improved accessibility
    initFaqToggle() {
        const faqQuestions = document.querySelectorAll('.faq-question');

        if (faqQuestions.length === 0) {
            console.log('No FAQ elements found');
            return;
        }

        faqQuestions.forEach((question, index) => {
            const faqItem = question.parentElement;
            const answer = faqItem.querySelector('.faq-answer');

            // Add accessibility attributes
            question.setAttribute('aria-expanded', 'false');
            question.setAttribute('tabindex', '0');
            question.setAttribute('role', 'button');
            question.setAttribute('aria-controls', `faq-answer-${index}`);

            if (answer) {
                answer.setAttribute('id', `faq-answer-${index}`);
                answer.setAttribute('aria-hidden', 'true');
            }

            // Handle click and keyboard events
            const toggleFaq = () => {
                const isActive = faqItem.classList.contains('active');

                // Close all other FAQ items
                faqQuestions.forEach(otherQuestion => {
                    const otherItem = otherQuestion.parentElement;
                    const otherAnswer = otherItem.querySelector('.faq-answer');

                    if (otherItem !== faqItem && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                        otherQuestion.setAttribute('aria-expanded', 'false');
                        if (otherAnswer) {
                            otherAnswer.setAttribute('aria-hidden', 'true');
                        }
                    }
                });

                // Toggle current FAQ item
                faqItem.classList.toggle('active', !isActive);
                question.setAttribute('aria-expanded', (!isActive).toString());

                if (answer) {
                    answer.setAttribute('aria-hidden', isActive.toString());
                }

                // Smooth scroll into view if opening
                if (!isActive) {
                    setTimeout(() => {
                        question.scrollIntoView({
                            behavior: 'smooth',
                            block: 'nearest'
                        });
                    }, 300);
                }
            };

            question.addEventListener('click', toggleFaq);
            question.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleFaq();
                }
            });
        });
    }

    // Initialize scroll effects
    initScrollEffects() {
        window.addEventListener('scroll', this.handleScroll, { passive: true });

        // Initial call to set header state
        this.handleScroll();
    }

    // Handle scroll events with improved performance
    handleScroll() {
        const header = document.querySelector('header');
        if (!header) return;

        const scrollY = window.scrollY;

        // Add/remove scrolled class based on scroll position
        if (scrollY > this.scrollThreshold) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Additional scroll effects can be added here
        this.updateScrollProgress();
    }

    // Update scroll progress indicator (if exists)
    updateScrollProgress() {
        const progressIndicator = document.querySelector('.scroll-progress');
        if (!progressIndicator) return;

        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        progressIndicator.style.width = `${Math.min(scrollPercent, 100)}%`;
    }

    // Initialize responsive handling
    initResponsiveHandling() {
        window.addEventListener('resize', this.handleResize, { passive: true });

        // Initial call
        this.handleResize();
    }

    // Handle window resize
    handleResize() {
        // Close mobile menu on resize to larger screen
        if (window.innerWidth > 768 && this.mobileMenuOpen) {
            this.closeMobileMenu();
        }

        // Update any responsive elements
        this.updateResponsiveElements();
    }

    // Update responsive elements
    updateResponsiveElements() {
        // Update viewport height for mobile browsers
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);

        // Additional responsive updates can be added here
    }

    // Utility: Debounce function for performance
    debounce(func, wait) {
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

    // Utility: Show toast notification
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // Add styles
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%) translateY(100%)',
            padding: '12px 24px',
            borderRadius: '6px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transition: 'transform 0.3s ease',
            backgroundColor: type === 'error' ? '#e74c3c' :
                            type === 'success' ? '#27ae60' :
                            type === 'warning' ? '#f39c12' : '#3498db'
        });

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);

        // Remove after duration
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    // Initialize smooth scrolling for anchor links
    initSmoothScrolling() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');

        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#') return;

                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();

                    // Close mobile menu if open
                    if (this.mobileMenuOpen) {
                        this.closeMobileMenu();
                    }

                    // Smooth scroll to target
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Update URL without triggering navigation
                    if (history.pushState) {
                        history.pushState(null, null, href);
                    }
                }
            });
        });
    }

    // Initialize lazy loading for images
    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.remove('lazy');
                            observer.unobserve(img);
                        }
                    }
                });
            });

            const lazyImages = document.querySelectorAll('img[data-src]');
            lazyImages.forEach(img => {
                img.classList.add('lazy');
                imageObserver.observe(img);
            });
        }
    }

    // Add loading states for async operations
    setLoadingState(element, isLoading) {
        if (!element) return;

        if (isLoading) {
            element.classList.add('loading');
            element.setAttribute('aria-busy', 'true');

            // Disable if it's a button or input
            if (element.tagName === 'BUTTON' || element.tagName === 'INPUT') {
                element.disabled = true;
            }
        } else {
            element.classList.remove('loading');
            element.setAttribute('aria-busy', 'false');

            // Re-enable if it's a button or input
            if (element.tagName === 'BUTTON' || element.tagName === 'INPUT') {
                element.disabled = false;
            }
        }
    }

    // Handle focus management for better accessibility
    initFocusManagement() {
        // Track the last focused element before modal opens
        let lastFocusedElement = null;

        document.addEventListener('focusin', (e) => {
            // Store the last focused element that's not in a modal
            if (!e.target.closest('.modal, .lightbox, .cart-modal')) {
                lastFocusedElement = e.target;
            }
        });

        // Return focus when modals close
        document.addEventListener('modal-closed', () => {
            if (lastFocusedElement) {
                lastFocusedElement.focus();
            }
        });

        // Trap focus within modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const activeModal = document.querySelector('.modal.active, .lightbox.active, .cart-modal-overlay.active');
                if (activeModal) {
                    this.trapFocus(e, activeModal);
                }
            }
        });
    }

    // Trap focus within an element
    trapFocus(e, container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }
}

// Create global instance
const uiManager = new UIManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        uiManager.init();
    });
} else {
    uiManager.init();
}

// Export for use in other modules
// Make UI manager globally accessible
window.uiManager = uiManager;