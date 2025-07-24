// Search Module - Handles artwork search functionality
// Optimized with debouncing, caching, and improved user experience

class SearchManager {
    constructor() {
        this.isInitialized = false;
        this.isOpen = false;
        this.artworkData = null;
        this.searchResults = [];
        this.searchHistory = [];
        this.maxHistoryItems = 10;

        // DOM elements
        this.searchModal = null;
        this.searchInput = null;
        this.searchButton = null;
        this.clearButton = null;
        this.resultsContainer = null;
        this.noResultsElement = null;
        this.historyContainer = null;

        // Search settings
        this.minSearchLength = 2;
        this.debounceDelay = 300;
        this.maxResults = 20;

        // Bind methods
        this.performSearch = this.debounce(this.performSearch.bind(this), this.debounceDelay);
        this.handleKeydown = this.handleKeydown.bind(this);

        // Load search history from localStorage
        this.loadSearchHistory();
    }

    // Initialize the search system
    init() {
        if (this.isInitialized) {
            console.warn('Search manager already initialized');
            return;
        }

        try {
            this.createSearchModal();
            this.setupEventListeners();
            this.loadArtworkData();
            this.isInitialized = true;

            console.log('Search manager initialized successfully');
        } catch (error) {
            console.error('Error initializing search manager:', error);
        }
    }

    // Create search modal if it doesn't exist
    createSearchModal() {
        // Check if search modal already exists
        if (document.querySelector('.search-modal-overlay')) {
            this.setupExistingModal();
            return;
        }

        // Create search modal structure
        this.searchModal = document.createElement('div');
        this.searchModal.className = 'search-modal-overlay';
        this.searchModal.setAttribute('role', 'dialog');
        this.searchModal.setAttribute('aria-modal', 'true');
        this.searchModal.setAttribute('aria-labelledby', 'search-modal-title');
        this.searchModal.setAttribute('aria-hidden', 'true');

        const modalContent = document.createElement('div');
        modalContent.className = 'search-modal';

        // Header
        const header = document.createElement('div');
        header.className = 'search-header';

        const title = document.createElement('h2');
        title.id = 'search-modal-title';
        title.textContent = 'Search Artwork';

        const closeButton = document.createElement('button');
        closeButton.className = 'search-close';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.setAttribute('aria-label', 'Close search');

        header.appendChild(title);
        header.appendChild(closeButton);

        // Search form
        const formContainer = document.createElement('div');
        formContainer.className = 'search-form-container';

        const form = document.createElement('form');
        form.className = 'search-form';

        const inputGroup = document.createElement('div');
        inputGroup.className = 'search-input-group';

        this.searchInput = document.createElement('input');
        this.searchInput.type = 'text';
        this.searchInput.className = 'search-input';
        this.searchInput.placeholder = 'Search by title, medium, or description...';
        this.searchInput.setAttribute('autocomplete', 'off');
        this.searchInput.setAttribute('aria-label', 'Search artwork');

        this.searchButton = document.createElement('button');
        this.searchButton.type = 'submit';
        this.searchButton.className = 'search-btn';
        this.searchButton.innerHTML = '<i class="fas fa-search"></i>';
        this.searchButton.setAttribute('aria-label', 'Search');

        this.clearButton = document.createElement('button');
        this.clearButton.type = 'button';
        this.clearButton.className = 'search-clear';
        this.clearButton.innerHTML = '<i class="fas fa-times-circle"></i>';
        this.clearButton.setAttribute('aria-label', 'Clear search');
        this.clearButton.style.display = 'none';

        inputGroup.appendChild(this.searchInput);
        inputGroup.appendChild(this.searchButton);
        inputGroup.appendChild(this.clearButton);
        form.appendChild(inputGroup);
        formContainer.appendChild(form);

        // Search history
        this.historyContainer = document.createElement('div');
        this.historyContainer.className = 'search-history';
        this.historyContainer.innerHTML = `
            <h3>Recent Searches</h3>
            <div class="search-history-items"></div>
        `;

        // Results container
        this.resultsContainer = document.createElement('div');
        this.resultsContainer.className = 'search-results-container';

        // No results message
        this.noResultsElement = document.createElement('div');
        this.noResultsElement.className = 'search-no-results';
        this.noResultsElement.style.display = 'none';
        this.noResultsElement.innerHTML = `
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
        `;

        // Assemble modal
        modalContent.appendChild(header);
        modalContent.appendChild(formContainer);
        modalContent.appendChild(this.historyContainer);
        modalContent.appendChild(this.resultsContainer);
        modalContent.appendChild(this.noResultsElement);

        this.searchModal.appendChild(modalContent);

        // Add styles
        this.addSearchStyles();

        // Add to DOM
        document.body.appendChild(this.searchModal);

        // Setup modal-specific event listeners
        closeButton.addEventListener('click', () => this.close());
    }

