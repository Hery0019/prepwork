// Configuration Next. La sortie autonome sert l'image Docker sans embarquer node_modules.
import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  // Le lint tourne dans son propre script (`pnpm lint`), avec les frontières entre couches.
  reactStrictMode: true,
};

export default config;
