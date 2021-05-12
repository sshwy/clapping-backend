const RoomStatus = {
  PREPARING: 0,
  PLAYING: 1,
  WAITING: 2,
};

const PlayerStatus = {
  INITIALIZED: 0,
  ROOMED: 1,
  READY: 2,
  LISTENING: 3,
  ACTING: 4,
  SUBMITED: 5,
  WATCHING: 7,
}

module.exports = {
  RoomStatus,
  PlayerStatus
};