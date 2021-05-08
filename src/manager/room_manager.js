const Room = require("../game/room");

class RoomManager {
  constructor() {
    /** @type {Map<number, Room>} */
    this.room_set = new Map();
  }
  /**
   * @param {number} id
   * @return {Room} 
   * @memberof RoomManager
   */
  findRoom (id) {
    return this.room_set.get(Number(id));
  }
  /**
   * @param {number} id
   * @return {Room} 
   * @memberof RoomManager
   */
  createRoom (id) {
    id = Number(id);
    const room = new Room(id);
    this.room_set.set(id, room);
    return room;
  }
  deleteRoom (id) {
    id = Number(id);
    this.room_set.delete(id);
  }
  getAll () {
    return [...this.room_set.values()];
  }
};


module.exports = RoomManager;