    // Setup existing search modal
    setupExistingModal() {
        this.searchModal = document.querySelector('.search-modal-overlay');
        this.searchInput = document.querySelector('.search-input');
        this.searchButton = document.querySelector('.search-btn');
        this.clearButton = document.querySelector('.search-clear');
        this.resultsContainer = document.querySelector('.search-results-container');
        this.noResultsElement = document.querySelector('.search-no-results');
        this.historyContainer = document.querySelector('.search-history');

        // Enhance existing modal
        this.enhanceExistingModal();
    }

    // Enhance existing modal with missing features
    enhanceExistingModal() {
        if (!this.searchModal) return;

        // Add accessibility attributes
        this.searchModal.setAttribute('role', 'dialog');
        this.searchModal.setAttribute('aria-modal', 'true');
        this.searchModal.setAttribute('aria-hidden', 'true');

        // Add history container if missing
        if (!this.historyContainer) {
            this.historyContainer = document.createElement('div');
            this.historyContainer.className = 'search-history';
            this.historyContainer.innerHTML = `
                <h3>Recent Searches</h3>
                <div class="search-history-items"></div>
            `;

            const formContainer = this.searchModal.querySelector('.search-form-container');
            if (formContainer && formContainer.nextSibling) {
                formContainer.parentNode.insertBefore(this.historyContainer, formContainer.nextSibling);
            }
        }
    }

