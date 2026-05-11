#!/usr/bin/env bash
set -Eeuo pipefail

sudo apt-get update
sudo apt-get install -y zsh git curl wget jq unzip vim ca-certificates gnupg lsb-release
npm install -g pnpm @nestjs/cli @angular/cli

{
  echo "alias k='kubectl'"
  echo "alias deploy='gh workflow run main.yml --ref main'"
  echo "alias logs='docker compose logs -f --tail=200'"
  echo "alias dcu='docker compose up --build'"
  echo "alias dcd='docker compose down --remove-orphans'"
  echo "alias nix-develop='nix develop'"
  echo "alias devshell='nix develop'"
} >> ~/.zshrc

if ! command -v nix >/dev/null 2>&1; then
  echo "Nix is not installed in this Dev Container. Use the built-in devcontainer toolchains, or install Nix on the host and run 'nix develop' there."
fi
