const logg = require('./logger');
const { assert } = require("./utils");
const { PlayerStatus } = require("./vars");
const { roomStore } = require('./manager');
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
      if (this.player.stat !== PlayerStatus.ACTING) {
        this.socket.emit('display message', 'info', '你似乎超时啦～系统帮你 随 机 选了一个操作哦');
      } else {
        this.player.handleEvent({
          prevStat: PlayerStatus.ACTING,
          nextStat: PlayerStatus.SUBMITED,
          from: 'client',
          data: {
            event_name: 'response movement',
            movement: data,
          },
        });
      }
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
    this.socket.on('choose game', game_id => {
      this.player.room.handleEvent({
        event_name: 'choose game',
        game_id: game_id,
      }, () => {
        this.socket.emit('display message', 'success', `成功选择游戏 ${this.player.room.game.getName()}`);
        this.roomEmitOther('room info', this.player.room.getInfo());
        this.roomEmitOther('display message', 'info', `房主将游戏切换为 ${this.player.room.game.getName()}`);
      });
    });
  }
  handleRequestMovement (data) {
    this.socket.emit('request movement', this.player.getStatus(), data.timeout);
  }
  handleTerminate (signal) {
    this.socket.emit(signal);
  }
  handleDrawing (data) {
    this.socket.emit('draw', data);
  }
  handleRoomListDisplay (is_update = false) {
    if (is_update) this.socket.emit('room list update', roomStore.getAll().map(room => room.getInfo()));
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
    this.socket.emit('game prepare');
  }
  handleTalk (text) {
    assert(this.player.room);
    if (text.length > 50) return;
    this.roomEmit('speak', this.player.data.id, text);
  }
  roomEmit (...args) {
    assert(this.player.room);
    this.socket.to(this.player.room.id.toString()).emit(...args);
    this.socket.emit(...args);
  }
  roomEmitOther (...args) {
    assert(this.player.room);
    this.socket.to(this.player.room.id.toString()).emit(...args);
  }
  /**
   * Detect current status and do things again (for reconnection)
   */
  reHandle () {
    this.log.info(`invoke rehandle (stat: ${this.player.stat})`);
    assert(this.player);
    switch (this.player.stat) {
      case PlayerStatus.ROOMED:
      case PlayerStatus.READY:
        assert(this.player.room);
        this.socket.emit('room info', this.player.room.getInfo());
        break;
      case PlayerStatus.INITIALIZED:
        break;
      default: // gaming
        assert(this.player.room);
        this.socket.emit('room info ingame', this.player.room.getInfo());
    }
    if (this.player.stat === PlayerStatus.INITIALIZED) {
      this.handleRoomListDisplay();
    } else if (this.player.stat === PlayerStatus.ACTING) {
      this.handleRequestMovement(this.player.tmp_storage); // ERROR!!!!
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