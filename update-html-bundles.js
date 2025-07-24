// Helper script to update HTML files with webpack bundle references
const fs = require('fs');
const path = require('path');

// Get the latest bundle filenames from the dist directory
function getBundleFiles() {
    const distDir = path.join(__dirname, 'public', 'dist', 'js');
    const files = fs.readdirSync(distDir);
    
    const bundles = {};
    files.forEach(file => {
        if (file.endsWith('.min.js') && !file.endsWith('.map')) {
            const bundleName = file.split('.')[0];
            bundles[bundleName] = `/public/dist/js/${file}`;
        }
    });
    
    return bundles;
}

// Update HTML file with new script tags
function updateHtmlFile(filePath, bundlesToInclude) {
    const content = fs.readFileSync(filePath, 'utf8');
    const bundles = getBundleFiles();
    
    // Generate script tags for the bundles
    const scriptTags = bundlesToInclude.map(bundleName => {
        if (bundles[bundleName]) {
            return `        <script src="${bundles[bundleName]}"></script>`;
        }
        return '';
    }).filter(tag => tag).join('\n');
    
    // Replace the old script section with new bundle script tags
    const oldScriptPattern = /<!-- Module Scripts -->[\s\S]*?<!-- End Module Scripts -->/;
    const newScriptSection = `<!-- Module Scripts -->
${scriptTags}
        <!-- End Module Scripts -->`;
    
    const updatedContent = content.replace(oldScriptPattern, newScriptSection);
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    console.log(`✅ Updated ${filePath} with bundles: ${bundlesToInclude.join(', ')}`);
}

// Main execution
console.log('🔄 Updating HTML files with webpack bundles...');

const bundles = getBundleFiles();
console.log('📦 Available bundles:', Object.keys(bundles).join(', '));

// Update each HTML file with appropriate bundles
console.log('\n📝 HTML files will need to be updated manually for now...');
console.log('Available bundle files:');
Object.entries(bundles).forEach(([name, path]) => {
    console.log(`  ${name}: ${path}`);
});

console.log('\n🎯 Next steps:');
console.log('1. Update HTML files to use these script tags instead of individual module scripts');
console.log('2. Run npm start to test the bundled version');
console.log('3. Use npm run build for production bundles');