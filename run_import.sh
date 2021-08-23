#!/usr/bin/env bash

# Load nvm
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 14.17.5

# now node works
node -e "console.log('Node version:')"
node --version

# npm works too!
node -e "console.log('npm version:')"
npm --version

node src/index.js > run_import.log