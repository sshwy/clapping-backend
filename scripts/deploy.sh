#!/bin/zsh
yarn build-dev
cd dist
git init
git remote add deploy-server git@sshwy.name:clapping-game.git
git add .
git commit -m "Update at $(date "+%Y-%m-%d %H:%M:%S")"
git push -f deploy-server master
