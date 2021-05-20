interface LogType {
  id: string;
  type: string;
  turn: number;
}
interface MoveLog extends LogType {
  from?: string;
  to?: string;
  move?: number;
}
interface DieLog extends LogType {
  die?: string;
}
interface MsgLog extends LogType {
  from?: string;
  text?: string;
}
interface WinLog extends WinLog {
  win?: string;
}

type BattleLog = MoveLog | DieLog | MsgLog | WinLog;

type MovementData = {
  id: number;
  title: string | object;
  description: string | object;
  need_target?: boolean;
  need_dead_target?: boolean;
  point: number;
  attack?: number | string;
  defend?: number | string;
  tags: string[];
  image_list: string[];
  background_color?: string;
  background_color_hover?: string;
};

type ResponseMovement = {
  id?: string;
  move: number;
  target: string;
};

type ResponseMovementMap = {
  [id: string]: ResponseMovement;
};

type PlayerResultMap = {
  [id: string]: {
    move: number;
    target: string;
    injury: number;
    filtered_injury: number;
    hit: string[];
    hitted: string[];
    delta_point: number;
  };
};

type TurnResult = {
  player_result: PlayerResultMap;
  log: BattleLog[]; // 这一回合新増的日志
  alive: string[]; // 这一回合后存活（复活）的玩家的 ID
  deads: string[]; // 正好这一回合死
};
type TurnConfig = {
  turn: number;
  player_list: any[];
};

/*declare class PlayerClass {
  constructor(config: { name: string; id: string });
  handleEvent(event: {
    prevStat: number;
    nextStat: number;
    data: any;
    from: string;
  }): void;
  getStatus();
  getId();
  registerRoom(room: RoomClass);
  unregisterRoom(room: RoomClass);
}

declare class RoomClass {
  constructor(id: number);
  id: number;
  players: PlayerClass[];
  leader: string;
  battleLogList: BattleLog[];
  getInfo();
  handleEvent(event: any);
  registerPlayer(player: PlayerClass);
  unregisterPlayer(player: PlayerClass);
  addBattleLog(...list: BattleLog[]);
}

declare class ClientClass {
  constructor(config: {
    socket: any,
    player: PlayerClass,
  }) 
  roomEmit (...args) { }
  reHandle () { }
}*/
