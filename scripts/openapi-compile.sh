#!/bin/bash
set -eux

# Check if yq is installed, if not, install it using Homebrew
if ! command -v yq &> /dev/null
then
    echo "yq could not be found, installing via Homebrew..."
    if ! command -v brew &> /dev/null
    then
        echo "Homebrew is not installed. Please install Homebrew first."
        exit 1
    fi
    brew install yq
fi

DOCS_DIR=$1
curl -s https://sourcegraph.sourcegraph.com/assets/public-openapi.yaml | yq eval -o=json - > "$DOCS_DIR"/src/components/openapi/openapi.Sourcegraph.Latest.json
