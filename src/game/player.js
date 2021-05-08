const { assert } = require('../utils');

const logg = require('../logger');
const { Move, PlayerStatus, MoveName } = require('../vars');
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

    if (nextStat === PlayerStatus.SUBMITED) {
      assert(from === 'client');
      this.log.info(`emit ${MoveName[data.move]}, target: ${data.target}`);
      this.room.handleMovement({
        from: this.data.id,
        data,
      });
      this.client.roomEmit('room info ingame', this.room.getInfo());
      this.tmp_storage = {
        from: this.data.name,
        to: this.room.alive_players.find(e => e.data.id === data.target)?.data.name,
        move: data.move
      };
      this.client.handleSubmitted(this.tmp_storage);
    } else if (nextStat === PlayerStatus.DRAWING) {
      assert(from === 'roomer');
      this.applyMovement(data[this.data.id]);
      this.log.info('drawing');
      this.tmp_storage = {
        movement_map: data,
        status: this.getStatus()
      };
      this.client.handleDrawing(this.tmp_storage);
    } else if (nextStat === PlayerStatus.ACTING) {
      assert(from === 'roomer' && data === 'request movement');
      this.client.handleRequestMovement();
    }
    if (data === 'ready') { // do nothing
      assert(this.room);
      this.log.info(`ready.`);
      this.ready = true;
      this.room.handleEvent('player ready');
    }
    if (data === 'cancel ready') { // do nothing
      assert(this.room);
      this.log.info(`not ready.`);
      this.stat = PlayerStatus.ROOMED;
      this.ready = false;
      this.room.handleEvent('player cancel ready');
    }
    if (data === 'finish drawing') {
      this.log.info('finish drawing');
      // this.room.handleFinishDrawing({ from: this.data.id });
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
      data: 'ready',
      from: 'client'
    });
  }
  cancelReady () {
    this.handleEvent({
      prevStat: PlayerStatus.READY,
      nextStat: PlayerStatus.ROOMED,
      data: 'cancel ready',
      from: 'client'
    });
  }
  gamePrepare () {
    assert(this.stat === PlayerStatus.READY);
    this.stat = PlayerStatus.LISTENING;
    this.data.movePoint = 0;
  }
  quitGame () {
    this.stat = PlayerStatus.READY;
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