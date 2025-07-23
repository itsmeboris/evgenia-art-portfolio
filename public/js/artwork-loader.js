// Artwork Loader - Dynamically loads artwork data from JSON file

document.addEventListener('DOMContentLoaded', function() {
    // Use a small delay to ensure stylesheets are loaded before manipulating the DOM
    setTimeout(() => {
        // Fetch artwork data from the JSON file
        fetchArtworkData()
            .then(data => {
                // Initialize all artwork components
                initHeroSliderDynamic(data);
                initGalleryFilters(data);
                initGalleryGrid(data);
                initLatestArtwork(data);
                initFeaturedCollections(data);
                initFooterCollectionLinks(data);
            })
            .catch(error => {
                console.error('Error loading artwork data:', error);
                // Show error message to user
                displayErrorMessage('Failed to load artwork data. Please try refreshing the page.');
            });
    }, 100); // Small delay to allow stylesheets to load
});

// Fetch artwork data from the JSON file
function fetchArtworkData() {
    return fetch('/public/data/artwork-data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Ensure each artwork has a unique ID
            data.artworks.forEach(artwork => {
                // If no ID exists, create one from the title
                if (!artwork.id) {
                    artwork.id = artwork.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                }
            });

            // Store in localStorage for access on individual artwork pages
            try {
                localStorage.setItem('evgenia-artwork-data', JSON.stringify(data));
            } catch (e) {
                console.warn('Unable to store artwork data in localStorage:', e);
            }

            // Transform the data structure to match what the frontend expects
            const transformedData = {
                artworks: data.artworks,
                collections: data.categories.map(category => ({
                    id: category.id,
                    title: category.name,
                    description: category.description,
                    image: category.image
                })),
                settings: data.settings || { currency: '₪', imagePath: 'public/assets/images/artwork/' }
            };

            // Dispatch event so other scripts can access the data
            window.dispatchEvent(new CustomEvent('artwork-data-loaded', {
                detail: transformedData
            }));

            return transformedData;
        });
}

// Display error message on the page
function displayErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.padding = '20px';
    errorDiv.style.margin = '20px auto';
    errorDiv.style.backgroundColor = '#ffebee';
    errorDiv.style.color = '#c62828';
    errorDiv.style.borderRadius = '4px';
    errorDiv.style.maxWidth = '800px';
    errorDiv.style.textAlign = 'center';
    errorDiv.textContent = message;

    // Insert at the top of gallery section or other appropriate location
    const galleryGrid = document.querySelector('.gallery-grid');
    if (galleryGrid) {
        galleryGrid.parentNode.insertBefore(errorDiv, galleryGrid);
    } else {
        const latestArtwork = document.querySelector('.latest-artwork .artwork-grid');
        if (latestArtwork) {
            latestArtwork.parentNode.insertBefore(errorDiv, latestArtwork);
        } else {
            document.body.insertBefore(errorDiv, document.body.firstChild);
        }
    }
}

// Base64 data URI for a placeholder image when images fail to load
const placeholderImageURI = 'data:image/png;base64,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';

