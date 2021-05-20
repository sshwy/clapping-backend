const logg = require('./logger');
const { assert } = require("./utils");
const { PlayerStatus } = require("./vars");
const { roomStore } = require('./manager');
const { ClientClass } = require("./types");
const { Message } = require('./types');

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
        socket.emit('display_message', new Message('error', 'WDNMD 能不能给爷死？？？').toObject());
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
        this.socket.emit('display_message',
          new Message('success', `成功选择游戏 ${this.player.room.game.getName()}`).toObject());
        this.roomEmitOther('room_info', this.player.room.getInfo());
        this.roomEmitOther('display_message',
          new Message('info', `房主将游戏切换为 ${this.player.room.game.getName()}`).toObject());
      });
    });
    this.socket.on('select room', id => {
      if (debounce(this.socket)) return;
      roomStore.findRoom(id).registerPlayer(this.player).then(() => {
        this.socket.emit('scene_type', 'room_info');
        this.roomEmit('room_info', this.player.room.getInfo());
      }).catch(e => {
        console.log(e);
      });
    });
    this.socket.on('quit room', () => {
      if (debounce(this.socket)) return;
      const room = this.player.room;
      room.unregisterPlayer(this.player);
      this.socket.to(room.id.toString()).emit('room_info', room.getInfo());
      this.log.info('quit room', room.id);
      this.reHandle();
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
        client.socket.emit('display_message', new Message('info', '房间正在游戏中，请稍候再加入～').toObject());
      },
      'game prepare': (client) => {
        client.socket.emit('game prepare');
        client.socket.emit('scene_type', 'gaming');
      },
      'go watching': (client, config) => {
        client.socket.emit(config);
      },
    };
    if (handlers[event_name]) return handlers[event_name](this, config);
    throw new Error(`Unknown event '${event_name}'`);
  }
  handleRoomListDisplay (is_update = false) {
    this.socket.emit('scene_type', 'room_list');
    if (is_update) this.socket.emit('room_list_update', roomStore.getAll().map(room => room.getInfo()));
    else this.socket.emit('room_list', roomStore.getAll().map(room => room.getInfo()));
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
    this.log.debug(`invoke rehandle (stat: ${this.player.stat})`);
    assert(this.player);
    switch (this.player.stat) {
      case PlayerStatus.ROOMED:
      case PlayerStatus.READY:
        assert(this.player.room);
        this.socket.emit('scene_type', 'room_info');
        this.socket.emit('room_info', this.player.room.getInfo());
        break;
      case PlayerStatus.INITIALIZED:
        this.handleRoomListDisplay();
        break;
      default: // gaming
        this.socket.emit('scene_type', 'gaming');
        assert(this.player.room);
        this.socket.emit('room_info_ingame', this.player.room.getInfo());
    }
    if (this.player.stat === PlayerStatus.ACTING) {
      this.handleEvent('request movement', this.player.tmp_storage);
    } else if (this.player.stat === PlayerStatus.WATCHING) {
      this.handleEvent('go watching', this.player.tmp_storage);
    } else if (this.player.stat === PlayerStatus.SUBMITED) {
      this.handleEvent('submitted', this.player.tmp_storage);
    }
  }
}

module.exports = Client;