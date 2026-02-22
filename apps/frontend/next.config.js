//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

const nextConfig = {
  nx: {
    svgr: false,
  },
  env: {
    GRPC_BACKEND_HOST: process.env.GRPC_BACKEND_HOST || 'localhost:50051',
  },
  experimental: {},
  images: {
    domains: [],
  },
};

const plugins = [
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
