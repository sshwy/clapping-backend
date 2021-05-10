const { MovementClass, MovementGroup, GameClass } = require('../types');

const eps = 0.01;

const MoveData = [{
  id: 0, tags: ['老八秘制小汉堡'],
  title: '拍手', point: -1, attack: 0, defend: 0,
  description: '增加一点行动力。',
  background_color: '#8bc34a', background_color_hover: '#689f38'
}, {
  id: 1, tags: ['防守'],
  title: '格挡', point: 0, attack: 0, defend: '*2',
  description: '若伤害值大于等于 2 则无法格挡。',
  background_color: '#8bc34a', background_color_hover: '#689f38'
}, {
  id: 2, tags: ['防守'],
  title: '双重格挡', point: 1, attack: 0, defend: 4,
  description: '若伤害值大于 4 则无法格挡。',
  background_color: '#00bcd4', background_color_hover: '#0097a7'
}, {
  id: 3, tags: ['单体攻击'], need_target: true,
  title: '射击', point: 1, attack: 1, defend: 0,
  description: '造成 1 点伤害。',
  background_color: '#00bcd4', background_color_hover: '#0097a7'
}, {
  id: 4, tags: ['单体攻击', '破防'], need_target: true,
  title: '击剑', point: 2, attack: 2, defend: 0,
  description: '造成 2 点伤害。',
  background_color: '#ffc107', background_color_hover: '#ff6f00'
}, {
  id: 5, tags: ['单体攻击', '破防', '雷电'], need_target: true,
  title: '雷罚', point: 3, attack: 3, defend: 0,
  description: '造成 3 点伤害，可用「避雷」闪避。',
  background_color: '#ff5722', background_color_hover: '#bf360c'
}, {
  id: 6, tags: ['单体攻击', '破防'], need_target: true,
  title: '地裂', point: 4, attack: 4, defend: 0,
  description: '造成 4 点伤害。',
  background_color: '#ab47bc', background_color_hover: '#6a1b9a'
}, {
  id: 7, tags: ['AOE'],
  title: '刃波 I', point: 1, attack: '*1', defend: 0,
  description: '对除你之外的全体玩家造成接近 1 点的伤害。',
  background_color: '#00bcd4', background_color_hover: '#0097a7'
}, {
  id: 8, tags: ['AOE', '抵防'],
  title: '刃波 II', point: 2, attack: '*2', defend: 0,
  description: '对除你之外的全体玩家造成接近 2 点的伤害。',
  background_color: '#ffc107', background_color_hover: '#ff6f00'
}, {
  id: 9, tags: ['AOE', '破防'],
  title: '刃波 III', point: 3, attack: '*3', defend: 0,
  description: '对除你之外的全体玩家造成接近 3 点的伤害。',
  background_color: '#ff5722', background_color_hover: '#bf360c'
}, {
  id: 10, tags: ['AOE', '破防', '雷电'],
  title: '雷狱', point: 4, attack: '*4', defend: 0,
  description: '对除你之外的全体玩家造成接近 4 点的伤害，可用「避雷」闪避',
  background_color: '#ab47bc', background_color_hover: '#6a1b9a'
}, {
  id: 11, tags: ['防守', '反甲'],
  title: '荆棘 I', point: 1, attack: '0-1', defend: '*2',
  description: '如果受到的伤害在 0~1 之间，那么造成的伤害等于受到的伤害。否则如果受到超过 1 的伤害，那么将无法反弹，只能起到格挡的作用。',
  background_color: '#00bcd4', background_color_hover: '#0097a7'
}, {
  id: 12, tags: ['防守', '反甲'],
  title: '荆棘 II', point: 2, attack: '0-2', defend: '*3',
  description: '如果受到的伤害在 0~2 之间，那么造成的伤害等于受到的伤害。否则如果受到超过 2 的伤害，那么将无法反弹，只能起到格挡的作用。',
  background_color: '#ffc107', background_color_hover: '#ff6f00'
}, {
  id: 13, tags: ['防守', '反甲'],
  title: '荆棘 III', point: 3, attack: '0-3', defend: '4',
  description: '如果受到的伤害在 0~3 之间，那么造成的伤害等于受到的伤害。否则如果受到超过 3 的伤害，那么将无法反弹，只能起到格挡的作用。',
  background_color: '#ff5722', background_color_hover: '#bf360c'
}, {
  id: 14, tags: ['防守', '特殊'],
  title: '避雷', point: 1, attack: 0, defend: 0,
  description: '雷罚和雷狱对你无效。',
  background_color: '#00bcd4', background_color_hover: '#0097a7'
}];

