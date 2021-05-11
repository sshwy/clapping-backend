const ClassicGame = require('./classic').Game;

class GainPointByKill extends ClassicGame {
  constructor(config) {
    super(config);
  }
  /**
   * @param {Array<{ id: string, move: number, target: string }>} player_movements
   * @param {{ turn: number }} config
   * @return {{ [string]: { move: number, target: string, injury: number, filtered_injury: number, hit: string[], hitted: string[] } }}
   * @memberof GainPointByKill
   */
  handleTurn(player_movements, config) {
    const data = super.handleTurn(player_movements, config);
    player_movements.forEach(i => {
      data[i.id].delta_point += data[i.id].hit.length; // 点数加上杀的人数
    });
    return data;
  }
}

const game = new GainPointByKill({
  name: 'Clapping Game: Hunting Time',
  movement_group: require('./classic').grp,
});

module.exports = {
  Game: GainPointByKill,
  default: game,
}