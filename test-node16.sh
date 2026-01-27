#!/bin/bash
# Script para testear con Node 16.20.2

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Cambiar a Node 16.20.2
nvm use 16.20.2

# Ejecutar el test
node src/test/scraper-5-causas.js "$@"
