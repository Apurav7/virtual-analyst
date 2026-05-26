const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const projectRoot = process.cwd();
const buildRoot = path.join(projectRoot, '.next');
const standaloneRoot = path.join(buildRoot, 'standalone');
const standaloneStaticRoot = path.join(standaloneRoot, '.next', 'static');
const sourceStaticRoot = path.join(buildRoot, 'static');
const publicRoot = path.join(projectRoot, 'public');
const standalonePublicRoot = path.join(standaloneRoot, 'public');
const serverEntry = path.join(standaloneRoot, 'server.js');

function ensurePathExists(targetPath, message) {
  if (!fs.existsSync(targetPath)) {
    console.error(message);
    process.exit(1);
  }
}

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) {
    return;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true, force: true });
}

ensurePathExists(
  standaloneRoot,
  'Standalone build not found. Run "npm run build" before starting the production server.',
);

ensurePathExists(
  sourceStaticRoot,
  'Static build assets not found. Run "npm run build" before starting the production server.',
);

ensurePathExists(
  serverEntry,
  'Standalone server entry not found. Run "npm run build" before starting the production server.',
);

copyDirectory(sourceStaticRoot, standaloneStaticRoot);
copyDirectory(publicRoot, standalonePublicRoot);

const child = spawn(process.execPath, [serverEntry], {
  cwd: standaloneRoot,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});