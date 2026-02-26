const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function exec(cmd, cwd) {
  console.log(`> ${cmd} (in ${cwd})`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');

// 1. Clean public dir
if (fs.existsSync(publicDir)) {
  console.log('Cleaning public directory...');
  fs.rmSync(publicDir, { recursive: true, force: true });
}
fs.mkdirSync(publicDir);

// 2. Build Shop
console.log('Building Shop...');
exec('bun install && bun run build', path.join(rootDir, 'shop'));
// Copy shop dist to public root
console.log('Copying Shop build to public...');
copyDir(path.join(rootDir, 'shop/dist'), publicDir);

// 3. Build Admin
console.log('Building Admin...');
exec('bun install && bun run build', path.join(rootDir, 'admin'));
// Copy admin dist to public/admin
console.log('Copying Admin build to public/admin...');
copyDir(path.join(rootDir, 'admin/dist'), path.join(publicDir, 'admin'));

// 4. Copy Static Assets (Models/PDFs)
console.log('Copying static assets...');
const staticSrc = path.join(rootDir, 'server/public');
const staticDest = path.join(publicDir, 'static');
if (fs.existsSync(staticSrc)) {
    copyDir(staticSrc, staticDest);
} else {
    // If server/public doesn't exist, try root files
    if (!fs.existsSync(staticDest)) fs.mkdirSync(staticDest, { recursive: true });
    // Try copy specific demo files if they exist in root
    ['AH-GB01-4080D-L50-8.stl', 'document.pdf'].forEach(f => {
        const src = path.join(rootDir, f);
        if (fs.existsSync(src)) fs.copyFileSync(src, path.join(staticDest, f));
    });
}

console.log('Build complete!');
