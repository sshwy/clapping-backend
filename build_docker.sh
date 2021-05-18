#!/bin/bash

# Functions

echo_error() {
  echo -e "\033[31m$1\033[0m"
}
echo_info() {
  echo -e "\033[34m$1\033[0m"
}

# Variables

IMAGE_REPO='clapping-game-backend'

CURRENT_VERSION=$(git tag | sort --version-sort | tail -1)

if [[ -z $CURRENT_VERSION ]]; then # empty
  CURRENT_VERSION='0.0.0'
fi

# Interaction start

echo_info "Already built images:"

echo ""
docker images $IMAGE_REPO --format "{{.Repository}}:{{.Tag}} ({{.Size}})"
echo ""

echo -ne "Input version tag for current image build (default: \033[32m$CURRENT_VERSION\033[0m):"
read INPUT_VERSION

if [[ -z $INPUT_VERSION ]]; then # empty
  INPUT_VERSION=$CURRENT_VERSION
fi

echo -e "Your image tag will be \033[32m$IMAGE_REPO:$INPUT_VERSION\033[0m."
echo -ne "Would you like to continue? [Y/n]:"

read CONFIRM

if [ "$CONFIRM" = "n" ]; then
  echo "Canceled."
  exit 0
fi

yarn install
yarn build

docker build --tag $IMAGE_REPO:$INPUT_VERSION .

echo_info "Done."
