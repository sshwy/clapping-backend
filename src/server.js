const { gitDescribeSync } = require('git-describe');

const logger = require('./logger').getLogger('server');

const info = {
  // @ts-ignore
  version: gitDescribeSync({
    match: '[0-9]*',
    dirtyMark: '-unstaged'
  }),
};

const httpServer = require("http").createServer(function (req, res) {
  const handlers = {
    '/info.json': (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      res.writeHead(200);
      res.end(JSON.stringify(info));
    },
  };

  logger.info(req.url);
  if (handlers[req.url]) handlers[req.url](req, res);
  else {
    res.writeHead(404);
    res.end(`404 Not Found >_<`);
  }
});

const wsOrigin = process.env.NODE_ENV === 'production'
  ? 'https://clap.sshwy.name'
  : "http://localhost:8080";

// @ts-ignore
const io = require("socket.io")(httpServer, {
  cors: {
    origin: wsOrigin,
  },
});

const argv = require("./cli");

httpServer.listen(argv.port, () =>
  logger.info(`server listening on port ${argv.port}, origin: ${wsOrigin}`)
);

module.exports = { io, }