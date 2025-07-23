# Evgenia Portnov | Artist Portfolio & E-commerce Website

This is a modern, responsive portfolio and e-commerce website for artist Evgenia Portnov. The site showcases her artwork while providing a seamless shopping experience through Shopify integration.

## Project Overview

The website features:

- A clean, elegant design with a turquoise color scheme
- Responsive layout that works on all devices (mobile, tablet, desktop)
- Gallery with filtering by artwork categories (Floral, Towns, Birds)
- About page that tells Evgenia's artistic journey
- Contact page with a form and FAQs
- Shopify integration for e-commerce functionality

## Project Structure

```
/
├── index.html               # Homepage
├── about.html               # About page
├── gallery.html             # Gallery/Shop page
├── contact.html             # Contact page
├── public/                  # Public assets
│   ├── css/                 # CSS files
│   │   └── style.css        # Main stylesheet
│   ├── js/                  # JavaScript files
│   │   └── main.js          # Main JavaScript file
│   └── assets/              # Other assets
│       └── images/          # Image files
└── README.md                # This file
```

## Shopify Integration

To fully integrate with Shopify, you'll need to:

1. Create a Shopify store if you don't have one already
2. Replace placeholder product data with actual Shopify products
3. Implement the Shopify Buy Button or Shopping Cart API

### Option 1: Shopify Buy Button

1. Log in to your Shopify admin dashboard
2. Go to Sales Channels > Buy Button
3. Create a new Buy Button for each product or collection
4. Copy the generated code and replace the placeholder buttons in the HTML

### Option 2: Shopify JavaScript Buy SDK

For a more customized integration, use the Shopify JavaScript Buy SDK:

1. Install the SDK: `npm install shopify-buy`
2. Initialize the client with your shop's domain and Storefront API access token
3. Use the SDK to fetch products and handle cart functionality

Example implementation:

```javascript
// Initialize the client
const client = ShopifyBuy.buildClient({
  domain: 'your-shop-name.myshopify.com',
  storefrontAccessToken: 'your-storefront-access-token'
});

// Fetch all products
client.product.fetchAll().then((products) => {
  // Do something with the products
});

// Create a cart
client.checkout.create().then((checkout) => {
  // Do something with the checkout
});
```

## Customization

### Adding New Artwork

1. Add the artwork image to `/public/assets/images/`
2. Add a new artwork item to the gallery grid in `gallery.html`
3. Set the appropriate data category (floral, towns, birds)

### Changing Colors

To change the color scheme, edit the CSS variables in `public/css/style.css`:

```css
:root {
    /* Colors */
    --primary-color: #40E0D0; /* Turquoise as primary accent color */
    --primary-dark: #2fb3a8;
    --primary-light: #6bece0;
    /* ... other colors ... */
}
```

### Adding Pages

To add a new page:

1. Create a new HTML file with the same structure as existing pages
2. Update the navigation links in all pages to include the new page
3. Add the page's specific content and styles

## Development

To run this project locally:

1. Clone the repository
2. Open the project in your code editor
3. Use a local server to view the website (like VS Code's Live Server extension)

## Deployment

To deploy this website:

1. Upload all files to your web hosting server
2. Ensure your domain name points to the correct hosting location
3. Configure any necessary server settings (like HTTPS)

## Credits

- Design inspiration: [Mariella Paints](https://mariellapaints.com/)
- Fonts: [Google Fonts](https://fonts.google.com/) (Cormorant Garamond & Montserrat)
- Icons: [Font Awesome](https://fontawesome.com/)

## License

All rights reserved. This website and its content belong to Evgenia Portnov.

## Running Locally

To avoid CORS issues with local files, use the included Node.js server:

1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Open a terminal in this directory
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm start
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

The website will be available at http://localhost:3000, and the admin panel at http://localhost:3000/admin/

## Accessing Your Site

### Local Network Access
The server is configured to listen on all network interfaces, so you can access it from other devices on your local network:

1. Start the server:
   ```
   npm start
   ```
2. Look for the local network URL in the console output, which will show something like:
   ```
   You can also access this site from other devices on your network:
   http://192.168.1.93:3000
   ```
3. Use that URL on any device connected to the same network

### Remote Access with ngrok
To make your locally running website accessible from anywhere on the internet:

1. Install ngrok:
   ```
   npm install -g ngrok
   ```

2. Sign up for a free account at [ngrok.com](https://dashboard.ngrok.com/signup)

3. Add your authtoken (you only need to do this once):
   ```
   ngrok authtoken YOUR_AUTH_TOKEN
   ```

4. Start your website (in one terminal):
   ```
   npm start
   ```

5. Start the ngrok tunnel (in a second terminal):
   ```
   ngrok http 3000
   ```

6. Ngrok will display a public URL (like `https://abc123.ngrok.io`) that you can use to access your site from anywhere

**Note:** 
- Both the server and ngrok need to be running simultaneously
- Free ngrok URLs change each time you restart ngrok
- Anyone with the ngrok URL can access your site

## File Structure

- `index.html` - Main website home page
- `gallery.html` - Artwork gallery page
- `public/` - Contains all assets (images, CSS, JS)
  - `public/data/artwork-data.json` - Central data file for all artwork
- `admin/` - Admin interface for managing artwork
  - `admin/index.html` - Admin panel
  - `admin/README.md` - Admin documentation

## Content Management

All artwork data is stored in a single JSON file at `public/data/artwork-data.json`. Both the main website and admin panel read from and write to this file. 