    // Add search styles
    addSearchStyles() {
        if (document.getElementById('search-modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'search-modal-styles';
        style.textContent = `
            .search-modal-overlay {
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
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
                padding: 20px;
            }

            .search-modal-overlay.active {
                opacity: 1;
                visibility: visible;
            }

            .search-modal {
                background: white;
                border-radius: 12px;
                max-width: 700px;
                width: 100%;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                transform: scale(0.9) translateY(20px);
                transition: transform 0.3s ease;
                display: flex;
                flex-direction: column;
            }

            .search-modal-overlay.active .search-modal {
                transform: scale(1) translateY(0);
            }

            .search-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                border-bottom: 1px solid #eee;
                background: #f8f9fa;
            }

            .search-header h2 {
                margin: 0;
                font-size: 1.25rem;
                color: #333;
            }

            .search-close {
                background: none;
                border: none;
                font-size: 20px;
                color: #666;
                cursor: pointer;
                padding: 8px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .search-close:hover {
                background: #e9ecef;
                color: #333;
            }

            .search-form-container {
                padding: 20px 24px;
                border-bottom: 1px solid #eee;
            }

            .search-input-group {
                position: relative;
                display: flex;
                align-items: center;
                background: #f8f9fa;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                transition: all 0.2s ease;
            }

            .search-input-group:focus-within {
                border-color: #9e7e5c;
                box-shadow: 0 0 0 3px rgba(158, 126, 92, 0.1);
            }

            .search-input {
                flex: 1;
                padding: 12px 16px;
                border: none;
                background: transparent;
                font-size: 16px;
                color: #333;
                outline: none;
            }

            .search-input::placeholder {
                color: #6c757d;
            }

            .search-btn, .search-clear {
                background: none;
                border: none;
                padding: 12px;
                color: #6c757d;
                cursor: pointer;
                transition: color 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .search-btn:hover, .search-clear:hover {
                color: #9e7e5c;
            }

            .search-history {
                padding: 16px 24px;
                border-bottom: 1px solid #eee;
                background: #f8f9fa;
            }

            .search-history h3 {
                margin: 0 0 12px 0;
                font-size: 0.9rem;
                color: #6c757d;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .search-history-items {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .search-history-item {
                background: white;
                border: 1px solid #dee2e6;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.85rem;
                color: #495057;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                padding-right: 32px;
            }

            .search-history-item:hover {
                background: #e9ecef;
                border-color: #9e7e5c;
            }

            .search-history-item .remove-history {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: #6c757d;
                cursor: pointer;
                font-size: 12px;
                padding: 2px;
                opacity: 0.7;
            }

            .search-history-item .remove-history:hover {
                opacity: 1;
                color: #dc3545;
            }

            .search-results-container {
                flex: 1;
                overflow-y: auto;
                padding: 16px 0;
            }

            .search-results-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 16px;
                padding: 0 24px;
            }

            .search-result-item {
                border: 1px solid #e9ecef;
                border-radius: 8px;
                overflow: hidden;
                transition: all 0.2s ease;
                background: white;
            }

            .search-result-item:hover {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                transform: translateY(-2px);
            }

            .search-result-image {
                width: 100%;
                height: 160px;
                object-fit: cover;
                display: block;
            }

            .search-result-info {
                padding: 12px;
            }

            .search-result-info h3 {
                margin: 0 0 8px 0;
                font-size: 1rem;
                color: #333;
                line-height: 1.3;
            }

            .search-result-info p {
                margin: 4px 0;
                font-size: 0.85rem;
                color: #6c757d;
                line-height: 1.4;
            }

            .search-result-price {
                font-weight: 600;
                color: #9e7e5c !important;
            }

            .search-result-actions {
                display: flex;
                gap: 8px;
                padding: 0 12px 12px;
            }

            .search-result-actions .btn {
                flex: 1;
                font-size: 0.8rem;
                padding: 6px 12px;
                text-align: center;
                text-decoration: none;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .search-highlight {
                background: #fff3cd;
                padding: 1px 2px;
                border-radius: 2px;
                font-weight: 500;
            }

            .search-no-results {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px 24px;
                text-align: center;
                color: #6c757d;
            }

            .no-results-icon {
                color: #dee2e6;
                margin-bottom: 16px;
            }

            .search-no-results h3 {
                margin: 0 0 8px 0;
                color: #495057;
            }

            .search-no-results p {
                margin: 0 0 20px 0;
                font-size: 0.9rem;
            }

            .search-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 40px;
                color: #6c757d;
            }

            .search-loading .spinner {
                width: 20px;
                height: 20px;
                border: 2px solid #e9ecef;
                border-top: 2px solid #9e7e5c;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-right: 12px;
            }

            @media (max-width: 768px) {
                .search-modal {
                    margin: 10px;
                    max-height: calc(100vh - 20px);
                }

                .search-results-grid {
                    grid-template-columns: 1fr;
                    padding: 0 16px;
                }

                .search-history-items {
                    flex-direction: column;
                }

                .search-history-item {
                    align-self: flex-start;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Setup event listeners
    setupEventListeners() {
        // Search icon in header
        const searchIcon = document.querySelector('.search-icon');
        if (searchIcon) {
            searchIcon.addEventListener('click', (e) => {
                e.preventDefault();
                this.open();
            });
        }

        if (!this.searchModal) return;

        // Form submission
        const form = this.searchModal.querySelector('.search-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSearch();
            });
        }

        // Input events
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                const query = this.searchInput.value.trim();

                if (query.length > 0) {
                    this.clearButton.style.display = 'block';
                    if (query.length >= this.minSearchLength) {
                        this.performSearch();
                    }
                } else {
                    this.clearButton.style.display = 'none';
                    this.clearResults();
                    this.showHistory();
                }
            });

            this.searchInput.addEventListener('keydown', this.handleKeydown);
        }

        // Clear button
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // Modal close events
        this.searchModal.addEventListener('click', (e) => {
            if (e.target === this.searchModal) {
                this.close();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Listen for artwork data updates
        window.addEventListener('artwork-data-loaded', (e) => {
            this.artworkData = e.detail;
        });
    }

    // Load artwork data
    loadArtworkData() {
        // Try to get from global window object first
        if (window.artworkData) {
            this.artworkData = window.artworkData;
            return;
        }

        // Try to get from localStorage
        try {
            const savedData = localStorage.getItem('evgenia-artwork-data');
            if (savedData) {
                this.artworkData = JSON.parse(savedData);
            }
        } catch (error) {
            console.error('Error loading artwork data for search:', error);
        }
    }

    // Open search modal
    open() {
        if (!this.searchModal) return;

        this.isOpen = true;
        this.searchModal.setAttribute('aria-hidden', 'false');
        this.searchModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Load fresh artwork data
        this.loadArtworkData();

        // Show history by default
        this.showHistory();

        // Focus search input
        setTimeout(() => {
            if (this.searchInput) {
                this.searchInput.focus();
            }
        }, 300);

        // Dispatch event
        document.dispatchEvent(new CustomEvent('search-opened'));
    }

    // Close search modal
    close() {
        if (!this.isOpen || !this.searchModal) return;

        this.isOpen = false;
        this.searchModal.classList.remove('active');
        this.searchModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';

        // Dispatch event
        document.dispatchEvent(new CustomEvent('search-closed'));
        document.dispatchEvent(new CustomEvent('modal-closed')); // For focus management
    }

    // Handle search form submission
    handleSearch() {
        const query = this.searchInput?.value.trim();
        if (query && query.length >= this.minSearchLength) {
            this.addToHistory(query);
            this.performSearch();
        }
    }

    // Sanitize search input to prevent XSS
    sanitizeSearchInput(input) {
        if (typeof input !== 'string') return '';
        return input
            .replace(/[<>]/g, '') // Remove < and > to prevent basic XSS
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
            .replace(/['"]/g, '') // Remove quotes
            .trim();
    }

    // Perform the actual search
    performSearch() {
        const rawQuery = this.searchInput?.value || '';
        const query = this.sanitizeSearchInput(rawQuery).toLowerCase();

        if (!query || query.length < this.minSearchLength) {
            this.clearResults();
            this.showHistory();
            return;
        }

        if (!this.artworkData?.artworks) {
            this.showError('Artwork data not available. Please try again later.');
            return;
        }

        // Show loading state
        this.showLoading();

        // Perform search with timeout to allow loading UI to show
        setTimeout(() => {
            try {
                const results = this.searchArtworks(query);
                this.displayResults(results, query);
            } catch (error) {
                console.error('Search error:', error);
                this.showError('An error occurred while searching. Please try again.');
            }
        }, 100);
    }

    // Search through artworks
    searchArtworks(query) {
        if (!this.artworkData?.artworks) return [];

        const searchFields = ['title', 'medium', 'description', 'category'];
        const results = [];

        this.artworkData.artworks.forEach(artwork => {
            let relevanceScore = 0;

            searchFields.forEach(field => {
                const value = artwork[field];
                if (value && typeof value === 'string') {
                    const fieldValue = value.toLowerCase();

                    // Exact match gets highest score
                    if (fieldValue === query) {
                        relevanceScore += 100;
                    }
                    // Starts with query gets high score
                    else if (fieldValue.startsWith(query)) {
                        relevanceScore += 50;
                    }
                    // Contains query gets lower score
                    else if (fieldValue.includes(query)) {
                        relevanceScore += 10;
                    }

                    // Title matches get extra weight
                    if (field === 'title' && fieldValue.includes(query)) {
                        relevanceScore += 20;
                    }
                }
            });

            if (relevanceScore > 0) {
                results.push({ ...artwork, relevanceScore });
            }
        });

        // Sort by relevance score and limit results
        return results
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, this.maxResults);
    }

    // Display search results
    displayResults(results, query) {
        this.hideLoading();
        this.hideHistory();
        this.clearResults();

        if (results.length === 0) {
            this.showNoResults();
            return;
        }

        // Create results grid
        const resultsGrid = document.createElement('div');
        resultsGrid.className = 'search-results-grid';

        const currency = this.artworkData?.settings?.currency || '₪';

        results.forEach(artwork => {
            const resultItem = this.createResultItem(artwork, query, currency);
            resultsGrid.appendChild(resultItem);
        });

        this.resultsContainer.appendChild(resultsGrid);
        this.resultsContainer.style.display = 'block';
    }

    // Create a single result item
    createResultItem(artwork, query, currency) {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';

        const highlightedTitle = this.highlightText(artwork.title, query);
        const highlightedMedium = this.highlightText(artwork.medium || '', query);
        const highlightedDescription = this.highlightText(
            artwork.description || 'No description available',
            query
        );

        const formattedPrice = (artwork.price !== null && artwork.price !== undefined)
            ? `${currency}${artwork.price}`
            : 'Price on request';

        resultItem.innerHTML = `
            <a href="/artwork/${artwork.id}" class="search-result-link">
                <img src="${window.utils ? window.utils.ensureAbsolutePath(artwork.image) : (artwork.image.startsWith('/') ? artwork.image : '/' + artwork.image)}" alt="${artwork.title}" class="search-result-image"
                     onerror="this.onerror=null;this.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';">
                <div class="search-result-info">
                    <h3>${highlightedTitle}</h3>
                    <p>${highlightedMedium}</p>
                    <p class="search-result-price">${formattedPrice}</p>
                    <p class="search-result-dimensions">${artwork.dimensions || ''}</p>
                </div>
            </a>
            <div class="search-result-actions">
                <a href="/gallery?collection=${artwork.category}" class="btn outline-btn">View Collection</a>
                <button class="btn primary-btn add-to-cart-btn" data-id="${artwork.id}">Add to Cart</button>
            </div>
        `;

        // Add to cart functionality
        const addToCartBtn = resultItem.querySelector('.add-to-cart-btn');
        if (addToCartBtn && window.addToCart) {
            addToCartBtn.addEventListener('click', () => {
                const item = {
                    id: artwork.id,
                    title: artwork.title,
                    price: formattedPrice,
                    image: artwork.image,
                    dimensions: artwork.dimensions || 'Dimensions not specified'
                };

                const success = window.addToCart(item);
                if (success) {
                    addToCartBtn.textContent = 'Added!';
                    addToCartBtn.disabled = true;
                    setTimeout(() => {
                        addToCartBtn.textContent = 'Add to Cart';
                        addToCartBtn.disabled = false;
                    }, 1500);
                }
            });
        }

        return resultItem;
    }

    // Highlight matching text
    highlightText(text, query) {
        if (!text || !query) return text;

        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    // Show/hide different states
    showLoading() {
        this.clearResults();
        this.hideHistory();

        const loading = document.createElement('div');
        loading.className = 'search-loading';
        loading.innerHTML = `
            <div class="spinner"></div>
            <span>Searching...</span>
        `;

        this.resultsContainer.appendChild(loading);
        this.resultsContainer.style.display = 'block';
    }

    hideLoading() {
        const loading = this.resultsContainer?.querySelector('.search-loading');
        if (loading) {
            loading.remove();
        }
    }

    showNoResults() {
        this.noResultsElement.style.display = 'flex';
        this.resultsContainer.style.display = 'none';
    }

    showError(message) {
        this.hideLoading();
        this.clearResults();

        const error = document.createElement('div');
        error.className = 'search-error';
        error.style.cssText = 'text-align: center; padding: 40px; color: #dc3545;';
        error.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 16px;"></i>
            <p>${message}</p>
        `;

        this.resultsContainer.appendChild(error);
        this.resultsContainer.style.display = 'block';
    }

    showHistory() {
        if (!this.historyContainer) return;

        const historyItems = this.historyContainer.querySelector('.search-history-items');
        if (!historyItems) return;

        historyItems.innerHTML = '';

        if (this.searchHistory.length === 0) {
            this.historyContainer.style.display = 'none';
            return;
        }

        this.searchHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'search-history-item';
            historyItem.innerHTML = `
                <span>${item}</span>
                <button class="remove-history" aria-label="Remove from history">×</button>
            `;

            // Click to search
            historyItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('remove-history')) {
                    this.searchInput.value = item;
                    this.clearButton.style.display = 'block';
                    this.performSearch();
                }
            });

