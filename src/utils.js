const crypto = require("crypto");

const assert = condition => {
  if(!condition) throw new Error('Assertion Failed!');
}

const randomId = () => crypto.randomBytes(8).toString("hex");

module.exports = {
  assert,
  randomId,
}