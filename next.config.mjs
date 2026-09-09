/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { optimizePackageImports: ["lucide-react"] },
  serverExternalPackages: ["sweph-wasm"],
};
export default nextConfig;
