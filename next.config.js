/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    compiler: {
        styledComponents: true,
    },
    experimental: {
        typedRoutes: true,
    },
    output: 'standalone',
}

module.exports = nextConfig
