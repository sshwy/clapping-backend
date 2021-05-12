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

    var action_ban = false;
    const debounce = socket => {
      if (action_ban) {
        socket.emit('display message', 'error', 'WDNMD 能不能给爷死？？？');
        return true;
      } else {
        action_ban = true;
        setTimeout(() => {
          action_ban = false;
        }, 200);
        return false;
      }
    }

    this.log = logg.getLogger(`Client ${this.player.data.name}`);
    this.socket.on('movement', data => {
      if (debounce(this.socket)) return;
      if (this.player.stat === PlayerStatus.ACTING) {
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
    this.socket.on('choose game', game_id => {
      if (debounce(this.socket)) return;
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
  handleEvent (event_name, config) {
    const handlers = {
      'request movement': (client, config) => {
        client.socket.emit('request movement', client.player.getStatus(), config.timeout);
      },
      'draw': (client, config) => {
        client.socket.emit('draw', config);
      },
      'submitted': (client, config) => {
        client.socket.emit('submitted movement', config);
      },
      'register room failed': (client) => {
        client.socket.emit('display message', 'info', '房间正在游戏中，请稍候再加入～');
      },
      'game prepare': (client) => {
        client.socket.emit('game prepare');
      },
      'go watching': (client, config) => {
        client.socket.emit(config);
      },
    };
    if (handlers[event_name]) return handlers[event_name](this, config);
    throw new Error(`Unknown event '${event_name}'`);
  }
  handleRoomListDisplay (is_update = false) {
    if (is_update) this.socket.emit('room list update', roomStore.getAll().map(room => room.getInfo()));
    else this.socket.emit('room list', roomStore.getAll().map(room => room.getInfo()));
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
      this.handleEvent('request movement', this.player.tmp_storage);
    } else if (this.player.stat === PlayerStatus.WATCHING) {
      this.handleEvent('go watching', this.player.tmp_storage);
    } else if (this.player.stat === PlayerStatus.SUBMITED) {
      this.handleEvent('submitted', this.player.tmp_storage);
    }
  }
}

module.exports = Client;