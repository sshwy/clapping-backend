const httpServer = require("http").createServer();
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
  console.log(`\nserver (with WebSocket) listening at port ${argv.port}, origin: ${wsOrigin}`)
);

module.exports = { io, }