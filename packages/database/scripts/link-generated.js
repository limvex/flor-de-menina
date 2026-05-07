const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../src/generated');
const dest = path.resolve(__dirname, '../dist/generated');

if (!fs.existsSync(dest)) {
  // 'junction' não exige privilégios de admin no Windows
  fs.symlinkSync(src, dest, 'junction');
  console.log('Criado link dist/generated → src/generated');
}
