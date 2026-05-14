const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../src/generated');
const dest = path.resolve(__dirname, '../dist/generated');

fs.mkdirSync(path.dirname(dest), { recursive: true });

// Remove dest se existir (dir real do tsc, symlink válido ou symlink quebrado do contexto Docker).
fs.rmSync(dest, { recursive: true, force: true });

const linkType = process.platform === 'win32' ? 'junction' : 'dir';
fs.symlinkSync(src, dest, linkType);
console.log('Criado link dist/generated → src/generated');
