#!/bin/bash
set -eux

# Check if entr is installed
if ! command -v entr &> /dev/null
then
    echo "entr could not be found, installing with Homebrew..."
    brew install entr
fi

COMPILE_SCRIPT=$(dirname "${BASH_SOURCE[0]}")/openapi-compile.sh
DOCS_DIR=$(realpath $(dirname "${BASH_SOURCE[0]}")/../)
# Run the compile script every 5 minutes
while true; do
    $COMPILE_SCRIPT $DOCS_DIR
    sleep 300
done
