/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  optimizeFonts: false,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

export default nextConfig
