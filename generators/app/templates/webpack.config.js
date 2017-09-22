const {resolve, join} = require('path');
const webpack = require('webpack');
const WorkboxPlugin = require('workbox-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const pkg = require('./package.json');

/**
 * === ENV configuration
 */
const isDev = process.argv.find(arg => arg.includes('webpack-dev-server'));
const ENV = isDev ? 'development' : 'production';
const outputPath = isDev ? resolve('src') : resolve('dist');
const processEnv = {
  NODE_ENV: JSON.stringify(ENV),
  appVersion: JSON.stringify(pkg.version)
};

/**
 * === Copy static files configuration
 */
const copyStatics = {
  copyWebcomponents: [{
    from: resolve('./node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js'),
    to: join(outputPath, 'vendor'),
    flatten: true
  }, {
    from: resolve('./node_modules/@webcomponents/webcomponentsjs/webcomponents-lite.js'),
    to: join(outputPath, 'vendor'),
    flatten: true
  }, {
    from: resolve('./node_modules/@webcomponents/webcomponentsjs/webcomponents-sd-ce.js'),
    to: join(outputPath, 'vendor'),
    flatten: true
  }, {
    from: resolve('./node_modules/@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js'),
    to: join(outputPath, 'vendor'),
    flatten: true
  }],
  copyOthers: [{
    from: resolve('./src/index.html'),
    to: outputPath,
    flatten: true
  }, {
    from: resolve('./src/assets/**'),
    to: join(outputPath, 'assets'),
    flatten: true
  }, {
    from: resolve('./src/manifest.json'),
    to: outputPath,
    flatten: true
  }]
};

/**
 * Plugin configuration
 */
const plugins = isDev ? [
  new CopyWebpackPlugin(copyStatics.copyWebcomponents),
  new webpack.DefinePlugin({'process.env': processEnv})
] : [
  new WorkboxPlugin({
    globDirectory: outputPath,
    globPatterns: ['**/*.{html,js,css}'],
    swDest: join(outputPath, 'sw.js')
  }),
  new CopyWebpackPlugin(
    [].concat(copyStatics.copyWebcomponents, copyStatics.copyOthers)
  ),
  new CleanWebpackPlugin([outputPath], {verbose: true}),
  new webpack.DefinePlugin({'process.env': processEnv})
];

/**
 * === Webpack configuration
 */
module.exports = {
  entry: './src/index.js',
  output: {
    path: outputPath,
    filename: 'bundle.js'
  },
  devtool: 'cheap-module-source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        // We need to transpile Polymer itself and other ES6 code
        // exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [[
              'env',
              {
                targets: {browsers: ['last 2 versions', 'not ie <= 11']},
                debug: true
              }
            ]]
          }
        }
      },
      {
        test: /\.html$/,
        use: ['text-loader']
      },
      {
        test: /\.postcss$/,
        use: ['text-loader', 'postcss-loader']
      }
    ]
  },
  plugins,
  devServer: {
    contentBase: resolve(outputPath),
    compress: true,
    overlay: {
      errors: true
    },
    port: 3000,
    host: 'localhost'
  }
};
