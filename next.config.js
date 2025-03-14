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
    webpack: (config) => {
        // Add rule for shader files
        config.module.rules.push({
            test: /\.(vert|frag)$/,
            type: 'asset/source'
        })
        
        return config
    }
}

module.exports = nextConfig
