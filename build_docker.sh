#!/bin/bash
echo_error() {
  echo -e "\033[31m$1\033[0m"
}
echo_info() {
  echo -e "\033[34m$1\033[0m"
}

IMAGE_REPO='clapping-game'

echo_info "Already built images:"

echo ""
docker images $IMAGE_REPO --format "{{.Repository}}:{{.Tag}} ({{.Size}})"
echo ""

echo -n "Input version tag for current image build (e.g. 0.1.0-alpha):"
read INPUT_VERSION

if [[ -z $INPUT_VERSION ]]; then # empty
  echo_error "\033[31minvaild empty tag!\033[0m"
  exit 1
fi

echo -e "Your image tag will be \033[32m$IMAGE_REPO:$INPUT_VERSION\033[0m."
echo -ne "Would you like to continue? [Y/n]:"

read CONFIRM

if [ "$CONFIRM" = "n" ]; then
  echo "Canceled."
  exit 0
fi

docker build --tag $IMAGE_REPO:$INPUT_VERSION .

echo_info "Done."
