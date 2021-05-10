const game_list = require('./game');
const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://192.168.110.228:8080",
  },
});

const sessionStore = require('./sessionStore');
const { playerStore, roomStore } = require('./manager');
const Client = require("./client");
const { PlayerStatus } = require("./vars");
const { randomId } = require("./utils");

roomStore.createRoom(114514);
roomStore.createRoom(1919810);
roomStore.createRoom(8964);
roomStore.createRoom(250);
roomStore.createRoom(80000000);

const parseUsername = name => {
  try {
    name = name.replace(/[$%&*`'"/\\]/g, '').trim();
    if(name.length && name.length <= 15) {
      return name;
    }
  } catch(e) {
    return false;
  }
}

io.use((socket, next) => { // persistent session
  const sessionID = socket.handshake.auth.sessionID;
  if (sessionID) {
    // find existing session
    const session = sessionStore.findSession(sessionID);
    if (session) {
      socket.sessionID = sessionID;
      socket.userID = session.userID;
      socket.username = session.username;
      return next();
    }
  }

  const username = parseUsername(socket.handshake.auth.username);
  if (!username) return next(new Error("invalid username"));

  // create new session
  socket.sessionID = randomId();
  socket.userID = randomId();
  socket.username = username;
  sessionStore.saveSession(socket.sessionID, {
    userID: socket.userID,
    username: socket.username
  });
  next();
});

io.on("connection", (socket) => {
  
  socket.emit('session', {
    sessionID: socket.sessionID,
    userID: socket.userID,
    username: socket.username,
    games: game_list.map(g => g.toJSONObject()),
  });

  const player = playerStore.findPlayer(socket.userID)
    || playerStore.createPlayer(socket.userID, socket.username);

  const client = new Client({
    socket: socket,
    player: player,
  });

  player.bindClient(client);

  client.reHandle();

  socket.on('room info', () => {
    socket.emit('room info', player.room.getInfo());
  });

  socket.on('ready', () => {
    player.getReady();
    client.roomEmit('room info', player.room.getInfo());
  });

  socket.on('cancel ready', () => {
    player.cancelReady();
    client.roomEmit('room info', player.room.getInfo());
  });

  socket.on('select room', id => {
    roomStore.findRoom(id).registerPlayer(player).then(() => {
      client.roomEmit('room info', player.room.getInfo());
    }).catch(e => {
      console.log(e);
    });
  });

  socket.on('quit room', () => {
    const room = client.player.room;
    room.unregisterPlayer(client.player);
    socket.to(room.id.toString()).emit('room info', room.getInfo());
    console.log('quit room', room.id);
    client.reHandle();
  });

  socket.on('logout', () => {
    if (client.player.stat === PlayerStatus.INITIALIZED) {
      playerStore.deletePlayer(socket.userID);
      socket.emit('finish logout');
    } else {
      client.socket.emit('display message', 'error', '你 TM 注销个毛线，先给爷退房再说');
    }
  });

  socket.on('room list update', () => {
    client.handleRoomListDisplay(true);
  });

  socket.on('kick player', id => {
    console.log(id);
    const targetPlayer = playerStore.findPlayer(id);
    if (!targetPlayer) {
      throw new Error(`Can't find player with id ${id}`);
    }
    if (targetPlayer.room.id !== client.player.room.id) {
      throw new Error(`Can't kick player that not in your room (id ${id})`);
    }
    if (targetPlayer.stat === PlayerStatus.READY) {
      targetPlayer.cancelReady();
    }
    if (targetPlayer.stat === PlayerStatus.ROOMED) {
      const room = client.player.room;
      room.unregisterPlayer(targetPlayer);
      targetPlayer.client.socket.to(room.id.toString()).emit('room info', room.getInfo());
      targetPlayer.client.reHandle();
      targetPlayer.client.socket.emit('display message', 'info', '你好像被房主踢了……');
    }
  });

  socket.on('talk', text => {
    client.handleTalk(text);
  });

  socket.onAny((event, ...args) => {
    console.log('[event]', event, args);
  });
});


httpServer.listen(3000, () =>
  console.log(`server listening at http://localhost:${3000}`)
);