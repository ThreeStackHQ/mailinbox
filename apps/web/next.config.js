/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@mailinbox/db", "@mailinbox/config"],
};

module.exports = nextConfig;
