# Build Automation Scripts

## Complete Build Pipeline

### Overview

Comprehensive automated build system with code quality checks, formatting, linting, and HTML bundle updates.

## Pre-Build Quality Pipeline

### Overview

Automated quality checks that run before every build to ensure code cleanliness and consistency.

### Features

- **Format Check**: Verify code formatting with Prettier
- **Lint Check**: Check code quality with ESLint
- **Auto-Fix**: Automatically fix linting issues when possible
- **Re-Format**: Apply formatting after lint fixes
- **Smart Skipping**: Skip unnecessary steps when no issues found

### Files

- `pre-build-quality.js` - Main quality pipeline script

## HTML Bundle Automation

### Overview

Automated system to update HTML files with correct webpack bundle references after each build.

### Files

- `update-html-bundles.js` - Main script that reads webpack manifest and updates HTML files
- `webpack-html-updater-plugin.js` - Webpack plugin that automatically runs the updater after production builds

### Usage

#### Full Automated Build (Recommended)

The complete pipeline runs automatically with one command:

```bash
npm run build  # Quality checks + webpack build + HTML bundle updates
```

#### Manual Steps

You can run individual parts of the pipeline:

```bash
npm run build:clean    # Run quality pipeline only
npm run build:quick    # Skip quality checks, just build
npm run update-bundles # Update HTML bundles manually
npm run build:full     # Build + manual update (redundant but available)
```

#### Development Commands

For development work:

```bash
npm run build:dev    # Development build (no quality checks)
npm run build:watch  # Watch mode for development
```

### How It Works

1. **Quality Pipeline**: Runs format checks, linting, and auto-fixes before build
2. **Webpack Build**: Generates bundles with content hashes (e.g., `main.abc123.min.js`)
3. **Manifest Generation**: `WebpackManifestPlugin` creates `public/dist/manifest.json` with bundle mappings
4. **HTML Update**: `HtmlBundleUpdater` reads the manifest and updates HTML files
5. **Automatic Trigger**: `WebpackHtmlUpdaterPlugin` triggers the updater after production builds

### Quality Pipeline Steps

1. **Initial Format Check**: Verify code formatting with Prettier
2. **Lint Check**: Check code quality with ESLint
3. **Auto-Fix**: Fix linting issues automatically if needed
4. **Re-check Format**: Ensure formatting is still correct after lint fixes
5. **Final Format**: Apply formatting if needed after lint changes

### Configuration

The HTML bundle configuration is in `update-html-bundles.js`:

```javascript
this.htmlConfigs = [
  {
    file: 'index.html',
    bundles: ['common', 'lightbox', 'search', 'main'],
    comment: 'Webpack Bundles - Optimized and minified',
  },
  {
    file: 'artwork.html',
    bundles: ['common', 'lightbox', 'search', 'artwork'],
    comment: 'Webpack Bundles - Artwork specific bundle',
  },
  // ... more configurations
];
```

### Benefits

✅ **No More Manual Updates**: Bundle hashes automatically updated in HTML files
✅ **Production Ready**: Only runs during production builds (not development)
✅ **Error Handling**: Comprehensive error checking and reporting
✅ **Backup Compatible**: Falls back gracefully if manifest is missing
✅ **Clean Replacement**: Removes old bundle references and adds new ones

### Troubleshooting

**Bundle not found in manifest:**

- Ensure the bundle name matches the webpack entry point
- Check that webpack build completed successfully
- Verify `public/dist/manifest.json` exists and contains the expected bundles

**HTML file not updated:**

- Check file permissions
- Ensure the HTML file exists at the expected path
- Look for error messages in the console output

**Duplicate script tags:**

- This was an issue in early versions but is now fixed
- The updater removes all old bundle references before adding new ones

### Legacy Support

The old `update-html-bundles.js` script in the root directory is deprecated but still works - it redirects to the new automated system.
