const chalk = require('chalk');
const logger = require('loglevel');
const prefixer = require('loglevel-plugin-prefix');

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
  format(level, name, timestamp) {
    return `${chalk.gray(`[${timestamp}]`)} ${colors[level.toUpperCase()](level)} ${chalk.green(`(${name}):`)}`;
  },
})

module.exports = logger;