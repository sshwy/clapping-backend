const { RoomStatus, Move, PlayerStatus } = require('../vars');
const logg = require('../logger');
const { assert, randomId } = require('../utils');
const { calcEffect, eps } = require('./logic');
const { RoomClass, PlayerClass } = require('./types');

/**
 * @class Room
 * @extends {RoomClass}
 */
class Room extends RoomClass {
  constructor(id) {
    super(id);

    this.stat = RoomStatus.PREPARING;
    this.log = logg.getLogger(`Room ${id}`);
    this.log.info('Created.');
  }
  getInfo () {
    return {
      id: this.id,
      turn: this.turn,
      leader: this.leader,
      battle_log: this.battleLogList,
      players: this.players.map(e => ({
        id: e.data.id,
        name: e.data.name,
        stat: e.stat,
        point: e.data.movePoint,
      })),
    };
  }
  handleEvent (event) {
    if (event === 'player ready') {
      if (this.ready_timeout) clearTimeout(this.ready_timeout);
      this.ready_timeout = setTimeout(() => {
        if (this.players.length > 1 && this.ready()) {
          this.startGame();
        }
      }, 1000);
    } else if (event === 'player cancel ready') {
      // do nothing.
    }
  }
  registerPlayer (player) {
    return new Promise((resolve, reject) => {
      if (this.stat !== RoomStatus.PREPARING) {
        player.handleRegisterRoomFailed();
        return reject('can not join');
      }
      assert(this.players.every(e => e.getId() !== player.getId()));
      this.log.info(`Register player [${player.data.name}]`);
      this.players.push(player);
      if (this.leader === "") {
        this.leader = player.data.id;
      }
      player.registerRoom(this);
      resolve('ok');
    });
  }
  unregisterPlayer (player) {
    assert(this.stat === RoomStatus.PREPARING);
    this.log.info(`Unregister player [${player.data.name}]`);
    this.players = this.players.filter(e => e.getId() !== player.getId());
    if (this.leader === player.data.id) {
      if (this.players.length) {
        this.leader = this.players[0].data.id;
      } else {
        this.leader = "";
      }
    }
    player.unregisterRoom();
  }
  /**
   * 检查是否全部准备好了（不发出询问）
   */
  ready () {
    assert(this.stat === RoomStatus.PREPARING);
    return this.players.every(e => e.stat === PlayerStatus.READY);
  }
  startGame () {
    const runTurn = async () => {
      this.turn++;
      this.log.info(`Round ${this.turn}`);
      this.log.info('still alive:', this.alive_players.map(e => `${e.data.name}(${e.data.movePoint})`).join(', '));

      const res = await this.requestMovement();

      let aw = new Array(this.alive_players.length);

      for (let i = 0; i < aw.length; i++)
        aw[i] = new Array(this.alive_players.length);

      const movement_map = {};

      this.alive_players.forEach((pA, i) => {
        movement_map[pA.data.id] = res[i];
        this.alive_players.forEach((pB, j) => {
          aw[i][j] = calcEffect(pA, res[i], pB, res[j]);
        });
      });

      let injury = new Array(this.alive_players.length);
      this.alive_players.forEach((pA, i) => {
        injury[i] = 0;
        this.alive_players.forEach((pB, j) => {
          if (j != i) {
            injury[i] += Math.max(aw[j][i] - aw[i][j], 0);
          }
        });
      });

      const calcRealInjury = i => {
        switch (res[i].move) {
          case Move.DEFEND:
          case Move.THORNS_I:
            return Math.max(injury[i] - (2 - eps), 0);
          case Move.THORNS_II:
            return Math.max(injury[i] - (3 - eps), 0);
          case Move.STRONG_DEFEND:
          case Move.THORNS_III:
            return Math.max(injury[i] - 4, 0);
          default:
            return injury[i];
        }
      };

      const deadPlayers = this.alive_players.filter((player, i) => calcRealInjury(i) > eps * 0.1);
      const nextRoundPlayers = this.alive_players.filter((player, i) => !(calcRealInjury(i) > eps * 0.1));

      const appendLog = this.alive_players.map(e => e.data).map((e, idx, arr) => {
        const mv = movement_map[e.id];
        const tar = mv.target
          ? arr.filter((e) => e.id === mv.target)[0].name
          : "";
        return {
          type: 'move',
          id: `move-${e.id}-${mv.move}-${tar}-${this.turn}`,
          from: e.name,
          move: mv.move,
          to: tar,
          turn: this.turn,
        };
      });
      const deads = deadPlayers.map(e => e.getStatus()).map((e) => {
        return {
          type: 'die',
          id: `die-${e.self.id}-${this.turn}`,
          die: e.self.name,
          turn: this.turn,
        };
      });

      const newLogs = [...deads, ...appendLog];

      if(nextRoundPlayers.length === 1) {
        const winner = nextRoundPlayers[0];
        newLogs.unshift({
          type: 'win',
          id: `win-${winner.data.id}-${this.turn}`,
          die: winner.data.name,
          turn: this.turn,
        });
      } else if(nextRoundPlayers.length === 0) {
        newLogs.unshift({
          type: 'msg',
          id: `message-${randomId()}-${this.turn}`,
          text: '全部木大（憨笑）',
          turn: this.turn,
        });
        // to do
      }

      this.addBattleLog(...newLogs);

      this.alive_players.forEach(player => {
        player.handleEvent({
          prevStat: PlayerStatus.SUBMITED,
          nextStat: PlayerStatus.DRAWING,
          from: 'roomer',
          data: {
            event_name: 'player draw',
            movement_map: movement_map,
            logs: newLogs,
          },
        });
      });

      this.players.filter(e => e.stat === PlayerStatus.WATCHING).forEach(player => {
        player.handleEvent({
          prevStat: PlayerStatus.WATCHING,
          nextStat: PlayerStatus.WATCHING,
          from: 'roomer',
          data: {
            event_name: 'watcher draw',
            movement_map: movement_map,
            logs: newLogs,
          },
        });
      });

      const waiter = new Promise((resolve, reject) => {
        var itv = setInterval(() => {
          if (this.alive_players.every(e => e.stat === PlayerStatus.LISTENING)) {
            clearInterval(itv);
            resolve('ok');
          }
        }, 1000);
      });

      this.log.info('Waiting for drawing...');
      await waiter;


      deadPlayers.forEach(player => {
        player.dead();
      })

      this.alive_players = nextRoundPlayers;
    };

    return new Promise((resolve, reject) => {
      (async () => {
        // init
        assert(this.stat === RoomStatus.PREPARING);
        this.log.info(`Game start`);
        this.stat = RoomStatus.PLAYING;
        this.battleLogList = [];
        this.turn = 0;
        /** @type {Array<PlayerClass>} */
        this.alive_players = this.players;
        this.players.forEach(e => {
          e.gamePrepare();
        });

        this.players[0].client.roomEmit('room info ingame', this.getInfo());

        // play
        while (this.alive_players.length > 1) {
          await runTurn();
        }
        if (this.alive_players.length) {
          this.alive_players[0].win();
        }

        // end
        setTimeout(() => { // wait for 5s
          this.stat = RoomStatus.PREPARING;
          this.players.forEach(e => e.quitGame());
          this.players[0].client.roomEmit('room info', this.getInfo());
          resolve('ok');
        }, 3000);
      })();
    });
  }
  handleMovement ({ from, data }) {
    this._response_rest_counter--;
    this._response[this.alive_players.findIndex(e => e.data.id === from)] = data;
  }
  requestMovement () {
    this._response = new Array(this.alive_players.length);
    this._response_rest_counter = this.alive_players.length;

    return new Promise((resolve, reject) => {
      this.alive_players.forEach(e => e.handleEvent({
        prevStat: PlayerStatus.LISTENING,
        nextStat: PlayerStatus.ACTING,
        from: 'roomer',
        data: {
          event_name: 'request movement'
        },
      }));
      this.alive_players[0].client.roomEmit('room info ingame', this.getInfo());
      const checker = setInterval(() => {
        if (this._response_rest_counter === 0) {
          clearInterval(checker);
          resolve(this._response);
        }
      }, 1000);
    });
  }
}

module.exports = Room;