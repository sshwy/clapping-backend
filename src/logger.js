const chalk = require('chalk');
const logger = require('loglevel');
const prefixer = require('loglevel-plugin-prefix');
const fs = require("fs");

const colors = {
  TRACE: chalk.magenta,
  DEBUG: chalk.cyan,
  INFO: chalk.blue,
  WARN: chalk.yellow,
  ERROR: chalk.red,
};

prefixer.reg(logger);

logger.enableAll();

prefixer.apply(logger, {
  format (level, name, timestamp) {
    return `${chalk.gray(`[${timestamp}]`)} ${colors[level.toUpperCase()](level)} ${chalk.green(`(${name}):`)}`;
  },
})

const originalFactory = logger.methodFactory;
logger.methodFactory = function (methodName, logLevel, loggerName) {
  var rawMethod = originalFactory(methodName, logLevel, loggerName);
  return function (message) {

    const datePrefix = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
    fs.appendFileSync(`runtime.${methodName || 'unknown'}.log`, `[${datePrefix}] (${String(loggerName)}): ${message}\n`, 'utf8');

    rawMethod(message);
  };
};

module.exports = logger;