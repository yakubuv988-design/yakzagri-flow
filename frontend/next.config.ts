import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },
  experimental: {
    optimizePackageImports: ["@stellar/stellar-sdk"],
  },
  turbopack: {},
  // Serve the mobile deep-link association files as JSON (issue #261).
  // Apple requires apple-app-site-association to have an application/json
  // content type and no file extension.
  async headers() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
};

// CSP nonce support (issue #456): Next.js reads the per-request nonce from the
// `x-nonce` request header set by middleware and applies it to the inline
// scripts and font/style tags it emits. Enabling this flag makes Next.js
// propagate that nonce onto its own emitted tags so they satisfy the
// `script-src 'nonce-...' 'strict-dynamic'` policy.
nextConfig.experimental = {
  ...nextConfig.experimental,
  nonce: true,
};

export default withBundleAnalyzer(nextConfig);
