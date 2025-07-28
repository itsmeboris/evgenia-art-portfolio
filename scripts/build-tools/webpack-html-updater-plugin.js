// Custom Webpack Plugin to automatically update HTML files after build
const HtmlBundleUpdater = require('./update-html-bundles');

class WebpackHtmlUpdaterPlugin {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      ...options,
    };
  }

  apply(compiler) {
    if (!this.options.enabled) {
      return;
    }

    compiler.hooks.afterEmit.tapAsync('WebpackHtmlUpdaterPlugin', (compilation, callback) => {
      // Only run in production mode or if explicitly enabled
      const isProduction = compiler.options.mode === 'production';

      if (isProduction || this.options.alwaysRun) {
        console.log('\n🔄 Auto-updating HTML files with new bundles...');

        try {
          const updater = new HtmlBundleUpdater();
          const success = updater.updateAllFiles();

          if (success) {
            console.log('✅ HTML bundle update completed successfully\n');
          } else {
            console.warn('⚠️  HTML bundle update completed with warnings\n');
          }
        } catch (error) {
          console.error('❌ HTML bundle update failed:', error.message);
          console.error('You can manually run: npm run update-bundles\n');
        }
      }

      callback();
    });
  }
}

module.exports = WebpackHtmlUpdaterPlugin;
