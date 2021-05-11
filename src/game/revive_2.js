const Revive = require('./revive').Game;

class Revive2 extends Revive {
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
    player_movements.forEach(i => {
      if(this.getMovementById(i.move).isSweeps() && data[i.id].hit.length === 0) {
        data[i.id].filtered_injury = 1;
        data[i.id].hitted.push('刃波');
      }
    });
    return data;
  }
}

const game = new Revive2({
  name: 'Clapping Game: Revive II',
  description: '重生 2：在重生的基础上，使用「刃波」系列未命中任何人会死亡',
  movement_group: require('./classic').grp,
});

module.exports = {
  Game: Revive,
  default: game,
}