// Generate and populate the Gallery Grid
function initGalleryGrid(data) {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;

    // Clear any existing content
    galleryGrid.innerHTML = '';

    // Get the active filter if any
    const urlParams = new URLSearchParams(window.location.search);
    const activeCollection = urlParams.get('collection') || 'all';

    // Use the currency from settings
    const currency = data.settings.currency || '₪';

    // Add the artwork items
    data.artworks.forEach(artwork => {
        // Only add if matches the active filter or no filter is active
        if (activeCollection === 'all' || artwork.category === activeCollection) {
            const artworkItem = document.createElement('div');
            artworkItem.className = 'artwork-item';
            artworkItem.setAttribute('data-category', artwork.category);
            artworkItem.setAttribute('data-id', artwork.id);

            // Format the price with the correct currency
            let formattedPrice = (artwork.price !== null && artwork.price !== undefined) ? `${currency}${artwork.price}` : 'Price on request';

            artworkItem.innerHTML = `
                <div class="artwork-image">
                    <a href="/artwork/${artwork.id}">
                        <img src="${artwork.image}" alt="${artwork.title} Painting" onerror="this.onerror=null;this.src='${placeholderImageURI}';">
                    </a>
                </div>
                <div class="artwork-info">
                    <h3><a href="/artwork/${artwork.id}">${artwork.title}</a></h3>
                    <p class="artwork-dimensions">${artwork.dimensions} | ${artwork.medium}</p>
                    <p class="artwork-price">${formattedPrice}</p>
                    <a href="#" class="btn primary-btn add-to-cart" data-id="${artwork.id}">Add to Cart</a>
                </div>
            `;

            galleryGrid.appendChild(artworkItem);
        }
    });

    // Add style for the title links
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .artwork-info h3 a {
            color: inherit;
            text-decoration: none;
            transition: color 0.2s ease;
        }
        .artwork-info h3 a:hover {
            color: #9e7e5c;
        }
        .artwork-image a {
            display: block;
            overflow: hidden;
        }
        .artwork-image a img {
            transition: transform 0.3s ease;
        }
        .artwork-image a:hover img {
            transform: scale(1.05);
        }
    `;
    document.head.appendChild(styleEl);

    // Initialize "Add to Cart" buttons
    initAddToCartButtons(data);

    // Notify modules about new elements (if available)
    if (window.app) {
        const cartModule = window.app.getModule('cart');
        if (cartModule && cartModule.refreshButtons) {
            cartModule.refreshButtons();
        }

        const lightboxModule = window.app.getModule('lightbox');
        if (lightboxModule && lightboxModule.refreshGallery) {
            lightboxModule.refreshGallery();
        }
    }
}

// Initialize "Add to Cart" buttons
function initAddToCartButtons(data) {
    // Add click handlers to the newly created "Add to Cart" buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const artworkId = this.getAttribute('data-id');
            const artwork = data.artworks.find(item => item.id === artworkId);

            if (artwork) {
                // Get the currency from settings
                const currency = data.settings.currency || '₪';

                // Format the price with the correct currency - now artwork.price should be numeric only
                const formattedPrice = (artwork.price !== null && artwork.price !== undefined) ? `${currency}${artwork.price}` : 'Price on request';

                // Create an item object to add to the cart
                const item = {
                    id: artwork.id,
                    title: artwork.title,
                    price: formattedPrice,
                    image: artwork.image,
                    dimensions: artwork.dimensions || 'Dimensions not specified'
                };

                // Call the global addToCart function (defined in main.js)
                if (window.addToCart) {
                    const success = window.addToCart(item);

                    if (success) {
                        // Show a success message
                        const successMessage = document.createElement('div');
                        successMessage.classList.add('add-to-cart-success');
                        successMessage.textContent = `${artwork.title} added to your cart`;
                        document.body.appendChild(successMessage);

                        // Remove the message after a delay
                        setTimeout(() => {
                            successMessage.style.opacity = '0';
                            setTimeout(() => {
                                document.body.removeChild(successMessage);
                            }, 500);
                        }, 2000);
                    }
                } else {
                    console.error('addToCart function not found in the global scope');
                }
            } else {
                console.error(`Artwork with ID ${artworkId} not found`);
            }
        });
    });
}

// Initialize lightbox for gallery images
function initGalleryLightbox() {
    // This function is no longer needed since we now link to individual artwork pages
    // We'll keep it for backward compatibility but it won't do anything
    console.log('Gallery images now link to individual artwork pages instead of opening a lightbox');
}

// Generate and populate the Latest Artwork section
function initLatestArtwork(data) {
    const latestArtworkGrid = document.querySelector('.latest-artwork .artwork-grid');
    if (!latestArtworkGrid) return;

    // Clear any existing content
    latestArtworkGrid.innerHTML = '';

    // Get currency from settings
    const currency = data.settings.currency || '₪';

    // Take the first 4 artworks (assuming they're the latest)
    // In a real implementation, you might want to sort by date
    const latestArtworks = data.artworks.slice(0, 4);

    latestArtworks.forEach(artwork => {
        const artworkItem = document.createElement('div');
        artworkItem.className = 'artwork-item';
        artworkItem.setAttribute('data-category', artwork.category);
        artworkItem.setAttribute('data-id', artwork.id);

        // Format the price with the correct currency
        let formattedPrice = (artwork.price !== null && artwork.price !== undefined) ? `${currency}${artwork.price}` : 'Price on request';

        artworkItem.innerHTML = `
            <div class="artwork-image">
                <a href="/artwork/${artwork.id}">
                    <img src="${artwork.image}" alt="${artwork.title} Painting" onerror="this.onerror=null;this.src='${placeholderImageURI}';">
                </a>
            </div>
            <div class="artwork-info">
                <h3><a href="/artwork/${artwork.id}">${artwork.title}</a></h3>
                <p class="artwork-dimensions">${artwork.dimensions} | ${artwork.medium}</p>
                <p class="artwork-price">${formattedPrice}</p>
                <a href="#" class="btn primary-btn add-to-cart" data-id="${artwork.id}">Add to Cart</a>
            </div>
        `;

        latestArtworkGrid.appendChild(artworkItem);
    });

    // We need to call initAddToCartButtons here as well for the latest artwork section
    initAddToCartButtons(data);

    // Notify modules about new elements (if available)
    if (window.app) {
        const cartModule = window.app.getModule('cart');
        if (cartModule && cartModule.refreshButtons) {
            cartModule.refreshButtons();
        }

        const lightboxModule = window.app.getModule('lightbox');
        if (lightboxModule && lightboxModule.refreshGallery) {
            lightboxModule.refreshGallery();
        }
    }
}

// Generate and populate the Featured Collections section
function initFeaturedCollections(data) {
    const collectionGrid = document.querySelector('.collection-grid');
    if (!collectionGrid) return;

    // Clear any existing content
    collectionGrid.innerHTML = '';

    // Add the collection items
    data.collections.forEach(collection => {
        const collectionItem = document.createElement('div');
        collectionItem.className = 'collection-item';

        collectionItem.innerHTML = `
            <div class="collection-image">
                <img src="${collection.image}" alt="${collection.title} Collection" onerror="this.onerror=null;this.src='${placeholderImageURI}';">
            </div>
            <div class="collection-info">
                <h3>${collection.title}</h3>
                <p>${collection.description}</p>
                <a href="/gallery?collection=${collection.id}" class="btn outline-btn">View Collection</a>
            </div>
        `;

        collectionGrid.appendChild(collectionItem);
    });
}

// Generate and populate the gallery filters
function initGalleryFilters(data) {
    const galleryFilters = document.querySelector('.gallery-filters');
    if (!galleryFilters) return;

    // Clear any existing content
    galleryFilters.innerHTML = '';

    // Add the "All" filter first
    const allFilter = document.createElement('button');
    allFilter.className = 'filter-btn';
    allFilter.setAttribute('data-filter', 'all');
    allFilter.textContent = 'All';
    galleryFilters.appendChild(allFilter);

    // Get the active filter from URL if any
    const urlParams = new URLSearchParams(window.location.search);
    const activeCollection = urlParams.get('collection') || 'all';

    // Set the "All" button as active if no collection is specified
    if (activeCollection === 'all') {
        allFilter.classList.add('active');
    }

    // Add filters for each category
    data.collections.forEach(collection => {
        const filterBtn = document.createElement('button');
        filterBtn.className = 'filter-btn';
        filterBtn.setAttribute('data-filter', collection.id);
        filterBtn.textContent = collection.title;

        // Set as active if matches the URL parameter
        if (collection.id === activeCollection) {
            filterBtn.classList.add('active');
        }

        galleryFilters.appendChild(filterBtn);
    });

    // Initialize the click handlers for the dynamically created filter buttons
    // We need to add event handlers directly here because we've created the buttons dynamically
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const filter = this.getAttribute('data-filter');

            // If clicking the same filter, don't reload
            const urlParams = new URLSearchParams(window.location.search);
            const currentFilter = urlParams.get('collection') || 'all';

            if (filter !== currentFilter) {
                // For different filter, reload the page with new filter parameter
                window.location.href = filter === 'all'
                    ? '/gallery'
                    : `/gallery?collection=${filter}`;
            }
        });
    });
}

// Generate and populate the footer collection links
function initFooterCollectionLinks(data) {
    const footerCollectionLists = document.querySelectorAll('.footer-collection-links');
    if (footerCollectionLists.length === 0) return;

    // For each footer collection list on the page
    footerCollectionLists.forEach(list => {
        // Clear existing content
        list.innerHTML = '';

        // Add links for each collection
        data.collections.forEach(collection => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `/gallery?collection=${collection.id}`;
            link.textContent = collection.title;
            listItem.appendChild(link);
            list.appendChild(listItem);
        });
    });
}

// Generate and populate the hero slider from categories data
function initHeroSliderDynamic(data) {
    const heroSlider = document.querySelector('.hero-slider');
    if (!heroSlider) return;

    // Keep only the first slide (artist introduction) which is static
    const artistSlide = heroSlider.querySelector('.slide:first-child');
    if (!artistSlide) return;

    // Create a document fragment to hold all slides before adding to DOM
    const fragment = document.createDocumentFragment();

    // Add the artist slide back as the first slide and ensure it's active
    const clonedArtistSlide = artistSlide.cloneNode(true);
    clonedArtistSlide.classList.add('active');
    fragment.appendChild(clonedArtistSlide);

    // Add slides for each category from the data
    if (data.collections && data.collections.length > 0) {
        data.collections.forEach(collection => {
            const slide = document.createElement('div');
            slide.className = 'slide';

            // Create the slide content from the collection data
            slide.innerHTML = `
                <div class="slide-content">
                    <h1>${collection.title}</h1>
                    <p>${collection.description}</p>
                    <div class="cta-buttons">
                        <a href="/gallery?collection=${collection.id}" class="btn primary-btn">View Collection</a>
                        <a href="/contact" class="btn secondary-btn">Commission Art</a>
                    </div>
                </div>
                <div class="slide-image">
                    <img src="${collection.image}" alt="${collection.title}" onerror="this.onerror=null;this.src='${placeholderImageURI}';">
                </div>
            `;

            fragment.appendChild(slide);
        });
    }

    // Clear the slider and add all the slides at once
    heroSlider.innerHTML = '';
    heroSlider.appendChild(fragment);

    // Mark as initialized
    heroSlider.setAttribute('data-initialized', 'true');

    // Reinitialize the slider functionality after a small delay
    // to ensure all images are loaded
    setTimeout(() => {
        initializeSliderFunctionality();
    }, 50);
}

// Function to initialize slider functionality after slides are dynamically created
function initializeSliderFunctionality() {
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (slides.length <= 1) return; // No need for slider with one or zero slides

    let currentIndex = 0;
    let slideInterval = null; // Initialize as null
    const intervalDuration = 5000; // 5 seconds between auto-slides
    let isPaused = false; // Track if slider is paused

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

    // Start the auto-slide timer
    function startSlideTimer() {
        if (!slideInterval && !isPaused) {
            slideInterval = setInterval(nextSlide, intervalDuration);
        }
    }

    // Pause the auto-slide timer
    function pauseSlideTimer() {
        if (slideInterval) {
            clearInterval(slideInterval);
            slideInterval = null;
            isPaused = true;
        }
    }

    // Resume the auto-slide timer
    function resumeSlideTimer() {
        isPaused = false;
        startSlideTimer();
    }

    // Reset the auto-slide timer (clear and restart from beginning)
    function resetSlideTimer() {
        if (slideInterval) {
            clearInterval(slideInterval);
            slideInterval = null;
        }
        isPaused = false;
        startSlideTimer();
    }

    // Wait for images to load before starting the slider
    let imagesLoaded = 0;
    const totalImages = document.querySelectorAll('.slide-image img').length;

    function checkAllImagesLoaded() {
        imagesLoaded++;
        if (imagesLoaded >= totalImages) {
            // All images are loaded, start the timer
            startSlideTimer();
        }
    }

    // Check each image
    const slideImages = document.querySelectorAll('.slide-image img');
    if (slideImages.length > 0) {
        slideImages.forEach(img => {
            if (img.complete) {
                checkAllImagesLoaded();
            } else {
                img.addEventListener('load', checkAllImagesLoaded);
                img.addEventListener('error', checkAllImagesLoaded); // Count errors as loaded too
            }
        });
    } else {
        // No images to load, start the timer
        startSlideTimer();
    }

    // Add event listeners to buttons with timer reset
    if (nextBtn) {
        // Remove any existing event listeners
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

        newNextBtn.addEventListener('click', function() {
            nextSlide();
            resetSlideTimer(); // Reset timer after manual navigation
        });
    }

    if (prevBtn) {
        // Remove any existing event listeners
        const newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);

        newPrevBtn.addEventListener('click', function() {
            prevSlide();
            resetSlideTimer(); // Reset timer after manual navigation
        });
    }

    // Pause auto slide on hover
    const heroSlider = document.querySelector('.hero-slider');
    if (heroSlider) {
        heroSlider.addEventListener('mouseenter', function() {
            pauseSlideTimer();
        });

        heroSlider.addEventListener('mouseleave', function() {
            resumeSlideTimer(); // Resume timer, don't reset
        });
    }
}