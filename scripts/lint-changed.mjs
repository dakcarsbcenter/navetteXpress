import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const LINTABLE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

function readGitFiles(command) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function isLintable(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return LINTABLE_EXTENSIONS.has(ext);
}

const baseRef = process.argv[2] || 'HEAD';
const changed = readGitFiles(`git diff --name-only --diff-filter=ACMRTUXB ${baseRef}`);
const staged = readGitFiles('git diff --name-only --cached --diff-filter=ACMRTUXB');

const files = [...new Set([...changed, ...staged])]
  .filter(isLintable)
  .filter((filePath) => existsSync(filePath));

if (files.length === 0) {
  console.log('No changed lintable files found.');
  process.exit(0);
}

console.log(`Linting ${files.length} changed file(s)...`);

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(
  npxCommand,
  ['eslint', '--no-error-on-unmatched-pattern', ...files],
  { stdio: 'inherit' }
);

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
