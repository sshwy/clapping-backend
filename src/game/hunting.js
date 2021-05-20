const ClassicGame = require('./classic').Game;

class GainPointByKill extends ClassicGame {
  constructor(config) {
    super(config);
  }
  /**
   * @param {import('../../global').ResponseMovementMap} player_movements
   * @param {import('../../global').TurnConfig} config
   * @return {import('../../global').TurnResult}
   * @memberof GainPointByKill
   */
  handleTurn (player_movements, config) {
    const data = super.handleTurn(player_movements, config);
    for (const id in player_movements) {
      const i = player_movements[id];
      data.player_result[i.id].delta_point += data.player_result[i.id].hit.length; // 点数加上杀的人数
    }
    return data;
  }
}

const game = new GainPointByKill({
  name: 'Clapping Game: Hunter',
  description: '苏醒了，猎杀时刻！在经典模式的基础上增加杀人奖励：被你命中且死亡的人会反馈给你一点行动点。',
  movement_group: require('./classic').grp,
});

module.exports = {
  Game: GainPointByKill,
  default: game,
}