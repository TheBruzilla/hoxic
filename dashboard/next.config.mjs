const backendOrigin =
  process.env.DASHBOARD_BACKEND_ORIGIN || "http://127.0.0.1:3456";

/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    compiler: "modern",
    silenceDeprecations: ["legacy-js-api"],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${backendOrigin}/api/:path*`,
        },
        {
          source: "/auth/:path*",
          destination: `${backendOrigin}/auth/:path*`,
        },
        {
          source: "/health",
          destination: `${backendOrigin}/health`,
        },
      ],
    };
  },
};

export default nextConfig;
