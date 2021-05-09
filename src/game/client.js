const logg = require('../logger');
const { assert } = require("../utils");
const { PlayerStatus } = require("../vars");
const { roomStore } = require('../manager');
const { ClientClass } = require("./types");

/**
 * @class Client
 * @extends {ClientClass}
 */
class Client extends ClientClass {
  constructor(data) {
    super(data);

    this.log = logg.getLogger(`Client ${this.player.data.name}`);
    this.socket.on('movement', data => {
      this.player.handleEvent({
        prevStat: PlayerStatus.ACTING,
        nextStat: PlayerStatus.SUBMITED,
        from: 'client',
        data: {
          event_name: 'response movement',
          movement: data,
        },
      });
    });
    this.socket.on('finish draw', () => {
      this.player.handleEvent({
        prevStat: PlayerStatus.DRAWING,
        nextStat: PlayerStatus.LISTENING,
        from: 'client',
        data: {
          event_name: 'finish drawing'
        },
      });
    });
    this.socket.on('watcher finish draw', () => {
      // do nothing
    });
  }
  handleRequestMovement () {
    this.socket.emit('request movement', this.player.getStatus());
  }
  handleTerminate (signal) {
    this.socket.emit(signal);
  }
  handleDrawing (data) {
    this.socket.emit('draw', data);
  }
  handleRoomListDisplay (is_update = false) {
    if(is_update) this.socket.emit('room list update', roomStore.getAll().map(room => room.getInfo()));
    else this.socket.emit('room list', roomStore.getAll().map(room => room.getInfo()));
  }
  handleSubmitted () {
    this.socket.emit('submitted movement', this.player.tmp_storage);
  }
  handleRegisterRoomFailed () {
    this.socket.emit('display message', 'info', '房间正在游戏中，请稍候再加入～');
    // to do
  }
  handleGamePrepare () {
    this.socket.emit('clear draw log');
  }
  roomEmit (...args) {
    assert(this.player.room);
    this.socket.to(this.player.room.id.toString()).emit(...args);
    this.socket.emit(...args);
  }
  /**
   * Detect current status and do things again (for reconnection)
   */
  reHandle () {
    this.log.info(`invoke rehandle (stat: ${this.player.stat})`);
    assert(this.player);
    if (this.player.stat !== PlayerStatus.INITIALIZED) {
      assert(this.player.room);
      this.socket.emit('room info', this.player.room.getInfo());
    }
    if (this.player.stat === PlayerStatus.INITIALIZED) {
      this.handleRoomListDisplay();
    } else if (this.player.stat === PlayerStatus.ACTING) {
      this.handleRequestMovement();
    } else if (this.player.stat === PlayerStatus.DRAWING) {
      this.handleDrawing(this.player.tmp_storage);
    } else if (this.player.stat === PlayerStatus.WATCHING) {
      this.handleTerminate(this.player.tmp_storage);
    } else if (this.player.stat === PlayerStatus.SUBMITED) {
      this.handleSubmitted();
    }
  }
}

module.exports = Client;