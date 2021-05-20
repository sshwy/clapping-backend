const { RoomStatus, PlayerStatus } = require('./vars');
const logg = require('./logger');
const { assert, randomId } = require('./utils');
const { RoomClass, PlayerClass } = require('./types');
const game_list = require('./game');

const turn_timeout = 15000;

/**
 * @class Room
 * @extends {RoomClass}
 */
class Room extends RoomClass {
  /**
   * Creates an instance of Room.
   * @param {number} id 房间编号
   * @memberof Room
   */
  constructor(id) {
    super(id);

    this.game = game_list[0];
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
      this.log.info('still alive:', this.players
        .filter(e => e.stat !== PlayerStatus.WATCHING)
        .map(e => `${e.data.name}(${e.data.movePoint})`).join(', '));

      // Step 1: 获取玩家的所有行动

      /** @type {import('../global').ResponseMovementMap} */
      const res = await this.requestMovement();
      clearTimeout(this.req_movement_time_limit);

      // Step 2: 计算这一局游戏结果
      //   只有活着的玩家才能行动。但是玩家的行动可能会影响到死去的玩家（复活）
      //   为此返回值要包含玩家死活状态

      const turn_config = {
        turn: this.turn,
        player_list: this.players.map(e => e.getStatus()),
      };
      const origin_data = this.game.handleTurn(res, turn_config);
      const [signal, data] = this.game.detectGameOver(origin_data, turn_config);

      const dyingPlayers = // 在这一轮死
        this.players.filter(e => data.deads.includes(e.getId()));
      const lastTurnAlives = this.getAlive().map(e => e.getId());
      const revivePlayers = // 这一轮复活
        this.players.filter(e => !lastTurnAlives.includes(e.getId()) && data.alive.includes(e.getId()));

      this.addBattleLog(...data.log);

      this.players.forEach(player => {
        if (player.stat === PlayerStatus.SUBMITED) {
          player.handleEvent({
            prevStat: PlayerStatus.SUBMITED,
            nextStat: PlayerStatus.LISTENING,
            from: 'roomer',
            data: {
              event_name: 'player draw',
              ...data,
            },
          });
        } else if (player.stat === PlayerStatus.WATCHING) {
          player.handleEvent({
            prevStat: PlayerStatus.WATCHING,
            nextStat: PlayerStatus.WATCHING,
            from: 'roomer',
            data: {
              event_name: 'watcher draw',
              ...data,
            },
          });
        } else throw new Error(`Unknown player stat ${player.stat}`)
      });

      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve('ok');
        }, 2000);
      });

      dyingPlayers.forEach(player => {
        player.dead();
      })
      revivePlayers.forEach(player => {
        player.revive();
      })

      return signal === false;
    };

    return new Promise((resolve, reject) => {
      (async () => {
        // init
        assert(this.stat === RoomStatus.PREPARING);
        this.log.info(`Game start`);
        this.stat = RoomStatus.PLAYING;
        this.battleLogList = [];
        this.turn = 0;
        this.players.forEach(e => {
          e.gamePrepare();
        });

        this.players[0].client.roomEmit('room_info_ingame', this.getInfo());

        // play
        while (await runTurn());

        // end
        setTimeout(() => { // wait for 5s
          this.stat = RoomStatus.PREPARING;
          this.players.forEach(e => e.quitGame());
          this.players[0].client.roomEmit('scene_type', 'room_info');
          this.players[0].client.roomEmit('room_info', this.getInfo());
          resolve('ok');
        }, 3000);
      })();
    });
  }
  getAlive () {
    return this.players.filter(e => e.stat !== PlayerStatus.WATCHING);
  }
  handleMovement ({ from, data }) {
    this._response_rest_counter--;
    this._response[from] = data;
  }
  requestMovement () {
    this._response = {};
    this._response_rest_counter = this.getAlive().length;

    return new Promise((resolve, reject) => {
      this.getAlive().forEach(e => e.handleEvent({
        prevStat: PlayerStatus.LISTENING,
        nextStat: PlayerStatus.ACTING,
        from: 'roomer',
        data: {
          event_name: 'request movement',
          timeout: new Date().getTime() + turn_timeout,
        },
      }));
      this.players[0].client.roomEmit('room_info_ingame', this.getInfo());
      const checker = setInterval(() => {
        if (this._response_rest_counter === 0) {
          clearInterval(checker);
          resolve(this._response);
        }
      }, 1000);
      this.req_movement_time_limit = setTimeout(() => {
        this.players.forEach(player => {
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
        this.players[0].client.roomEmit('room_info_ingame', this.getInfo());
      }, turn_timeout + 500); // 15s
    });
  }
}

module.exports = Room;