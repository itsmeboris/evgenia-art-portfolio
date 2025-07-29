// Admin Interface for Artwork Management

// Core Data Management
let artworkData = {
  categories: [],
  artworks: [],
  settings: {
    imagePath: 'public/assets/images/artwork/',
    currency: '₪',
  },
};

// Data Management Functions
function saveData() {
  console.log('🚀 Saving data to API...');

  // Try API save first, fallback to JSON download if needed
  saveToAPI()
    .then(() => {
      console.log('✅ Data saved successfully to database');
      showMessage('✅ Data saved successfully to database!', 'success');

      // Save to localStorage as backup
      localStorage.setItem('evgenia-artwork-data', JSON.stringify(artworkData));
    })
    .catch(error => {
      console.warn('⚠️ API save failed, falling back to JSON download:', error.message);
      showMessage('⚠️ API save failed, downloading JSON file as fallback', 'warning');

      // Fallback to original JSON download behavior
      downloadJSONFallback();
    });
}

// API save function
async function saveToAPI() {
  try {
    // Save all artworks via batch API
    const response = await fetch('/api/v1/admin/artworks/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        artworks: artworkData.artworks
      })
    });

    if (!response.ok) {
      throw new Error(`API error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Batch save result:', result);

    return result;
  } catch (error) {
    console.error('❌ API save error:', error);
    throw error;
  }
}

// Fallback JSON download function (original behavior)
function downloadJSONFallback() {
  // Create JSON content with proper formatting
  const dataStr = JSON.stringify(artworkData, null, 2);

  // Create a Blob with the JSON data
  const blob = new Blob([dataStr], { type: 'application/json' });

  // Create a temporary download link
  const a = document.createElement('a');
  a.download = 'artwork-data.json';
  a.href = URL.createObjectURL(blob);
  a.textContent = 'Download artwork-data.json';
  a.style.display = 'none';

  // Display instructions for manually saving the file
  const instructionsDiv = document.createElement('div');
  instructionsDiv.className = 'save-instructions';
  instructionsDiv.innerHTML = `
        <div class="modal-like">
            <h3>Save Changes</h3>
            <p>API save failed. Please download the updated JSON file and replace the existing one at:</p>
            <code>public/data/artwork-data.json</code>
            <p>After replacing the file, refresh the page to see your changes.</p>
            <div class="button-container">
                <button class="btn" id="close-instructions">OK</button>
            </div>
        </div>
    `;

  document.body.appendChild(instructionsDiv);
  document.body.appendChild(a);

  // Add click event to close instructions
  document.getElementById('close-instructions').addEventListener('click', function () {
    instructionsDiv.remove();
  });

  // Trigger click on the download link
  a.click();

  // Cleanup
  setTimeout(() => {
    a.remove();
  }, 1000);

  // Also save to localStorage as a backup
  localStorage.setItem('evgenia-artwork-data', JSON.stringify(artworkData));

  return Promise.resolve(true);
}

function loadData() {
  console.log('🚀 Loading data from API...');

  // API-FIRST APPROACH: Try to fetch from API first, fallback to JSON
  return fetch('/api/v1/artworks/all')
    .then(response => {
      console.log('✅ API Response status:', response.status);
      if (!response.ok) {
        throw new Error(`API error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('✅ API data loaded successfully:', data);

      if (!data || !data.categories || !data.artworks) {
        throw new Error('Invalid data structure from API');
      }

      artworkData = data;
      console.log('✅ Data loaded from API (database)');
      console.log('📊 Categories:', artworkData.categories.length);
      console.log('📊 Artworks:', artworkData.artworks.length);

      // Save to localStorage as backup
      localStorage.setItem('evgenia-artwork-data', JSON.stringify(artworkData));

      // Initialize the UI components with the loaded data
      renderArtworks();
      renderCategories();
      initDashboard();

      return true;
    })
    .catch(apiError => {
      console.warn('⚠️ API loading failed:', apiError.message);
      console.log('🔄 Falling back to JSON file...');

      // FALLBACK 1: Try JSON file if API fails
      return fetch('/public/data/artwork-data.json')
        .then(response => {
          console.log('📁 JSON Response status:', response.status);
          if (!response.ok) {
            throw new Error(`JSON error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('📁 JSON data loaded successfully');

          if (!data || !data.categories || !data.artworks) {
            throw new Error('Invalid data structure in JSON file');
          }

          artworkData = data;
          console.log('📁 Data loaded from JSON file (fallback)');
          console.log('📊 Categories:', artworkData.categories.length);
          console.log('📊 Artworks:', artworkData.artworks.length);

          // Save to localStorage as backup
          localStorage.setItem('evgenia-artwork-data', JSON.stringify(artworkData));

          // Initialize the UI components with the loaded data
          renderArtworks();
          renderCategories();
          initDashboard();

          return true;
        })
        .catch(jsonError => {
          console.warn('⚠️ JSON file loading failed:', jsonError.message);
          console.log('🔄 Falling back to localStorage...');

          // FALLBACK 2: Try localStorage if both API and JSON fail
          const savedData = localStorage.getItem('evgenia-artwork-data');
          if (savedData) {
            try {
              artworkData = JSON.parse(savedData);
              console.log('💾 Data loaded from localStorage (emergency fallback)');

              // Initialize the UI components with the loaded data
              renderArtworks();
              renderCategories();
              initDashboard();

              return true;
            } catch (e) {
              console.error('❌ Error parsing localStorage data:', e);
            }
          }

          // FALLBACK 3: Use default empty data
          console.error('❌ All data sources failed! Using default empty data.');
          artworkData = {
            artworks: [],
            categories: [],
            settings: { currency: '₪', imagePath: 'public/assets/images/artwork/' }
          };

          // Initialize with empty data
          renderArtworks();
          renderCategories();
          initDashboard();

          return false;
        });
    });
}

// UI Initialization Functions
function initTabs() {
  const tabLinks = document.querySelectorAll('.sidebar a[data-tab]');
  const tabContents = document.querySelectorAll('.tab-content');

  tabLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      // Remove active class from all tabs
      tabLinks.forEach(l => l.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Add active class to clicked tab
      this.classList.add('active');

      // Show related content
      const tabId = this.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Dashboard
function initDashboard() {
  // Update stats
  document.getElementById('total-artworks').textContent = artworkData.artworks.length;
  document.getElementById('total-categories').textContent = artworkData.categories.length;

  // Display featured artworks
  const featuredArtworks = artworkData.artworks.filter(artwork => artwork.featured);
  const featuredContainer = document.getElementById('featured-artworks');
  featuredContainer.innerHTML = '';

  featuredArtworks.forEach(artwork => {
    const artworkCard = createArtworkCard(artwork);
    featuredContainer.appendChild(artworkCard);
  });
}

// Create artwork card element
function createArtworkCard(artwork) {
  const card = document.createElement('div');
  card.className = 'artwork-card';
  card.dataset.id = artwork.id;

  const category = artworkData.categories.find(cat => cat.id === artwork.category);
  const categoryName = category ? category.name : artwork.category;

  // Fix image path - remove "../" prefix if it exists
  const imagePath = artwork.image.startsWith('../') ? artwork.image.substring(3) : artwork.image;

  card.innerHTML = `
        <div class="artwork-image">
            <img src="/${imagePath}" alt="${artwork.title}" onerror="this.src='/public/assets/images/placeholder.jpg';">
        </div>
        <div class="artwork-info">
            <h3>${artwork.title}</h3>
            <p>${artwork.dimensions} | ${artwork.medium}</p>
            <p>${artwork.price !== null && artwork.price !== undefined ? `${artworkData.settings.currency || '₪'}${artwork.price}` : 'Price on request'}</p>
            <div class="category-tag">${categoryName}</div>
            <div class="artwork-actions">
                <button class="btn btn-secondary edit-artwork" data-id="${artwork.id}">Edit</button>
                <button class="btn btn-danger delete-artwork" data-id="${artwork.id}">Delete</button>
            </div>
        </div>
    `;

  return card;
}

// Artwork Manager
function initArtworkManager() {
  renderArtworks();

  // Add event listeners
  document.getElementById('add-artwork-btn').addEventListener('click', openAddArtworkModal);
  document.getElementById('export-json-btn').addEventListener('click', exportData);
  document.getElementById('export-js-btn').addEventListener('click', exportJavaScriptFile);
  document.getElementById('import-json-btn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (file) {
        importData(file)
          .then(() => {
            renderArtworks();
            initDashboard();
            showMessage('Data imported successfully!', 'success');
          })
          .catch(error => showMessage(error, 'error'));
      }
    };
    input.click();
  });

  // Initialize artwork filter
  initArtworkFilter();

  // Initialize artwork form
  initArtworkForm();
}

// Render artworks in the grid
function renderArtworks(filteredArtworks = null) {
  const artworksToRender = filteredArtworks || artworkData.artworks;
  const container = document.getElementById('artwork-list');
  container.innerHTML = '';

  if (artworksToRender.length === 0) {
    container.innerHTML = '<p class="no-results">No artworks found.</p>';
    return;
  }

  artworksToRender.forEach(artwork => {
    const card = createArtworkCard(artwork);
    container.appendChild(card);
  });

  // Add edit and delete event listeners
  document.querySelectorAll('.edit-artwork').forEach(btn => {
    btn.addEventListener('click', function () {
      const artworkId = this.getAttribute('data-id');
      openEditArtworkModal(artworkId);
    });
  });

  document.querySelectorAll('.delete-artwork').forEach(btn => {
    btn.addEventListener('click', function () {
      const artworkId = this.getAttribute('data-id');
      const artwork = artworkData.artworks.find(a => a.id === artworkId);

      if (confirm(`Are you sure you want to delete "${artwork.title}"?`)) {
        deleteArtwork(artworkId);
      }
    });
  });
}

// Delete artwork
function deleteArtwork(artworkId) {
  artworkData.artworks = artworkData.artworks.filter(a => a.id !== artworkId);
  saveData();
  renderArtworks();
  initDashboard();
  showMessage('Artwork deleted successfully!', 'success');
}

// Initialize artwork filter
function initArtworkFilter() {
  const categoryFilter = document.getElementById('category-filter');
  const searchInput = document.getElementById('search-artworks');

  // Populate category filter
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  artworkData.categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    categoryFilter.appendChild(option);
  });

  // Add event listeners
  categoryFilter.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', applyFilters);

  function applyFilters() {
    const category = categoryFilter.value;
    const searchTerm = searchInput.value.toLowerCase();

    let filteredArtworks = artworkData.artworks;

    // Apply category filter
    if (category !== 'all') {
      filteredArtworks = filteredArtworks.filter(artwork => artwork.category === category);
    }

    // Apply search filter
    if (searchTerm) {
      filteredArtworks = filteredArtworks.filter(
        artwork =>
          artwork.title.toLowerCase().includes(searchTerm) ||
          artwork.description.toLowerCase().includes(searchTerm)
      );
    }

    renderArtworks(filteredArtworks);
  }
}

// Initialize artwork form
function initArtworkForm() {
  const form = document.getElementById('artwork-form');
  const closeBtn = document.querySelector('#artwork-modal .close-modal');
  const categorySelect = document.getElementById('artwork-category');
  const subcategorySelect = document.getElementById('artwork-subcategory');

  // Populate category dropdown
  categorySelect.innerHTML = '';
  artworkData.categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });

  // Update subcategories when category changes
  categorySelect.addEventListener('change', function () {
    updateSubcategoryDropdown(this.value);
  });

  // Initial subcategory population
  updateSubcategoryDropdown(categorySelect.value);

  // Close modal
  closeBtn.addEventListener('click', function () {
    document.getElementById('artwork-modal').classList.remove('active');
  });

  // Form submission
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const artworkId = document.getElementById('artwork-id').value;
    const isEditing = !!artworkId;

    const artwork = {
      id: artworkId || generateId(document.getElementById('artwork-title').value),
      title: document.getElementById('artwork-title').value,
      category: document.getElementById('artwork-category').value,
      subcategory: document.getElementById('artwork-subcategory').value,
      dimensions: document.getElementById('artwork-dimensions').value,
      medium: document.getElementById('artwork-medium').value,
      price: (() => {
        const priceValue = document.getElementById('artwork-price').value.trim();
        return priceValue === '' ? null : parseFloat(priceValue) || null;
      })(),
      description: document.getElementById('artwork-description').value,
      image: document.getElementById('artwork-image').value,
      featured: document.getElementById('artwork-featured').checked,
    };

    if (isEditing) {
      // Update existing artwork
      const index = artworkData.artworks.findIndex(a => a.id === artworkId);
      if (index !== -1) {
        artworkData.artworks[index] = artwork;
      }
    } else {
      // Add new artwork
      artworkData.artworks.push(artwork);
    }

    saveData();
    renderArtworks();
    initDashboard();

    // Close modal
    document.getElementById('artwork-modal').classList.remove('active');

    showMessage(`Artwork ${isEditing ? 'updated' : 'added'} successfully!`, 'success');
  });

  // Update image path to use hyphens instead of spaces in the image title
  categorySelect.addEventListener('change', function () {
    const imageInput = document.getElementById('artwork-image');
    const selectedCategory = this.value;
    const imageTitle = document.getElementById('artwork-title').value;
    const formattedTitle = imageTitle.trim().toLowerCase().replace(/\s+/g, '-');
    imageInput.value = `public/assets/images/artwork/${selectedCategory}/${formattedTitle}.jpg`;
  });
}

function updateSubcategoryDropdown(categoryId) {
  const subcategorySelect = document.getElementById('artwork-subcategory');
  subcategorySelect.innerHTML = '<option value="">None</option>';

  const category = artworkData.categories.find(cat => cat.id === categoryId);
  if (category && category.subcategories) {
    for (const [value, text] of Object.entries(category.subcategories)) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      subcategorySelect.appendChild(option);
    }
  }
}

// Modal functions
function openAddArtworkModal() {
  const modal = document.getElementById('artwork-modal');
  const form = document.getElementById('artwork-form');

  // Set modal title
  document.getElementById('artwork-modal-title').textContent = 'Add New Artwork';

  // Clear form
  form.reset();
  document.getElementById('artwork-id').value = '';

  // Set default category
  const categorySelect = document.getElementById('artwork-category');
  if (categorySelect.options.length > 0) {
    categorySelect.value = categorySelect.options[0].value;
    updateSubcategoryDropdown(categorySelect.value);
  }

  // Show modal
  modal.classList.add('active');
}

function openEditArtworkModal(artworkId) {
  const artwork = artworkData.artworks.find(a => a.id === artworkId);
  if (!artwork) return;

  const modal = document.getElementById('artwork-modal');

  // Set modal title
  document.getElementById('artwork-modal-title').textContent = 'Edit Artwork';

  // Fill form with artwork data
  document.getElementById('artwork-id').value = artwork.id;
  document.getElementById('artwork-title').value = artwork.title;
  document.getElementById('artwork-category').value = artwork.category;
  updateSubcategoryDropdown(artwork.category);
  document.getElementById('artwork-subcategory').value = artwork.subcategory || '';
  document.getElementById('artwork-dimensions').value = artwork.dimensions;
  document.getElementById('artwork-medium').value = artwork.medium;
  document.getElementById('artwork-price').value =
    artwork.price !== null && artwork.price !== undefined ? artwork.price : '';
  document.getElementById('artwork-description').value = artwork.description;
  document.getElementById('artwork-image').value = artwork.image;
  document.getElementById('artwork-featured').checked = artwork.featured;

  // Show modal
  modal.classList.add('active');
}

// Helper Functions
function generateId(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function showMessage(text, type) {
  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.textContent = text;

  document.querySelector('.content').prepend(message);

  setTimeout(() => {
    message.remove();
  }, 3000);
}

// Generate frontend-ready data
function generateFrontendData() {
  const frontendData = {
    artworks: artworkData.artworks.map(artwork => ({
      id: artwork.id,
      title: artwork.title,
      category: artwork.category,
      dimensions: artwork.dimensions,
      medium: artwork.medium,
      price: artwork.price,
      description: artwork.description,
      image: artwork.image,
      featured: artwork.featured,
    })),
    collections: artworkData.categories.map(category => ({
      id: category.id,
      title: category.name,
      description: category.description,
      image: category.image,
    })),
  };

  return frontendData;
}

// Export data as JSON file
function exportData() {
  // Create JSON content with proper formatting
  const dataStr = JSON.stringify(artworkData, null, 2);

  // Create a Blob with the JSON data
  const blob = new Blob([dataStr], { type: 'application/json' });

  // Create a download link
  const a = document.createElement('a');
  a.download = 'artwork-data.json';
  a.href = URL.createObjectURL(blob);
  a.click();
}

// Export JavaScript file with embedded data
function exportJavaScriptFile() {
  const frontendData = generateFrontendData();

  // Create JavaScript content with embedded data
  const jsContent = `// Artwork Loader - Dynamically loads artwork data from embedded JSON

document.addEventListener('DOMContentLoaded', function() {
    try {
        // Use embedded artwork data instead of fetching from a file
        const artworkData = ${JSON.stringify(frontendData, null, 2)};

        // Initialize all artwork components
        initGalleryGrid(artworkData);
        initLatestArtwork(artworkData);
        initFeaturedCollections(artworkData);
    } catch (error) {
        console.error('Error loading artwork data:', error);
        displayErrorMessage('Failed to load artwork data. Please try refreshing the page.');
    }
});`;

  // Create downloadable file
  const blob = new Blob([jsContent], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'artwork-loader.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showMessage(
    "JavaScript file with embedded data exported successfully! You'll need to update your existing artwork-loader.js file with this new data.",
    'success'
  );
}

// Import data from a JSON file
function importData(jsonFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const newData = JSON.parse(e.target.result);

        // Validate the data structure
        if (!newData.categories || !newData.artworks) {
          throw new Error(
            'Invalid data structure. JSON must contain categories and artworks arrays.'
          );
        }

        artworkData = newData;
        saveData().then(() => {
          resolve(newData);
        });
      } catch (e) {
        reject(e);
      }
    };

    reader.onerror = function () {
      reject(new Error('Failed to read the file'));
    };

    reader.readAsText(jsonFile);
  });
}

// Category Manager
function initCategoryManager() {
  renderCategories();

  // Add event listeners
  document.getElementById('add-category-btn').addEventListener('click', openAddCategoryModal);

  // Initialize category form
  initCategoryForm();
}

// Render categories in the list
function renderCategories() {
  const container = document.getElementById('category-list');
  container.innerHTML = '';

  console.log('Rendering categories:', artworkData.categories);

  if (!artworkData.categories || artworkData.categories.length === 0) {
    container.innerHTML =
      '<p class="no-results">No categories found. Add your first category using the "Add Category" button above.</p>';
    return;
  }

  artworkData.categories.forEach(category => {
    const categoryItem = document.createElement('li');
    categoryItem.className = 'category-item';

    // Count artworks in this category
    const artworkCount = artworkData.artworks.filter(a => a.category === category.id).length;

    categoryItem.innerHTML = `
            <div>
                <strong>${category.name}</strong>
                <span>(${artworkCount} artworks)</span>
            </div>
            <div class="category-item-actions">
                <button class="btn btn-secondary edit-category" data-id="${category.id}">Edit</button>
                <button class="btn btn-danger delete-category" data-id="${category.id}">Delete</button>
            </div>
        `;

    container.appendChild(categoryItem);
  });

  // Add edit and delete event listeners
  document.querySelectorAll('.edit-category').forEach(btn => {
    btn.addEventListener('click', function () {
      const categoryId = this.getAttribute('data-id');
      openEditCategoryModal(categoryId);
    });
  });

  document.querySelectorAll('.delete-category').forEach(btn => {
    btn.addEventListener('click', function () {
      const categoryId = this.getAttribute('data-id');
      const category = artworkData.categories.find(c => c.id === categoryId);

      // Check if there are artworks using this category
      const artworksUsingCategory = artworkData.artworks.filter(a => a.category === categoryId);

      if (artworksUsingCategory.length > 0) {
        showMessage(
          `Cannot delete category "${category.name}" because it's used by ${artworksUsingCategory.length} artworks.`,
          'error'
        );
        return;
      }

      if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
        deleteCategory(categoryId);
      }
    });
  });
}

