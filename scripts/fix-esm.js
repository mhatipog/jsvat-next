const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../lib/es6');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function resolveSpecifier(file, specifier) {
  if (!specifier.startsWith('.')) return specifier;

  const target = path.resolve(path.dirname(file), specifier);
  if (fs.existsSync(`${target}.js`)) return `${specifier}.js`;
  if (fs.existsSync(path.join(target, 'index.js'))) {
    return `${specifier.replace(/\/$/, '')}/index.js`;
  }

  return specifier;
}

for (const file of walk(root).filter((file) => file.endsWith('.js'))) {
  const source = fs.readFileSync(file, 'utf8');
  const fixed = source.replace(
    /((?:from\s+|import\s*)['"])(\.{1,2}\/[^'"]+)(['"])/g,
    (_match, before, specifier, after) => `${before}${resolveSpecifier(file, specifier)}${after}`
  );

  fs.writeFileSync(file, fixed);
}

fs.writeFileSync(path.join(root, 'package.json'), '{\n  "type": "module"\n}\n');
