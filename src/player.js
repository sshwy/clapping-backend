const { assert } = require('./utils');

const logg = require('./logger');
const { PlayerStatus, MoveName } = require('./vars');
const { PlayerClass, ClientClass, RoomClass } = require('./types');

/**
 * @class Player
 * @extends {PlayerClass}
 */
class Player extends PlayerClass {
  constructor(data) {
    super(data);

    this.stat = PlayerStatus.INITIALIZED;
    this.log = logg.getLogger(`Player ${this.data.name}`);
    this.log.info('Created.');
  }
  registerRoom (room) {
    assert(this.stat === PlayerStatus.INITIALIZED);
    this.stat = PlayerStatus.ROOMED;
    /** @type {RoomClass} */
    this.room = room;
    if (this.client) {
      this.client.socket.join(this.room.id.toString());
    }
  }
  unregisterRoom () {
    assert(this.stat === PlayerStatus.ROOMED);
    this.stat = PlayerStatus.INITIALIZED;
    if (this.client) {
      this.client.socket.leave(this.room.id.toString());
    }
    this.room = undefined;
  }
  bindClient (client) {
    /** @type {ClientClass} */
    this.client = client;
    if (this.room) {
      this.client.socket.join(this.room.id.toString());
    }
  }
  handleRegisterRoomFailed () {
    this.client.handleRegisterRoomFailed();
  }
  /**
   * forceStat: 要不要 assert stat
   * @memberof Player
   */
  handleEvent ({
    prevStat,
    nextStat,
    data,
    from,
    forceStat,
  }) {
    if(forceStat !== false) assert(this.stat == prevStat);
    this.stat = nextStat;

    if (data.event_name === 'watcher draw') {
      assert(from === 'roomer');
      this.log.info('drawing');
      this.tmp_storage = {
        ...data,
        game_id: this.room.game_id,
      };
      this.client.handleDrawing(this.tmp_storage);
    }
    if (data.event_name === 'player draw') {
      assert(from === 'roomer');
      this.applyMovement(data.movement_map[this.getId()]);
      this.log.info('drawing');
      this.tmp_storage = {
        ...data,
        game_id: this.room.game_id,
      };
      this.client.handleDrawing(this.tmp_storage);
    }
    if (data.event_name === 'request movement') {
      assert(from === 'roomer');
      this.tmp_storage = data;
      this.client.handleRequestMovement(data);
    }
    if (data.event_name === 'response movement') {
      assert(from === 'client');
      const movement = data.movement;
      this.log.info(`emit ${MoveName[movement.move]}, target: ${movement.target}`);
      this.room.handleMovement({
        from: this.data.id,
        data: movement,
      });
      this.client.roomEmit('room info ingame', this.room.getInfo());
      this.tmp_storage = {
        from: this.data.name,
        to: this.room.alive_players.find(e => e.data.id === movement.target)?.data.name,
        move: movement.move
      };
      this.client.handleSubmitted(this.tmp_storage);
    }
    if (data.event_name === 'force movement') {
      assert(from === 'roomer');
      const movement = data.movement;
      this.log.info(`emit ${MoveName[movement.move]}, target: ${movement.target}`);
      this.room.handleMovement({
        from: this.data.id,
        data: movement,
      });
      this.tmp_storage = {
        from: this.data.name,
        to: this.room.alive_players.find(e => e.data.id === movement.target)?.data.name,
        move: movement.move
      };
      this.client.handleSubmitted(this.tmp_storage);
    }
    if (data.event_name === 'finish drawing') {
      this.log.info('finish drawing');
    }
    if (data.event_name === 'ready') { // do nothing
      assert(this.room);
      this.log.info(`ready.`);
      this.room.handleEvent({
        event_name: 'player ready'
      });
    }
    if (data.event_name === 'cancel ready') { // do nothing
      assert(this.room);
      this.log.info(`not ready.`);
      this.stat = PlayerStatus.ROOMED;
      this.room.handleEvent({
        event_name: 'player cancel ready'
      });
    }
    if (data.event_name === 'game prepare') {
      this.data.movePoint = 0;
      this.client.handleGamePrepare();
    }
  }
  getStatus () {
    assert(this.room);
    const status = {
      stat: this.stat,
      self: this.data,
      roomId: this.room.id,
      turn: this.room.turn,
      playerList: this.room.alive_players.map(e => e.data)
    };
    return status;
  }
  getReady () {
    this.handleEvent({
      prevStat: PlayerStatus.ROOMED,
      nextStat: PlayerStatus.READY,
      data: {
        event_name: 'ready'
      },
      from: 'client',
      forceStat: false,
    });
  }
  cancelReady () {
    this.handleEvent({
      prevStat: PlayerStatus.READY,
      nextStat: PlayerStatus.ROOMED,
      data: {
        event_name: 'cancel ready'
      },
      from: 'client',
      forceStat: false,
    });
  }
  gamePrepare () {
    this.handleEvent({
      prevStat: PlayerStatus.READY,
      nextStat: PlayerStatus.LISTENING,
      data: {
        event_name: 'game prepare'
      },
      from: 'roomer',
    });
  }
  quitGame () {
    this.log.info('Quit Game');
    this.stat = PlayerStatus.ROOMED;
  }
  getId () {
    return this.data.id;
  }
  addMovePoint (cnt) {
    this.data.movePoint += cnt;
    this.log.info(`gain ${cnt} move point`);
  }
  applyMovement (move) {
    this.data.movement.push(move);
    this.addMovePoint(move.delta_point);
  }
  onTerminate (signal) {
    assert(this.stat == PlayerStatus.LISTENING);
    this.client.handleTerminate(signal);
    this.tmp_storage = signal;
    this.stat = PlayerStatus.WATCHING;
  }
  dead () {
    this.log.info('Died.');
    this.onTerminate('died');
  }
  win () {
    this.log.info('Win!');
    this.onTerminate('win');
  }
}

module.exports = Player;