            // Remove from history
            const removeBtn = historyItem.querySelector('.remove-history');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFromHistory(item);
                this.showHistory();
            });

            historyItems.appendChild(historyItem);
        });

        this.historyContainer.style.display = 'block';
    }

    hideHistory() {
        if (this.historyContainer) {
            this.historyContainer.style.display = 'none';
        }
    }

    clearResults() {
        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = '';
            this.resultsContainer.style.display = 'none';
        }
        if (this.noResultsElement) {
            this.noResultsElement.style.display = 'none';
        }
    }

    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.searchInput.focus();
        }
        if (this.clearButton) {
            this.clearButton.style.display = 'none';
        }
        this.clearResults();
        this.showHistory();
    }

    // Search history management
    addToHistory(query) {
        if (!query || this.searchHistory.includes(query)) return;

        this.searchHistory.unshift(query);
        if (this.searchHistory.length > this.maxHistoryItems) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
        }

        this.saveSearchHistory();
    }

    removeFromHistory(query) {
        this.searchHistory = this.searchHistory.filter(item => item !== query);
        this.saveSearchHistory();
    }

    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('search-history');
            if (saved) {
                this.searchHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading search history:', error);
            this.searchHistory = [];
        }
    }

    saveSearchHistory() {
        try {
            localStorage.setItem('search-history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('Error saving search history:', error);
        }
    }

    // Handle keyboard navigation
    handleKeydown(e) {
        // Future enhancement: add arrow key navigation through results
        if (e.key === 'Enter') {
            this.handleSearch();
        }
    }

    // Debounce utility
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

    // Public method to trigger search
    search(query) {
        if (this.searchInput) {
            this.searchInput.value = query;
            this.clearButton.style.display = query ? 'block' : 'none';
            this.performSearch();
        }
    }

    // Clean up
    destroy() {
        if (this.searchModal && this.searchModal.parentNode) {
            this.searchModal.parentNode.removeChild(this.searchModal);
        }
        this.isInitialized = false;
    }
}

// Create global instance
const searchManager = new SearchManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        searchManager.init();
    });
} else {
    searchManager.init();
}

// Export for use in other modules
// Make search manager globally accessible
window.searchManager = searchManager;