const Move = {
  CLAP: 0,
  DEFEND: 1,
  STRONG_DEFEND: 2,
  SHOOT: 3,
  SLASH: 4,
  LIGHTNING_STRIKE: 5,
  EARTHQUAKE: 6,
  SWEEP_I: 7,
  SWEEP_II: 8,
  SWEEP_III: 9,
  LIGHTNING_STORM: 10,
  THORNS_I: 11,
  THORNS_II: 12,
  THORNS_III: 13,
  LIGHTNING_ARRESTER: 14
};

class Movement extends MovementClass {
  constructor(config) {
    super(config);
  }
  isThorns () {
    return (mv => mv === Move.THORNS_I || mv === Move.THORNS_II || mv === Move.THORNS_III)(this.getId());
  }
};

class Game extends GameClass {
  constructor(config) {
    super(config);
  }
  /**
   * 计算前者对后者的伤害（在前者的攻击目标是后者的情况下）
   * @param {Movement} emitter_movement
   * @param {Movement} target_movement
   * @param {boolean} effective 前者是否命中后者
   * @param {boolean} reverse_effective 后者是否命中前者
   * @return {number} 
   * @memberof Game
   */
  calculateEffect (emitter_movement, target_movement, effective, reverse_effective) {
    switch (emitter_movement.getId()) { // Attack
      case Move.SWEEP_I:
        return 1 - eps;
      case Move.SWEEP_II:
        return 2 - eps;
      case Move.SWEEP_III:
        return 3 - eps;
      case Move.LIGHTNING_STORM:
        if (target_movement.getId() === Move.LIGHTNING_ARRESTER) return 0;
        else return 4 - eps;
    };
    if (effective) {
      switch (emitter_movement.getId()) { // Attack
        case Move.SHOOT:
          return 1;
        case Move.SLASH:
          return 2;
        case Move.LIGHTNING_STRIKE:
          if (target_movement.getId() === Move.LIGHTNING_ARRESTER) return 0;
          else return 3;
        case Move.EARTHQUAKE:
          return 4;
      }
    }
    if (emitter_movement.isThorns() && !target_movement.isThorns()) { // Thorns
      const atk = this.calculateEffect(target_movement, emitter_movement, reverse_effective, effective);
      switch (emitter_movement.getId()) {
        case Move.THORNS_I:
          if (atk <= 1) return atk * 2;
          else return 0;
        case Move.THORNS_II:
          if (atk <= 2) return atk * 2;
          else return 0;
        case Move.THORNS_III:
          if (atk <= 3) return atk * 2;
          else return 0;
      }
    }
    return 0;
  }
  /**
   * 给出玩家的行动，计算结果
   *
   * @param {Array<{ id: string, move: number, target: string }>} player_movements
   * @return {{ [string]: { move: number, target: string, injury: number, filtered_injury: number, hit: string[], hitted: string[] } }}
   * @memberof Game
   */
  handleTurn (player_movements) {
    const calcRealInjury = (move, injury) => {
      switch (move) {
        case Move.DEFEND:
        case Move.THORNS_I:
          return Math.max(injury - (2 - eps), 0);
        case Move.THORNS_II:
          return Math.max(injury - (3 - eps), 0);
        case Move.STRONG_DEFEND:
        case Move.THORNS_III:
          return Math.max(injury - 4, 0);
        default:
          return injury;
      }
    };

    const effect_map = {};
    const result = {};

    player_movements.forEach(i => {
      effect_map[i.id] = {};
      result[i.id] = {
        move: i.move,
        target: i.target,
        injury: 0,
        filtered_injury: 0,
        hit: [],
        hitted: [],
        delta_point: -this.getMovementById(i.move).getPoint(),
      };
      player_movements.forEach(j => {
        const mi = this.getMovementById(i.move);
        const mj = this.getMovementById(j.move);
        effect_map[i.id][j.id] = this.calculateEffect(mi, mj,
          !mi.needTarget() || i.target === j.id,
          !mj.needTarget() || j.target === i.id);
      });
    });

    player_movements.forEach(i => {
      player_movements.forEach(j => {
        if(j.id !== i.id) {
          const recive = effect_map[j.id][i.id], send = effect_map[i.id][j.id];
          if(recive > send) {
            result[i.id].injury += recive - send;
          }
        }
      });
      result[i.id].filtered_injury = calcRealInjury(i.move, result[i.id].injury);
    });

    player_movements.forEach(i => {
      player_movements.forEach(j => {
        if(j.id !== i.id) {
          const recive = effect_map[j.id][i.id], send = effect_map[i.id][j.id];
          if(send > recive && result[j.id].filtered_injury > 0) {
            result[i.id].hit.push(j.id);
          }
          if(recive > send && result[i.id].filtered_injury > 0) {
            result[i.id].hitted.push(j.id);
          }
        }
      });
    });

    return result;
  }
}

const list = MoveData.map(e => new Movement(e));
const grp = new MovementGroup(list, null);
const game = new Game({
  name: 'Clapping Game: Classic',
  movement_group: grp
});


module.exports = {
  default: game,
  Game,
  grp,
}