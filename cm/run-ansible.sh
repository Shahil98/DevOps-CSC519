#!/bin/bash

# Exit on error
set -e

# Trace commands as we run them:
set -x

# Print error message and exit with error code 1
function die {
    echo "$1"
    exit 1
}

# Check the number of arguments
[ $# -ge 2 ] || die "usage: $0 <playbook> <inventory>"

PLAYBOOK=$1
INVENTORY=$2

sudo cp /bakerx/.vault-pass /home/.vault-pass
sudo chmod 400 /home/.vault-pass

sudo ansible-playbook --vault-password-file /home/.vault-pass $PLAYBOOK -i $INVENTORY