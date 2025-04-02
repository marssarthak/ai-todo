/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Image optimization settings
  images: {
    domains: ["avatars.githubusercontent.com", "lh3.googleusercontent.com"],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Enable SWC minification
  // swcMinify: true,

  // Enable App Directory static features
  experimental: {
    optimizeCss: true,
    optimisticClientCache: true,
  },

  // Optimize loading performance
  compiler: {
    // Remove console.log in production
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Configure headers for security and performance
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
      {
        // Cache static assets
        source: "/:path(.+\\.(?:jpg|jpeg|gif|png|svg|ico|css|js)$)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Configure webpack for optimizations
  webpack: (config, { dev, isServer }) => {
    // Only run in production builds
    if (!dev) {
      // Optimize CSS
      if (!isServer) {
        config.optimization.splitChunks.cacheGroups.styles = {
          name: "styles",
          test: /\.(css|scss)$/,
          chunks: "all",
          enforce: true,
        };
      }
    }

    return config;
  },

  // Enable tree shaking and module concatenation
  output: "standalone",

  // Enable gzip compression
  compress: true,

  // Enable PWA features and offline support (if using next-pwa)
  // pwa: {
  //   dest: 'public',
  //   register: true,
  //   skipWaiting: true,
  //   disable: process.env.NODE_ENV === 'development'
  // },
};

module.exports = nextConfig;
