/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/(.*)", headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }] }]
  }
}
module.exports = nextConfig
