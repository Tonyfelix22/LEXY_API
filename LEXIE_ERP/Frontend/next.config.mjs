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
  // Reduce bundle: only include icons/charts that are used (faster load)
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
}

export default nextConfig
