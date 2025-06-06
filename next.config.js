/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizeCss: true
  },
  // CSS 최적화 설정
  optimizeCss: false,
  // Fast Refresh 관련 설정
  webpack: (config, { dev, isServer }) => {
    // 개발 환경에서만 적용
    if (dev && !isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000, // 1초마다 변경사항 체크
        aggregateTimeout: 300, // 변경사항이 발생한 후 300ms 동안 대기
      };
    }
    return config;
  },
};

module.exports = nextConfig; 