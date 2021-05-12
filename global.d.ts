type MoveLog = {
  id: string;
  type: "move";
  from: string;
  to?: string;
  move: number;
  turn: number;
};
type DieLog = { id: string; type: "die"; die: string; turn: number };
type MsgLog = { id: string; type: "msg"; text: string; turn: number };
type WinLog = { id: string; type: "win"; win: string; turn: number };
type BattleLog = MoveLog | DieLog | MsgLog | WinLog;

type MovementData = {
  id: number;
  title: string | object;
  description: string | object;
  need_target: boolean;
  point: number;
  attack?: number;
  defend?: number;
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