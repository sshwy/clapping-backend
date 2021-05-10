const Player = require("../player");
const logg = require('../logger');

/**
 * @class PlayerManager
 */
class PlayerManager {
  constructor() {
    /** @type {Map<string, Player>} */
    this.player_set = new Map();
    this.log = logg.getLogger('Player Manager');
  }
  /**
   * @param {string} userID
   * @return {Player|undefined}
   * @memberof PlayerManager
   */
  findPlayer (userID) {
    this.log.info(`find player (userID: ${userID})`);
    return this.player_set.get(userID);
  }
  createPlayer (userID, username) {
    const player = new Player({
      name: username,
      id: userID,
    });
    this.player_set.set(userID, player);
    return player;
  }
  deletePlayer (userID) {
    this.log.info(`delete player (userID: ${userID})`);
    this.player_set.delete(userID);
  }
}

module.exports = PlayerManager;