const HuntingGame = require('./hunting').Game;

class Revive extends HuntingGame {
  constructor(config) {
    super(config);
  }
  /**
   * @param {Array<{ id: string, move: number, target: string }>} player_movements
   * @param {{ turn: number }} config
   * @return {{ [string]: { move: number, target: string, injury: number, filtered_injury: number, hit: string[], hitted: string[] } }}
   * @memberof GainPointByKill
   */
  handleTurn (player_movements, config) {
    const data = super.handleTurn(player_movements, config);
    if (config.turn % 3 === 0) {
      console.log('extra point at turn ' + config.turn);
      player_movements.forEach(i => {
        data[i.id].delta_point ++; // 每三回合加一口气
      });
    }
    return data;
  }
}

const game = new Revive({
  name: 'Clapping Game: Revive',
  movement_group: require('./classic').grp,
});

module.exports = {
  Game: Revive,
  default: game,
}