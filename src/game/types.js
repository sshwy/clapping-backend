
/**
 * @class RoomClass
 * @param {{name: string, id: string}}
 */
class PlayerClass { /* abstraction */
  constructor({ name, id }) {
    this.data = {
      name,
      id,
      movePoint: 0,
      movement: [],
    };
    this.ready = false;
  }
  /**
   * @param {{prevStat: number, nextStat: number, data: any, from: string}}
   */
  handleEvent ({
    prevStat,
    nextStat,
    data,
    from,
  }) { }
  getStatus () {}
  getId () {}
  /**
   * @param {RoomClass} room
   * @memberof PlayerClass
   */
  registerRoom (room) { }
  /**
   * @param {RoomClass} room
   * @memberof PlayerClass
   */
  unregisterRoom (room) { }
}

/**
 * @class RoomClass
 */
class ClientClass {
  constructor({
    socket,
    player
  }) {
    this.socket = socket;
    /** @member {PlayerClass} */
    this.player = player;
  }
  roomEmit (...args) {}
  reHandle () {}
}

/**
 * @class RoomClass
 */
class RoomClass {
  constructor(id) {
    /** @type {number} */
    this.id = id;
    /** @type {Array<PlayerClass>} */
    this.players = [];
  }
  getInfo () {}
  handleEvent (event) { }
  /**
   * @param {PlayerClass} player
   * @memberof RoomClass
   */
  registerPlayer (player) { }
  /**
   * @param {PlayerClass} player
   * @memberof RoomClass
   */
  unregisterPlayer (player) { }
}

module.exports = {
  PlayerClass,
  ClientClass,
  RoomClass
};