// Delete category
function deleteCategory(categoryId) {
  artworkData.categories = artworkData.categories.filter(c => c.id !== categoryId);
  saveData();
  renderCategories();
  initArtworkForm(); // Update artwork form dropdowns
  initDashboard(); // Update statistics
  showMessage('Category deleted successfully!', 'success');
}

// Initialize category form
function initCategoryForm() {
  const form = document.getElementById('category-form');
  const closeBtn = document.querySelector('#category-modal .close-modal');
  const addSubcategoryBtn = document.getElementById('add-subcategory-btn');

  // Close modal
  closeBtn.addEventListener('click', function () {
    document.getElementById('category-modal').classList.remove('active');
  });

  // Add subcategory
  addSubcategoryBtn.addEventListener('click', function () {
    addSubcategoryField();
  });

  // Form submission
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const categoryId = document.getElementById('category-id').value;
    const isEditing = !!categoryId;

    // Gather subcategories
    const subcategories = {};
    const subcategoryItems = document.querySelectorAll('.subcategory-item');

    subcategoryItems.forEach(item => {
      const key = item.querySelector('.subcategory-key').value.trim();
      const value = item.querySelector('.subcategory-value').value.trim();

      if (key && value) {
        subcategories[key] = value;
      }
    });

    const category = {
      id: categoryId || generateId(document.getElementById('category-name').value),
      name: document.getElementById('category-name').value,
      slug: document.getElementById('category-slug').value,
      description: document.getElementById('category-description').value,
      image: document.getElementById('category-image').value,
      subcategories: subcategories,
    };

    if (isEditing) {
      // Update existing category
      const index = artworkData.categories.findIndex(c => c.id === categoryId);
      if (index !== -1) {
        artworkData.categories[index] = category;
      }
    } else {
      // Add new category
      artworkData.categories.push(category);
    }

    saveData();
    renderCategories();
    initArtworkForm(); // Update artwork form dropdowns
    initDashboard(); // Update statistics

    // Close modal
    document.getElementById('category-modal').classList.remove('active');

    showMessage(`Category ${isEditing ? 'updated' : 'added'} successfully!`, 'success');
  });
}

