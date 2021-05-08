# Clapping Game (Game Server)

这里是有关游戏逻辑实现的代码

`Room` 对象的主要任务是维护游戏逻辑的实现。`Player` 对象充当玩家，而 `Client` 充当用户。

本质上是 `Client` 和 `Room` 发送指令改变 `Player` 的状态，而 `Player` 发送指令到 `Client` 请求交互。

如果断线重连，那么新建一个 client 与 player 重新绑定一下即可。检查 player 的状态就可以还原当时的场景。