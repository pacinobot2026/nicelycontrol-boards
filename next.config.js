module.exports = {
  reactStrictMode: true,
  pageExtensions: ['page.js', 'page.jsx', 'js', 'jsx'],
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, os: false, pg: false, net: false, tls: false, dns: false };
    return config;
  },
  env: {
    VIMEO_ACCESS_TOKEN: process.env.VIMEO_ACCESS_TOKEN,
    VIMEO_USER_ID: process.env.VIMEO_USER_ID,
    VIZARD_API_KEY: process.env.VIZARD_API_KEY,
    POSTBRIDGE_API_KEY: process.env.POSTBRIDGE_API_KEY,
  },

};
