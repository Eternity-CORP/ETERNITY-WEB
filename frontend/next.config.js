/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: ['localhost:3001'],
  },
  ...(process.env.NODE_ENV === 'production' && {
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
  }),
};

module.exports = nextConfig;
