#!/bin/zsh
# Double-click me to start Dreamcast, then visit http://localhost:8642
cd "$(dirname "$0")"
open "http://localhost:8642"
node serve.mjs
