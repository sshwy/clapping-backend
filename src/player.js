const { assert } = require('./utils');

const logg = require('./logger');
const { Move, PlayerStatus, MoveName } = require('./vars');
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
  handleEvent ({
    prevStat,
    nextStat,
    data,
    from,
  }) {
    assert(this.stat == prevStat);
    this.stat = nextStat;

    if (data.event_name === 'watcher draw') {
      assert(from === 'roomer');
      this.log.info('drawing');
      this.tmp_storage = {
        ...data,
        status: this.getStatus()
      };
      this.client.handleDrawing(this.tmp_storage);
    }
    if (data.event_name === 'player draw') {
      assert(from === 'roomer');
      this.applyMovement(data.movement_map[this.data.id]);
      this.log.info('drawing');
      this.tmp_storage = data;
      this.client.handleDrawing(this.tmp_storage);
    }
    if (data.event_name === 'request movement') {
      assert(from === 'roomer');
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
      this.room.handleEvent('player ready');
    }
    if (data.event_name === 'cancel ready') { // do nothing
      assert(this.room);
      this.log.info(`not ready.`);
      this.stat = PlayerStatus.ROOMED;
      this.room.handleEvent('player cancel ready');
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
      from: 'client'
    });
  }
  cancelReady () {
    this.handleEvent({
      prevStat: PlayerStatus.READY,
      nextStat: PlayerStatus.ROOMED,
      data: {
        event_name: 'cancel ready'
      },
      from: 'client'
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
  addMovePoint () {
    this.data.movePoint++;
  }
  decMovePoint (cnt) {
    this.data.movePoint -= cnt;
  }
  applyMovement (move) {
    this.data.movement.push(move);
    switch (move.move) {
      case Move.CLAP:
        this.addMovePoint();
        this.log.info(`gain 1 move point`);
        return;
      case Move.DEFEND:
        return;
      case Move.STRONG_DEFEND:
      case Move.SWEEP_I:
      case Move.THORNS_I:
      case Move.SHOOT:
      case Move.LIGHTNING_ARRESTER:
        this.decMovePoint(1);
        this.log.info(`lose 1 move point`);
        return;
      case Move.SWEEP_II:
      case Move.THORNS_II:
      case Move.SLASH:
        this.decMovePoint(2);
        this.log.info(`lose 2 move point`);
        return;
      case Move.SWEEP_III:
      case Move.THORNS_III:
      case Move.LIGHTNING_STRIKE:
        this.decMovePoint(3);
        this.log.info(`lose 3 move point`);
        return;
      case Move.LIGHTNING_STORM:
      case Move.EARTHQUAKE:
        this.decMovePoint(4);
        this.log.info(`lose 4 move point`);
        return;
    }
    throw new Error('unknown movement');
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