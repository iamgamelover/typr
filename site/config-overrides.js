const webpack = require('webpack');

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};

  Object.assign(fallback, {
    fs: false,
    net: false,
    tls: false,
    zlib: false,
    "child_process": false,
    "os": require.resolve("os-browserify/browser"),
    "path": require.resolve("path-browserify"),
    "stream": require.resolve("stream-browserify"),
    "crypto": require.resolve("crypto-browserify"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "assert": require.resolve("assert"),
    "url": require.resolve("url"),
    "process": require.resolve("process/browser.js")
  });

  config.resolve.fallback = fallback;

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser.js'
    })
  ]);

  return config;
};
