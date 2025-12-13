#!/usr/bin/env bash
# Docker Cleanup and System Maintenance Script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Defaults
PRUNE_BUILDER=false
PRUNE_PNPM=false
DEEP_CLEAN=false

usage() {
  cat <<USAGE
System Cleanup CLI

Usage:
  scripts/docker-clean.sh [options]

Options:
  --builder               Remove buildx builders (fixes bloated cache)
  --pnpm                  Prune pnpm store
  --deep                  Deep clean (remove all unused images, not just dangling)
  -h, --help              Show this help

Examples:
  # Routine cleanup (dangling images, build cache)
  scripts/docker-clean.sh

  # Deep clean (including builders and unused images)
  scripts/docker-clean.sh --deep --builder
USAGE
}

log() { echo -e "${BLUE}$*${NC}"; }
ok() { echo -e "${GREEN}$*${NC}"; }
warn() { echo -e "${YELLOW}$*${NC}"; }

# Parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --builder)
      PRUNE_BUILDER=true; shift ;;
    --pnpm)
      PRUNE_PNPM=true; shift ;;
    --deep)
      DEEP_CLEAN=true; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown option: $1"; usage; exit 1 ;;
  esac
done

log "🧹 Starting System Cleanup..."
echo "=================================="

# Show initial space
INITIAL_USAGE=$(df -h / | awk 'NR==2 {print $4}')
echo "Free Space (Start): ${INITIAL_USAGE}"
echo ""

# 1. Standard Docker Prune
log "📦 Pruning Docker System (Dangling images, stopped containers, networks)..."
if [[ "$DEEP_CLEAN" == true ]]; then
  # -a removes all unused images, not just dangling
  docker system prune -a -f --volumes
else
  docker system prune -f
fi
ok "✅ System prune complete"

# 2. Builder Prune (Cache)
log "🏗️  Pruning Docker Builder Cache..."
docker builder prune -f
ok "✅ Builder cache pruned"

# 3. Remove Buildx Builder (Optional - for bloated state)
if [[ "$PRUNE_BUILDER" == true ]]; then
  log "🏗️  Removing 'multicore' buildx builder..."
  if docker buildx inspect multicore >/dev/null 2>&1; then
    docker buildx rm multicore
    ok "✅ Builder removed"
  else
    warn "⚠️  Builder 'multicore' not found"
  fi
fi

# 4. PNPM Store Prune
if [[ "$PRUNE_PNPM" == true ]]; then
  log "📦 Pruning PNPM Store..."
  pnpm store prune
  ok "✅ PNPM store pruned"
fi

echo ""
# Show final space
FINAL_USAGE=$(df -h / | awk 'NR==2 {print $4}')
ok "🎉 Cleanup Completed!"
echo "Free Space (End):   ${FINAL_USAGE}"
