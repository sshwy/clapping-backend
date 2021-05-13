#!/bin/zsh

rm -rf ./dist/
yarn build-dev

cp ./scripts/serve.sh ./dist/

echo Deploy to server...

cd dist
git init
git remote add deploy-server git@sshwy.name:clapping-game.git
git add .
git commit -m "Update at $(date "+%Y-%m-%d %H:%M:%S")"
git push -f deploy-server master