// Add a new subcategory field
function addSubcategoryField(key = '', value = '') {
  const container = document.getElementById('subcategories-container');
  const subcategoryItem = document.createElement('div');
  subcategoryItem.className = 'subcategory-item';

  subcategoryItem.innerHTML = `
        <input type="text" class="subcategory-key" placeholder="Key (e.g. roses)" value="${key}">
        <input type="text" class="subcategory-value" placeholder="Display Name (e.g. Roses and Bouquets)" value="${value}">
        <button type="button" class="subcategory-remove">&times;</button>
    `;

  container.appendChild(subcategoryItem);

  // Add remove button event listener
  subcategoryItem.querySelector('.subcategory-remove').addEventListener('click', function () {
    container.removeChild(subcategoryItem);
  });
}

// Modal functions for categories
function openAddCategoryModal() {
  const modal = document.getElementById('category-modal');
  const form = document.getElementById('category-form');

  // Set modal title
  document.getElementById('category-modal-title').textContent = 'Add New Category';

  // Clear form
  form.reset();
  document.getElementById('category-id').value = '';

  // Clear subcategories
  document.getElementById('subcategories-container').innerHTML = '';

  // Show modal
  modal.classList.add('active');
}

function openEditCategoryModal(categoryId) {
  const category = artworkData.categories.find(c => c.id === categoryId);
  if (!category) return;

  const modal = document.getElementById('category-modal');

  // Set modal title
  document.getElementById('category-modal-title').textContent = 'Edit Category';

  // Fill form with category data
  document.getElementById('category-id').value = category.id;
  document.getElementById('category-name').value = category.name;
  document.getElementById('category-slug').value = category.slug;
  document.getElementById('category-description').value = category.description;
  document.getElementById('category-image').value = category.image;

  // Clear and populate subcategories
  document.getElementById('subcategories-container').innerHTML = '';

  if (category.subcategories) {
    Object.entries(category.subcategories).forEach(([key, value]) => {
      addSubcategoryField(key, value);
    });
  }

  // Show modal
  modal.classList.add('active');
}

