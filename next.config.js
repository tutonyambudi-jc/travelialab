/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '192.168.11.120',
      },
      {
        protocol: 'http',
        hostname: '192.168.11.119',
      },
    ],
  },
  /** Évite une 404 sur /favicon.ico (le navigateur la demande par défaut) : sert app/icon.svg */
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/icon.svg' }]
  },
};

module.exports = nextConfig;
