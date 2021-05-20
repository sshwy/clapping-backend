const deepClone = require('clone-deep');

class PlayerClass { /* abstraction */
  /**
   * Creates an instance of PlayerClass.
   * @memberof PlayerClass
   * @param {{name: string, id: string}} config
   */
  constructor(config) {
    this.data = {
      ...config,
      movePoint: 0,
      movement: [],
    };
  }
  /**
   * @memberof PlayerClass
   * @param {{prevStat: number, nextStat: number, data: any, from: string, forceStat?: boolean}} event
   */
  handleEvent (event) { }
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
    /** @member {any} */
    this.socket = socket;
    /** @member {PlayerClass} */
    this.player = player;
  }
  roomEmit (...args) { }
  reHandle () { }
  /**
   * @param {string} event_name
   * @param {any} config
   * @memberof ClientClass
   */
  handleEvent (event_name, config) { }
}

class RoomClass {
  constructor(id) {
    /** @member {number} */
    this.game_id = 0;
    /** @member {number} */
    this.id = id;
    /** @member {Array<PlayerClass>} */
    this.players = [];
    /** @member {string} */
    this.leader = "";
    /** @member {Array<BattleLog>} */
    this.battleLogList = [];
    /** @member {number|undefined} */
    this.turn = undefined;
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
   * @param {Array<BattleLog>} list
   * @memberof RoomClass
   */
  addBattleLog (...list) {
    this.battleLogList.unshift(...list);
  }
  /**
   * @param {any} movement
   * @memberof RoomClass
   */
  handleMovement (movement) { }
}

/**
 * Abstraction of Movement
 *
 * @class MovementClass
 */
class MovementClass {
  /**
   * Creates an instance of MoveClass.
   * @memberof MovementClass
   * @param {MovementData} config
   */
  constructor(config) {
    this.config = config;
  }
  /**
   * 获取 ID
   *
   * @return {number} 
   * @memberof MovementClass
   */
  getId () {
    return this.config.id;
  }
  /**
   * 消耗的行动点数
   *
   * @return {number} 
   * @memberof MovementClass
   */
  getPoint () {
    return this.config.point;
  }
  /**
   * @return {boolean} 
   * @memberof MovementClass
   */
  needTarget () {
    return Boolean(this.config.need_target);
  }
  /**
   * @return {MovementData} 
   * @memberof MovementClass
   */
  toJSONObject () {
    return deepClone(this.config);
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
  toJSONObject () {
    return {
      movement_list: this.movement_list.map(e => e.toJSONObject()),
      config: deepClone(this.config),
    };
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
   * @param {{ name: string, description: string, movement_group: MovementGroup }} config
   * @memberof GameClass
   */
  constructor(config) {
    this.config = config;
  }
  getName () {
    return this.config.name;
  }
  getMovementById (arg) {
    return this.config.movement_group.getMovementById(arg);
  }
  toJSONObject () {
    return {
      name: this.config.name,
      description: this.config.description,
      movement_group: this.config.movement_group.toJSONObject(),
    };
  }
  calculateEffect (...args) { }
  /**
   * 给出玩家的行动，计算结果
   *
   * @param {any} args
   * @memberof GameClass
   */
  handleTurn (...args) { }
  /**
   * 利用 handleTurn 计算的结果检查游戏进度，决定是否需要结束
   *
   * @param {any} args
   * @return {[boolean, any]}
   * @memberof GameClass
   */
  detectGameOver (...args) {
    return [false, null];
  }
};

/**
 * 消息
 *
 * @class Message
 */
class Message {
  /**
   * Creates an instance of Message.
   * @param {'error' | 'success' | 'info'} type 消息类型
   * @param {string} text 消息内容
   * @param {number} [delay=3000] 消息的展示时间，默认值 3000 (ms)
   * @memberof Message
   */
  constructor(type, text, delay = 3000) {
    this.type = type;
    this.text = text;
    this.delay = delay;
  }
  toObject () {
    return {
      type: this.type,
      text: this.text,
      delay: this.delay,
    }
  }
};

module.exports = {
  PlayerClass,
  ClientClass,
  RoomClass,
  MovementClass,
  MovementGroup,
  GameClass,
  Message,
};