// Batch Upload
function initBatchUpload() {
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('file-upload');
  const previewContainer = document.getElementById('upload-preview');

  // Initialize batch category dropdown
  const batchCategorySelect = document.getElementById('batch-category');
  batchCategorySelect.innerHTML = '';

  artworkData.categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    batchCategorySelect.appendChild(option);
  });

  // Dropzone click event
  dropzone.addEventListener('click', function () {
    fileInput.click();
  });

  // File drop events
  dropzone.addEventListener('dragover', function (e) {
    e.preventDefault();
    this.classList.add('dropzone-active');
  });

  dropzone.addEventListener('dragleave', function () {
    this.classList.remove('dropzone-active');
  });

  dropzone.addEventListener('drop', function (e) {
    e.preventDefault();
    this.classList.remove('dropzone-active');

    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });

  // File input change event
  fileInput.addEventListener('change', function () {
    if (this.files.length > 0) {
      handleFiles(this.files);
    }
  });

  // Handle uploaded files
  function handleFiles(files) {
    previewContainer.innerHTML = '';

    // Create a form for batch processing
    const batchForm = document.createElement('form');
    batchForm.id = 'batch-upload-form';
    batchForm.className = 'batch-form';

    // Add each file to the preview
    Array.from(files).forEach((file, index) => {
      // Only process image files
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();

      reader.onload = function (e) {
        const previewItem = document.createElement('div');
        previewItem.className = 'upload-preview-item';

        // Generate filename-based ID
        const baseFilename = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        const defaultId = generateId(baseFilename);

        previewItem.innerHTML = `
                    <img src="${e.target.result}" class="upload-preview-image" alt="Preview">
                    <div class="upload-preview-info">
                        <div class="form-group">
                            <label>Title</label>
                            <input type="text" name="title-${index}" value="${baseFilename.replace(/-/g, ' ').replace(/_/g, ' ')}" class="batch-title">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Category</label>
                                <select name="category-${index}" class="batch-item-category">
                                    ${artworkData.categories
                                      .map(
                                        cat =>
                                          `<option value="${cat.id}" ${cat.id === batchCategorySelect.value ? 'selected' : ''}>${cat.name}</option>`
                                      )
                                      .join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Subcategory</label>
                                <select name="subcategory-${index}" class="batch-item-subcategory">
                                    <option value="">None</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Dimensions</label>
                                <input type="text" name="dimensions-${index}" placeholder="e.g. 16&quot; x 20&quot;" class="batch-dimensions">
                            </div>
                            <div class="form-group">
                                <label>Medium</label>
                                <input type="text" name="medium-${index}" value="${document.getElementById('batch-medium').value}" class="batch-medium">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Price</label>
                            <input type="text" name="price-${index}" placeholder="e.g. $350" class="batch-price">
                        </div>
                        <div class="form-group">
                            <label>Image Path</label>
                            <input type="text" name="image-${index}" value="${artworkData.settings.imagePath}${batchCategorySelect.value}/${file.name}" class="batch-image">
                        </div>
                        <input type="hidden" name="file-${index}" value="${file.name}">
                    </div>
                `;

        previewContainer.appendChild(previewItem);

        // Update subcategory dropdown
        const categorySelect = previewItem.querySelector('.batch-item-category');
        const subcategorySelect = previewItem.querySelector('.batch-item-subcategory');

        updateBatchSubcategoryDropdown(categorySelect.value, subcategorySelect);

        // Add event listener for category change
        categorySelect.addEventListener('change', function () {
          updateBatchSubcategoryDropdown(this.value, subcategorySelect);

          // Update image path based on new category
          const imageInput = previewItem.querySelector('.batch-image');
          imageInput.value = `${artworkData.settings.imagePath}${this.value}/${file.name}`;
        });
      };

      reader.readAsDataURL(file);
    });

    // Add submit button for all items
    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = 'btn';
    submitBtn.textContent = 'Add All Artworks';
    submitBtn.addEventListener('click', processBatchUpload);

    previewContainer.appendChild(submitBtn);
  }

  // Update batch subcategory dropdown
  function updateBatchSubcategoryDropdown(categoryId, subcategorySelect) {
    subcategorySelect.innerHTML = '<option value="">None</option>';

    const category = artworkData.categories.find(cat => cat.id === categoryId);
    if (category && category.subcategories) {
      for (const [value, text] of Object.entries(category.subcategories)) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        subcategorySelect.appendChild(option);
      }
    }
  }

  // Process the batch upload
  function processBatchUpload() {
    const previewItems = document.querySelectorAll('.upload-preview-item');
    let newArtworks = [];

    previewItems.forEach((item, index) => {
      const title = item.querySelector('.batch-title').value;
      const category = item.querySelector('.batch-item-category').value;
      const subcategory = item.querySelector('.batch-item-subcategory').value;
      const dimensions = item.querySelector('.batch-dimensions').value;
      const medium = item.querySelector('.batch-medium').value;
      const price = item.querySelector('.batch-price').value;
      const image = item.querySelector('.batch-image').value;

      // Only process items with at least a title
      if (title) {
        const artwork = {
          id: generateId(title),
          title: title,
          category: category,
          subcategory: subcategory || '',
          dimensions: dimensions || '',
          medium: medium || 'Acrylic on Canvas',
          price: (() => {
            const priceValue = price.trim();
            return priceValue === '' ? null : parseFloat(priceValue) || null;
          })(),
          description: '',
          image: image,
          featured: false,
        };

        newArtworks.push(artwork);
      }
    });

    if (newArtworks.length > 0) {
      // Add the new artworks to the collection
      artworkData.artworks = [...artworkData.artworks, ...newArtworks];
      saveData();

      // Clear preview
      previewContainer.innerHTML = '';

      // Update other sections
      renderArtworks();
      initDashboard();

      showMessage(`${newArtworks.length} artworks added successfully!`, 'success');
    } else {
      showMessage('No valid artworks to add.', 'error');
    }
  }
}

