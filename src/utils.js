
const assert = condition => {
  if(!condition) throw new Error('Assertion Failed!');
}

module.exports = {
  assert,
}