import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json') as { version: string };

/** Version de prepwork, lue depuis package.json (fonctionne depuis src/ comme depuis dist/). */
export const TOOL_VERSION: string = packageJson.version;
