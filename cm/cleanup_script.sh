#!/bin/bash
# Trace commands as we run them:
set -x

pid=$(sudo lsof -t -i:9001)
sudo kill -9 $pid || true

pid=$(sudo lsof -t -i:8080)
sudo kill -9 $pid || true

pid=$(sudo pgrep chrome)
sudo kill -9 $pid || true