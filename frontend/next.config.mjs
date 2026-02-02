/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/uploads/:path*',
                destination: 'http://localhost:3001/uploads/:path*',
            },
        ];
    },
};

export default nextConfig;
