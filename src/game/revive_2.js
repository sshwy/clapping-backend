const Revive = require('./revive').Game;

class Revive2 extends Revive {
  constructor(config) {
    super(config);
  }
  /**
   * @param {ResponseMovementMap} player_movements
   * @param {TurnConfig} config
   * @return {TurnResult}
   * @memberof GainPointByKill
   */
  handleTurn (player_movements, config) {
    const data = super.handleTurn(player_movements, config);
    for (const id in player_movements) {
      const i = player_movements[id];
      //@ts-ignore
      if (this.getMovementById(i.move).isSweeps() && data.player_result[id].hit.length === 0) {
        data.player_result[id].filtered_injury = 1;
        data.player_result[id].hitted.push('刃波');
        data.log.unshift({
          type: 'msg',
          id: `sweepkill-${id}-${config.turn}`,
          turn: config.turn,
          from: id,
          text: '被「刃波」反杀了'
        });

        data.alive = data.alive.filter(e => e !== id);
        if (!data.deads.includes(id)) data.deads.push(id);
      }
    }
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