// Settings Manager
function initSettings() {
  const saveBtn = document.getElementById('save-settings-btn');
  const backupBtn = document.getElementById('backup-json-btn');
  const imageBasePath = document.getElementById('image-base-path');
  const defaultCurrency = document.getElementById('default-currency');

  // Load current settings
  imageBasePath.value = artworkData.settings.imagePath;
  defaultCurrency.value = artworkData.settings.currency;

  // Save settings
  saveBtn.addEventListener('click', function () {
    artworkData.settings.imagePath = imageBasePath.value;
    artworkData.settings.currency = defaultCurrency.value;

    saveData();
    showMessage('Settings saved successfully!', 'success');
  });

  // Backup data
  if (backupBtn) {
    backupBtn.addEventListener('click', function (e) {
      e.preventDefault();
      exportData();
      showMessage('Backup file has been downloaded.', 'success');
    });
  }
}

// Initialize the admin interface
document.addEventListener('DOMContentLoaded', function () {
  // Initialize tabs first
  initTabs();

  // Load data and then initialize the rest of the UI
  loadData()
    .then(success => {
      if (!success) {
        showMessage('Failed to load artwork data. Using default empty data.', 'error');
      }

      // Initialize the UI components
      initArtworkManager();
      initCategoryManager();
      initBatchUpload();
      initSettings();
    })
    .catch(error => {
      console.error('Error during initialization:', error);
      showMessage('Error initializing the application. See console for details.', 'error');
    });
});
