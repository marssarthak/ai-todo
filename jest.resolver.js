// A custom resolver for the Next.js environment to help Jest handle imports correctly

module.exports = (path, options) => {
  // Call the default Jest resolver
  return options.defaultResolver(path, {
    ...options,
    // Add additional conditions to ensure Jest resolves the correct Next.js modules
    packageFilter: (pkg) => {
      // Next.js has conditional exports for ESM and CommonJS
      // Here we ensure that we always use CommonJS for testing
      if (pkg.name === "next") {
        delete pkg.exports;
        delete pkg.module;
        pkg.main = "dist/server/next.js";
      }
      return pkg;
    },
  });
};
