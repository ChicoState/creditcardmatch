import type { NextConfig } from 'next';

const config: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '3mb' },
    useTypeScriptCli: true,
    agentUpgrade: 'security',
  },
};

export default config;
