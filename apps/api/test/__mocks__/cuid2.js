const { randomBytes } = require('crypto');

function createId() {
  return 'c' + randomBytes(11).toString('hex');
}

module.exports = {
  createId,
  init: () => createId,
  isCuid: () => true,
  getConstants: () => ({}),
};
