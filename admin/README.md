# Artwork Management System

This admin panel allows you to manage all artwork for Evgenia Portnov's website through a central JSON data source.

## Architecture

The system uses a simple but effective architecture:

1. **Central Data Source**: All artwork data is stored in a single JSON file at `public/data/artwork-data.json`
2. **Admin Panel**: The admin interface reads from and writes to this JSON file
3. **Frontend Website**: The main website reads from the same JSON file

This approach eliminates data duplication and synchronization issues between the admin and frontend.

## How To Use

### Editing Artwork

1. Open the admin panel at `admin/index.html`
2. Make your changes to artworks, categories, or settings
3. Click Save (or perform any action that saves data)
4. When prompted, download the `artwork-data.json` file
5. Replace the existing file at `public/data/artwork-data.json` with the downloaded file
6. Refresh the page to see your changes

### Backing Up Your Data

You can export a backup of your data at any time by clicking the "Export" button in the Artworks tab. This will download a copy of your artwork data.

### Importing Data

If you have a backup or want to import data from another source:

1. Click the "Import" button in the Artworks tab
2. Select your JSON file
3. After import, follow the save steps above to update the central JSON file

## Data Structure

The JSON file uses the following structure:

```json
{
  "artworks": [
    {
      "id": "unique-id",
      "title": "Artwork Title",
      "category": "category-id",
      "subcategory": "subcategory-id",
      "dimensions": "Size",
      "medium": "Medium",
      "price": "Price",
      "description": "Description",
      "image": "path/to/image.jpg",
      "featured": true/false
    }
  ],
  "categories": [
    {
      "id": "category-id",
      "name": "Category Name",
      "slug": "category-slug",
      "description": "Category Description",
      "image": "path/to/category-image.jpg",
      "subcategories": {
        "subcategory-id": "Subcategory Name"
      }
    }
  ],
  "settings": {
    "imagePath": "public/assets/images/artwork/",
    "currency": "$"
  }
}
```

## Troubleshooting

If the admin panel can't load the data from the JSON file, it will fall back to using data from localStorage. If no data is available in either place, it will start with empty data.

If you encounter any issues, check the browser console for error messages.
