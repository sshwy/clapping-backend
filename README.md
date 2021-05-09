# 拍手游戏（The Clapping Game）

拍手游戏！童年回忆之一。

建议人数：3~6 人

## 游戏规则

首先介绍经典版的游戏规则。

### 游戏流程

回合制生存类游戏，活到最后的是赢家。

每一轮按顺序发生下列过程：

- 所有玩家**同时**做出一步行动。
- 判定玩家生死状况，在这一轮死掉的玩家无法参与之后的游戏。
- 若场上还剩下 $\le 1$ 个玩家，游戏结束。

### 玩家行动

玩家行动依赖积累的行动点（moving point），也称“气”数。

- 消耗 0 行动点：聚气、格挡。
- 消耗 1 行动点：射击、双重格挡、荆棘 I（小弹）、刃波 I（小扫）、避雷。
- 消耗 2 行动点：剑击（竖劈）、荆棘 II（中弹）、刃波 II（横扫）。
- 消耗 3 行动点：雷罚（咔嚓）、荆棘 III（大弹）、刃波 III（横劈）。
- 消耗 4 行动点：雷狱（冰天）、地裂。

接下来是详细描述。

注：括号里从左到右分别是消耗的行动点、造成的伤害、挡住的伤害上限。

- 聚气（clap）[0/0/0]：增加一点行动力。
- 格挡（defend）[0/0/<2]：若伤害值 >=2 则无法格挡。
- 双重格挡（strong defend）[1/0/4]：若伤害值 >4 则无法格挡。
- 射击（shoot）[1/1/0]：指定一名玩家对其造成 1 点伤害。
- 剑击（slash）[2/2/0]：指定一名玩家对其造成 2 点伤害。
- 雷罚（lightning strike）[3/3/0]：指定一名玩家对其造成 3 点伤害。
- 地裂（earthquake）[4/4/0]：指定一名玩家对其造成 4 点伤害。
- 刃波 I（sweep I）[1/<1/0]：对除你之外的全体玩家造成接近 1 点的伤害。
- 刃波 II（sweep II）[2/<2/0]：对除你之外的全体玩家造成接近 2 点的伤害。
- 刃波 III（sweep III）[3/<3/0]：对除你之外的全体玩家造成接近 3 点的伤害。
- 雷狱（lightning storm）[4/<4/0]：对除你之外的全体玩家造成接近 4 点的伤害。
- 荆棘 I（thorns I）[1/0~1/<2]：如果受到的伤害在 0~1 之间，那么造成的伤害等于受到的伤害。否则如果受到超过 1 的伤害，那么将无法反弹，只能起到格挡的作用。
- 荆棘 II（thorns II）[2/0~2/<3]：如果受到的伤害在 0~2 之间，那么造成的伤害等于受到的伤害。否则如果受到超过 2 的伤害，那么将无法反弹，只能起到格挡的作用。
- 荆棘 III（thorns III）[3/0~3/4]：如果受到的伤害在 0~3 之间，那么造成的伤害等于受到的伤害。否则如果受到超过 3 的伤害，那么将无法反弹，只能起到格挡的作用。
- 避雷（lightning arrester）[1/0/0]：雷罚和雷狱对你无效。

### 伤害计算

我们设 **Attack(u)** 表示玩家 u 这一轮执行的行动。

设 **Effect(u, v)** 表示玩家 u 的行动对玩家 v 造成的伤害（如果是单体攻击且 u 没有指向 v 那么伤害就是 0）。

那么我们认为，玩家 u 对玩家 v 造成的伤害值为 **max(Effect(u, v) - Effect(v, u), 0)**。

而玩家 u 受到的伤害值则为所有其他玩家对他造成的伤害之和。

## 状态管理

### 回合状态

```sequence
Server (Game) -> Client: Game Start (with status)
Note right of Client: 客户端进入游戏状态
Client -> Server (Game): OK
```



```sequence
Note left of Server (Game): 回合内
Note left of Server (Game): 服务器推送请求
Server (Game) -> Client: Request Movement (with status)
Note right of Client: 客户端由用户操作后返回数据
Client -> Server (Game): Movement
Note left of Server (Game): 等待所有客户返回数据
Server (Game) -> Client: Battle Data
Note right of Client: 展示局面变化
Client -> Server (Game): Finish Animation
Note left of Server (Game): 回合结束
```



```sequence
Note left of Server (Game): 游戏结束时
Server (Game) -> Client: Game Over (with status)
Note right of Client: 客户端展示游戏结果
Client -> Server (Game): Quit
Server (Game) -> Server (Manager): Player Quit
```



### 用户鉴权

```sequence
Client -> Server (Auth): Login/Logout with name
Server (Auth) --> Client: Rejected (duplicated name)
Server (Auth) -> Server (User): Active/Dactive
Server (User) --> Server (Auth): Done
Server (Auth) --> Client: Done
```

### 房间相关操作

```sequence
Client -> Server (Manager): Room Operation
Note right of Server (Manager): 执行房间相关操作
Server (Manager) --> Client: Done (with data returned)
```

### 游戏开始

```sequence
Client -> Server (Manager): All ready
Server (Manager) -> Server (Game): Start Game
Note right of Server (Game): 游戏中
Server (Game) -> Server (Manager): User Quit.
Client -> Server (Manager): Fetch Status
Server (Manager) --> Client: Data
```

### 玩家状态

```mermaid
graph TD

A(Initialized) ---|Join/Leave Room| B(Roomed)
B -->|Get/Cancel Ready| C(Ready)
C -->|Game Start| D(Listening)
D -->|Terminate| F(Watching) 
F -->|Client/Roomer: Quit| B
D -->|Roomer: Request Movement| G(Acting)
G -->|Client: Movement| E(Submited)
E -->|Roomer: Result| H(Drawing)
H -->|Client: Finished Drawing| D
```

### 房间状态

```mermaid
graph TD;

A(Initialized)
A -->|All Players Ready| B(Playing)
B -->|Request Movement| C(Waiting)
C -->|All Players Responsed| B
B -->|Game Over| A
```
