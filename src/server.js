const httpServer = require("http").createServer();
const { createServer } = require('vite')
// @ts-ignore
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://192.168.110.228:8080",
  },
});

const root = '/home/sshwy/桌面/clapping-game/resouce/';

(async () => {
  const resouceServer = await createServer({
    // any valid user config options, plus `mode` and `configFile`
    configFile: false,
    root: root,
    server: {
      port: 3001
    }
  });
  await resouceServer.listen();
  httpServer.listen(3000, () =>
    console.log(`\nserver (with WebSocket) listening at http://localhost:${3000}`)
  );
})();


module.exports = { io, }