#!/bin/bash

# imagine your now under ./dist/ (with pm2 installed)

echo Setup game server ...
pm2 start clapping-game-app.js
