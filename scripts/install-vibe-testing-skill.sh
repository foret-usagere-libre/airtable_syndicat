#!/usr/bin/env bash
set -euo pipefail

SKILL_REPO_URL="https://github.com/knot0-com/vibe-testing.git"
SKILL_NAME="vibe-testing"
CODEX_HOME_DIR="${CODEX_HOME:-$HOME/.codex}"
DEST_DIR="${CODEX_HOME_DIR}/skills/${SKILL_NAME}"

if [ -d "${DEST_DIR}" ]; then
  echo "Skill '${SKILL_NAME}' already exists at: ${DEST_DIR}"
  echo "Remove it first if you want a fresh install."
  exit 1
fi

mkdir -p "$(dirname "${DEST_DIR}")"

git clone "${SKILL_REPO_URL}" "${DEST_DIR}"

echo "Installed '${SKILL_NAME}' to ${DEST_DIR}"
echo "Restart Codex to pick up new skills."
