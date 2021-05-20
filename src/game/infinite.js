const Revive2 = require('./revive_2').Game;
const MovementClass = require('./classic').Movement;
const eps = require('./classic').eps;
const { MovementGroup } = require('../types');

/** @type {import('../../global').MovementData[]} */
const MoveData = [
  ...require('./classic').MoveData,
  {
    id: 15, tags: [], need_dead_target: true,
    title: '复活', point: 0, attack: 0, defend: 0,
    description: '复活一个场上已死亡的人，并在此回合内给其一点防御值。',
    background_color: '#8bc34a', background_color_hover: '#689f38',
    image_list: ['/image/game-classic/REVIVE.png'],
  }
];

const Move = {
  ...require('./classic').Move,
  REVIVE: 15,
};

class Movement extends MovementClass {
  constructor(config) {
    super(config);
  }
  isRevive () {
    return this.getId() === Move.REVIVE;
  }
}

class Infinite extends Revive2 {
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
    let tot_aoe_attack = 0;
    for (const id in player_movements) { // 统计场上的 AOE 伤害总和
      const i = player_movements[id];
      //@ts-ignore
      if (this.getMovementById(i.move).isSweeps()) {
        tot_aoe_attack += (move => {
          switch (move) { // Attack
            case Move.SWEEP_I:
              return 1 - eps;
            case Move.SWEEP_II:
              return 2 - eps;
            case Move.SWEEP_III:
              return 3 - eps;
            case Move.LIGHTNING_STORM:
              return 4 - eps;
            default:
              return 0;
          };
        })(i.move);
      }
    };
    console.log('tot_aoe_attack', tot_aoe_attack);
    if (tot_aoe_attack < 1) { // 给死人一点护甲值
      for (const id in player_movements) {
        const i = player_movements[id];
        //@ts-ignore
        if (this.getMovementById(i.move).isRevive()) {
          if (data.deads.includes(i.target)) {
            data.deads = data.deads.filter(e => e !== i.target);
          }
          if (!data.alive.includes(i.target)) {
            data.alive.push(i.target);
          }
        }
      }
    } else {
      for (const id in player_movements) {
        const i = player_movements[id];
        //@ts-ignore
        if (this.getMovementById(i.move).isRevive()) {
          data.log.unshift({
            type: 'msg',
            id: `msg-${id}-${config.turn}`,
            turn: config.turn,
            from: id,
            text: '的复活行动由于外界干扰失败了～'
          });
        }
      }
    }
    return data;
  }
};

const list = MoveData.map(e => new Movement(e));
const grp = new MovementGroup(list, null);
const game = new Infinite({
  name: 'Clapping Game: Infinite',
  description: '无限：复活！',
  movement_group: grp
});

module.exports = {
  Game: Infinite,
  default: game,
}