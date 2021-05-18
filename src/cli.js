const argv = require('yargs/yargs')(process.argv)
  // @ts-ignore
  .option('port', {
    alias: 'p',
    describe: 'specify the server port',
    default: 3000,
    type: 'number',
  })
  .help('help')
  .wrap(70)
  .argv;

module.exports = argv;