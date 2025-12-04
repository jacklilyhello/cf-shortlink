const fs = require('fs/promises');
const path = require('path');

const root = process.cwd();
const srcDir = path.join(root, 'pages');
const outDir = path.join(root, 'dist');
const apiBase = process.env.API_BASE || '';

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  await fs.cp(src, dest, { recursive: true });
}

async function writeConfig(destDir, value) {
  const content = `window.__API_BASE__ = ${JSON.stringify(value)};\n`;
  await fs.writeFile(path.join(destDir, 'config.js'), content, 'utf8');
}

async function main() {
  await fs.rm(outDir, { recursive: true, force: true });
  await copyDir(srcDir, outDir);
  await writeConfig(outDir, apiBase);
  console.log('Pages build complete. API_BASE=%s', apiBase || '(empty)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
