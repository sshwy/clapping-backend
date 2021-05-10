
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
        |{ id: string, type: 'die',  die: string, turn: number }
        |{ id: string, type: 'msg',  text: string, turn: number }
        |{ id: string, type: 'win',  win: string, turn: number }>} data
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
      |{ id: string, type: 'die',  die: string, turn: number }
      |{ id: string, type: 'msg',  text: string, turn: number }
      |{ id: string, type: 'win',  win: string, turn: number }} data
   * @memberof PlayerClass
   */
  addBattleLog (...list) {
    this.battleLogList.unshift(...list);
  }
}

/**
 * Abstraction of Movement
 *
 * @class MovementClass
 */
class MovementClass {
  /**
   * Creates an instance of MoveClass.
   * @memberof MoveClass
   * @param {{ id: number, title: string|object, description: string|object, need_target: boolean,
        point: number, attack?: number, defend?: number }} config
   */
  constructor(config) {
    this.config = config;
  }
  /**
   * 获取 ID
   *
   * @return {number} 
   * @memberof MoveClass
   */
  getId () {
    return this.config.id;
  }
  /**
   * 消耗的行动点数
   *
   * @return {number} 
   * @memberof MoveClass
   */
  getPoint () {
    return this.config.point;
  }
  needTarget () {
    return Boolean(this.config.need_target);
  }
}

/**
 * @class MovementGroup
 */
class MovementGroup {
  /**
   * Creates an instance of MovementGroup.
   * @param {Array<MovementClass>} movement_list
   * @param {*} config
   * @memberof MovementGroup
   */
  constructor(movement_list, config) {
    this.config = config;
    this.movement_list = movement_list;
  }
  /**
   * @param {number} id
   * @memberof MovementGroup
   */
  getMovementById (id) {
    return this.movement_list.find(e => e.getId() === id);
  }
  /**
   * @param {number} point
   * @return {Array<MovementClass>}
   * @memberof MovementGroup
   */
  availableMovement (point) {
    return this.movement_list.filter(e => e.getPoint() <= point);
  }
  /**
   * 将 MovementClass 数组序列化为 id 与英文句点间隔的字符串
   * @param {Array<MovementClass>} movement_list
   * @memberof MovementGroup
   */
  serialize (movement_list) {
    return movement_list.map(e => e.getId()).join('.');
  }
  /**
   * 反序列化
   * @param {string} str
   * @memberof MovementGroup
   */
  deserialize (str) {
    return str.split('.')
      .map(Number)
      .filter(isFinite)
      .map(this.getMovementById)
      .filter(Boolean);
  }
}

/**
 * Abstraction of Game Data
 *
 * @class GameClass
 */
class GameClass {
  /**
   * Creates an instance of GameClass.
   * @param {{ name: string, movement_group: MovementGroup }} config
   * @memberof GameClass
   */
  constructor(config) {
    this.config = config;
  }
  calculateEffect () {
  }
  getMovementById (...args) {
    return this.config.movement_group.getMovementById(...args);
  }
};

module.exports = {
  PlayerClass,
  ClientClass,
  RoomClass,
  MovementClass,
  MovementGroup,
  GameClass,
};