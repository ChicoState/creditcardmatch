import type { NextConfig } from 'next';

const config: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '3mb' },
    useTypeScriptCli: false,
  },
};

export default config;
