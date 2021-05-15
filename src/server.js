const httpServer = require("http").createServer();
const wsOrigin = process.env.NODE_ENV === 'production'
  ? 'http://clap.sshwy.name'
  : "http://localhost:8080";

// @ts-ignore
const io = require("socket.io")(httpServer, {
  cors: {
    origin: wsOrigin,
  },
});


httpServer.listen(3000, () =>
  console.log(`\nserver (with WebSocket) listening at http://localhost:${3000}, origin: ${wsOrigin}`)
);

module.exports = { io, }