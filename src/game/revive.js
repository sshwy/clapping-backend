const HuntingGame = require('./hunting').Game;

class Revive extends HuntingGame {
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
    if (config.turn % 3 === 0) {
      console.log('extra point at turn ' + config.turn);
      for (const id in player_movements) {
        const i = player_movements[id];
        data.player_result[i.id].delta_point++; // 每三回合加一口气
      }
      data.log.unshift({
        type: 'msg',
        id: `revive-${config.turn}`,
        turn: config.turn,
        text: '全体玩家获得一点行动力！'
      });
    }
    return data;
  }
}

const game = new Revive({
  name: 'Clapping Game: Revive',
  description: '重生：在猎杀时刻的基础上，每三回合所有人各获得一行动力。',
  movement_group: require('./classic').grp,
});

module.exports = {
  Game: Revive,
  default: game,
}