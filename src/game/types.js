
/**
 * @class PlayerClass
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
  getStatus () { }
  getId () { }
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
 * @class ClientClass
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
  roomEmit (...args) { }
  reHandle () { }
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
    /** @type {string} */
    this.leader = "";
    /**
     * @type {Array<{ id: string, type: 'move',  from: string,  to?: string, move: number, turn: number }
        |{ id: string, type: 'die',  die: string, turn: number }>} data
     */
    this.battleLogList = [];
  }
  getInfo () { }
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
  /**
   * @param {{ id: string, type: 'move',  from: string,  to?: string, move: number, turn: number }
      |{ id: string, type: 'die',  die: string, turn: number }} data
   * @memberof PlayerClass
   */
  addBattleLog (...list) {
    this.battleLogList.unshift(...list);
  }
}

module.exports = {
  PlayerClass,
  ClientClass,
  RoomClass
};