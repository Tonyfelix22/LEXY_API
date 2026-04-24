/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  optimizeFonts: false,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
