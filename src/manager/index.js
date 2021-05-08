const PlayerManager = require("./player_manager");
const RoomManager = require("./room_manager");

const roomStore = new RoomManager();
const playerStore = new PlayerManager();

module.exports = {
  roomStore,
  playerStore
};