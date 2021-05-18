#!/bin/bash
# Exit on error
set -e
# Trace commands as we run them:
set -x
# Script used to initialize your ansible server after provisioning.
sudo add-apt-repository ppa:ansible/ansible -y
sudo apt-get update -y
sudo apt install python3-pip -y
sudo pip3 install ansible
ansible-galaxy collection install community.mongodb
sudo pip3 install pymongo
sudo ansible-galaxy install kwoodson.yedit