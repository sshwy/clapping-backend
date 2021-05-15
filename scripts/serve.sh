#!/bin/bash

# imagine your now under ./dist/ (with pm2 installed)

echo Installing depedencies...
/home/git/.nvm/versions/node/v16.1.0/bin/npm install

echo Setup game server ...
/home/git/.nvm/versions/node/v16.1.0/bin/pm2 start clapping-game-app.js
