const crypto = require("crypto");

/**
 * 断言表达式的值为真，如果为假则直接抛出错误
 *
 * @param {boolean} condition
 */
const assert = condition => {
  if (!condition) throw new Error('Assertion Failed!');
}

/**
 * 随机一个 16 位字符串类型的 ID
 * @returns {string}
 */
const randomId = () => crypto.randomBytes(8).toString("hex");

module.exports = {
  assert,
  randomId,
}