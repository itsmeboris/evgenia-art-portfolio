/**
 * Development vs Production Script Loader
 * Automatically loads raw JS files in development, bundled files in production
 */

(function () {
  const isDevelopment =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.hostname === '' ||
    location.port === '3000';

  function loadScript(src) {
    document.write('<script src="' + src + '"><\/script>');
  }

  if (isDevelopment) {
    console.log(
      '🔧 Development mode: Loading bundled files (raw module loading disabled for stability)'
    );

    // For now, load bundled files even in development to avoid complex module dependency issues
    // The admin panel still gets the benefit of raw file loading for faster iteration
    loadScript('/public/dist/js/common.js');
    loadScript('/public/dist/js/lightbox.js');
    loadScript('/public/dist/js/search.js');
    loadScript('/public/dist/js/main.js');
  } else {
    console.log('🚀 Production mode: Loading bundled JavaScript files');

    // Load bundled/minified versions
    loadScript('/public/dist/js/common.6b7e27005636b61addd2.min.js');
    loadScript('/public/dist/js/lightbox.bf4274a9974dfb151230.min.js');
    loadScript('/public/dist/js/search.c7a336f5491da5aae2e0.min.js');
    loadScript('/public/dist/js/main.ab715a24d2c38fdcdc37.min.js');
  }
})();
