const { RoomStatus, Move, PlayerStatus } = require('./vars');
const logg = require('./logger');
const { assert, randomId } = require('./utils');
const { RoomClass, PlayerClass } = require('./types');
const game_list = require('./game');

/**
 * @class Room
 * @extends {RoomClass}
 */
class Room extends RoomClass {
  constructor(id) {
    super(id);

    this.game = game_list[0];
    this.game_id = 0;
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
      game_id: this.game_id,
      players: this.players.map(e => ({
        id: e.data.id,
        name: e.data.name,
        stat: e.stat,
        point: e.data.movePoint,
      })),
    };
  }
  handleEvent (event, cb) {
    if (event.event_name === 'player ready') {
      if (this.ready_timeout) clearTimeout(this.ready_timeout);
      this.ready_timeout = setTimeout(() => {
        if (this.players.length > 1 && this.ready()) {
          this.startGame();
        }
      }, 1000);
    } else if (event.event_name === 'player cancel ready') {
      // do nothing.
    } else if (event.event_name === 'choose game') {
      this.game = game_list[event.game_id];
      this.game_id = event.game_id;
    }
    if (cb !== undefined) cb();
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
      clearTimeout(this.req_movement_time_limit);

      // console.log('res', res);
      const movements = res.map((e, index) => ({
        id: this.alive_players[index].getId(),
        move: e.move,
        target: e.target,
      }));
      const data = this.game.handleTurn(movements, {
        turn: this.turn,
      });

      // console.log('data', data);

      const deadPlayers =
        this.alive_players.filter(player => data[player.getId()].filtered_injury > 0);
      const nextRoundPlayers =
        this.alive_players.filter((player, i) => !(data[player.getId()].filtered_injury > 0));

      const appendLog = this.alive_players.map(e => e.data).map((e, idx, arr) => {
        const mv = data[e.id];
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
          by: data[e.self.id].hitted.map(id => this.alive_players.find(e => e.getId() === id)?.data.name || id),
            // 找不到 player 的话说明是其他原因
          turn: this.turn,
        };
      });

      const newLogs = [...deads, ...appendLog];

      if (nextRoundPlayers.length === 1) {
        const winner = nextRoundPlayers[0];
        newLogs.unshift({
          type: 'win',
          id: `win-${winner.data.id}-${this.turn}`,
          win: winner.data.name,
          turn: this.turn,
        });
      } else if (nextRoundPlayers.length === 0) {
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
          nextStat: PlayerStatus.LISTENING,
          from: 'roomer',
          data: {
            event_name: 'player draw',
            movement_map: data,
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
            movement_map: data,
            logs: newLogs,
          },
        });
      });

      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve('ok');
        }, 2000);
      });

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
          event_name: 'request movement',
          timeout: new Date().getTime() + 15000,
        },
      }));
      this.alive_players[0].client.roomEmit('room info ingame', this.getInfo());
      const checker = setInterval(() => {
        if (this._response_rest_counter === 0) {
          clearInterval(checker);
          resolve(this._response);
        }
      }, 1000);
      this.req_movement_time_limit = setTimeout(() => {
        this.alive_players.forEach(player => {
          if (player.stat === PlayerStatus.ACTING) { // time out
            player.handleEvent({
              prevStat: PlayerStatus.ACTING,
              nextStat: PlayerStatus.SUBMITED,
              from: 'roomer',
              data: {
                event_name: 'force movement',
                movement: { // do CLAP
                  move: 0,
                  target: ''
                },
              },
            });
          }
        });
        this.alive_players[0].client.roomEmit('room info ingame', this.getInfo());
      }, 15000 + 1000); // 15s
    });
  }
}

module.exports = Room;