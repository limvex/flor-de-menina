// Stub CommonJS de @paralleldrive/cuid2 para permitir o uso real do
// `prisma` (que importa `createId`) em testes Jest sem precisar transpilar
// o pacote ESM original.

let counter = 0;
function createId() {
  counter += 1;
  return `cuid${Date.now().toString(36)}${counter.toString(36).padStart(4, '0')}`;
}

function init() {
  return createId;
}

function getConstants() {
  return { defaultLength: 24, bigLength: 32 };
}

function isCuid(value) {
  return typeof value === 'string' && /^cuid/.test(value);
}

module.exports = { createId, init, getConstants, isCuid };
