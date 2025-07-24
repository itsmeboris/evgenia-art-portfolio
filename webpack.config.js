const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const WebpackHtmlUpdaterPlugin = require('./scripts/webpack-html-updater-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',

    // Entry points for different bundles
    entry: {
      // Main bundle for all pages
      main: './src/js/main.js',

      // Artwork detail page specific bundle
      artwork: './src/js/artwork-entry.js',

      // Admin panel bundle
      admin: './admin/js/admin.js',

      // Critical modules bundle (core functionality)
      core: './src/js/core-entry.js',
    },

    output: {
      path: path.resolve(__dirname, 'public/dist'),
      filename: isProduction ? 'js/[name].[contenthash].min.js' : 'js/[name].js',
      chunkFilename: isProduction ? 'js/[name].[contenthash].chunk.js' : 'js/[name].chunk.js',
      clean: true,
      publicPath: '/public/dist/',
    },

    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction,
              pure_funcs: isProduction ? ['console.log', 'console.info', 'console.warn'] : [],
            },
            mangle: {
              safari10: true,
            },
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin(),
      ],

      // Code splitting configuration
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },

          // Common modules used across multiple entry points
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
            chunks: 'all',
          },

          // Large modules that should be split
          lightbox: {
            test: /lightbox\.js$/,
            name: 'lightbox',
            priority: 20,
            reuseExistingChunk: true,
          },

          search: {
            test: /search\.js$/,
            name: 'search',
            priority: 20,
            reuseExistingChunk: true,
          },
        },
      },
    },

    module: {
      rules: [
        // JavaScript files
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      browsers: ['> 1%', 'last 2 versions', 'not ie <= 8'],
                    },
                    modules: false,
                  },
                ],
              ],
            },
          },
        },

        // CSS files
        {
          test: /\.css$/,
          use: [isProduction ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader'],
        },
      ],
    },

    plugins: [
      // Extract CSS into separate files
      new MiniCssExtractPlugin({
        filename: isProduction ? 'css/[name].[contenthash].min.css' : 'css/[name].css',
        chunkFilename: isProduction ? 'css/[name].[contenthash].chunk.css' : 'css/[name].chunk.css',
      }),

      // Generate manifest file for bundle tracking
      new WebpackManifestPlugin({
        fileName: 'manifest.json',
        publicPath: '/public/dist/',
        filter: file => file.isInitial && file.name.endsWith('.js'),
        map: file => {
          // Clean up the file names for easier mapping
          file.name = file.name.replace(/\.[^.]+\./, '.').replace('.min.js', '');
          return file;
        },
      }),

      // Automatically update HTML files after build
      new WebpackHtmlUpdaterPlugin({
        enabled: true,
        alwaysRun: false, // Only run in production builds
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@modules': path.resolve(__dirname, 'src/js/modules'),
        '@css': path.resolve(__dirname, 'public/css'),
        '@data': path.resolve(__dirname, 'public/data'),
      },
    },

    devtool: isProduction ? 'source-map' : 'eval-source-map',

    // Development server configuration
    devServer: {
      contentBase: path.join(__dirname, 'public'),
      port: 3001,
      hot: true,
      overlay: true,
    },

    // Performance hints
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 250000,
      maxAssetSize: 250000,
    },
  };
};
