#!/usr/bin/env node
// Point d'entrée exécutable : branche les dépendances réelles et délègue à `runCli`.
import { createNodeFileSystem } from '../fs/node.js';
import { toPosix } from '../fs/types.js';
import { createClackPrompter } from '../questionnaire/clack.js';
import { TOOL_VERSION } from '../version.js';
import { createNodeCommandRunner } from './git.js';
import { runCli } from './program.js';

const exitCode = await runCli(
  {
    fs: createNodeFileSystem(),
    prompter: createClackPrompter,
    commands: createNodeCommandRunner(),
    toolVersion: TOOL_VERSION,
    cwd: toPosix(process.cwd()),
  },
  process.argv.slice(2),
);
process.exitCode = exitCode;
