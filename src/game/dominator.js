const Checklist = require('./revive_2').Game;
const MovementClass = require('./classic').Movement;
const { MovementGroup } = require('../types');

const MoveData = [
  ...require('./classic').MoveData,
  {
    id: 15, tags: [], need_dead_target: true,
    title: '复活', point: 0, attack: 0, defend: 0,
    description: '复活一个场上已死亡的人，并在此回合内给其一点防御值。',
    background_color: '#8bc34a', background_color_hover: '#689f38',
    image_list: ['/resouce/image/game-classic/REVIVE.png'],
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

class Dominator extends Checklist {
  constructor(config) {
    super(config);
  }
  /**
   * @param {Array<{ id: string, move: number, target: string }>} player_movements
   * @param {{ turn: number }} config
   * @return {{ [string]: { move: number, target: string, injury: number, filtered_injury: number, hit: string[], hitted: string[], alive: boolean } }}
   * @memberof GainPointByKill
   */
  handleTurn (player_movements, config) {
    const data = super.handleTurn(player_movements, config);
    player_movements.forEach(i => {
      if(this.getMovementById(i.move)?.isRevive()) {
        data[i.target].alive = true; // 复活
      }
    });
    return data;
  }
};

const list = MoveData.map(e => new Movement(e));
const grp = new MovementGroup(list, null);
const game = new Dominator({
  name: 'Clapping Game: Dominator',
  description: '支配：复活！',
  movement_group: grp
});

module.exports = {
  Game: Dominator,
  default: game,
}