#!/usr/bin/env bash
# Docker Build CLI: build and optionally push images via flags

set -Eeuo pipefail
IFS=$'\n\t'

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Defaults (can be overridden by env or flags)
IMAGE_NAME=${IMAGE_NAME:-tatsuyakari/k-board}
IMAGE_TAG=${IMAGE_TAG:-latest}
PUSH=false
PRUNE=false
NO_CACHE=false
PROGRESS=${PROGRESS:-plain}
TAG_COMMIT=true
VERBOSE=false
LOGIN_CHECK=true
BUILD_ARGS=()

usage() {
  cat <<USAGE
Docker Build CLI

Usage:
  scripts/docker-build-push.sh [options]

Options:
  --image <name>          Image name (default: ${IMAGE_NAME})
  --tag <tag>             Image tag (default: ${IMAGE_TAG})
  --push | --no-push      Push after build (default: --no-push)
  --prune                 Prune unused images after build
  --no-cache              Build without cache
  --progress <mode>       Build progress mode: plain|auto (default: ${PROGRESS})
  --build-arg KEY=VALUE   Add a build arg (repeatable)
  --tag-commit            Also tag with current git commit (default: ${TAG_COMMIT})
  --no-tag-commit         Do not tag with current git commit
  --login-check           Require docker login when pushing (default: ${LOGIN_CHECK})
  --no-login-check        Skip docker login check (useful in CI)
  -v, --verbose           Print commands before running
  -h, --help              Show this help and exit

Examples:
  # Build only
  scripts/docker-build-push.sh --image my/repo --tag dev

  # Build without cache and push
  scripts/docker-build-push.sh --no-cache --push

  # Build with build args
  scripts/docker-build-push.sh \
    --build-arg NODE_ENV=production \
    --build-arg API_URL=https://api.example.com
USAGE
}

log() { echo -e "${BLUE}$*${NC}"; }
warn() { echo -e "${YELLOW}$*${NC}"; }
err() { echo -e "${RED}$*${NC}" 1>&2; }
ok() { echo -e "${GREEN}$*${NC}"; }

run() {
  if [[ "$VERBOSE" == true ]]; then
    echo "+ $*"
  fi
  "$@"
}

# Parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --image)
      IMAGE_NAME="$2"; shift 2 ;;
    --tag)
      IMAGE_TAG="$2"; shift 2 ;;
    --push)
      PUSH=true; shift ;;
    --no-push)
      PUSH=false; shift ;;
    --prune)
      PRUNE=true; shift ;;
    --no-cache)
      NO_CACHE=true; shift ;;
    --progress)
      PROGRESS="$2"; shift 2 ;;
    --build-arg)
      BUILD_ARGS+=("--build-arg" "$2"); shift 2 ;;
    --build-arg=*)
      BUILD_ARGS+=("--build-arg" "${1#*=}"); shift ;;
    --tag-commit)
      TAG_COMMIT=true; shift ;;
    --no-tag-commit)
      TAG_COMMIT=false; shift ;;
    --login-check)
      LOGIN_CHECK=true; shift ;;
    --no-login-check)
      LOGIN_CHECK=false; shift ;;
    -v|--verbose)
      VERBOSE=true; shift ;;
    -h|--help)
      usage; exit 0 ;;
    --)
      # Ignore argument separator passed by some runners (e.g., pnpm)
      shift ;;
    *)
      err "Unknown option: $1"; echo; usage; exit 1 ;;
  esac
done

FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

log "🐳 Docker Build CLI"
echo "=================================="
echo ""

# Check Docker availability
if ! command -v docker >/dev/null 2>&1; then
  err "❌ Docker is not installed or not in PATH"
  exit 1
fi

# Git info
COMMIT_HASH=""
BRANCH=""
if [[ -d .git ]]; then
  COMMIT_HASH=$(git rev-parse --short HEAD || true)
  BRANCH=$(git branch --show-current || true)
  log "📍 Git Info:"
  [[ -n "$BRANCH" ]] && echo "   Branch: ${BRANCH}"
  [[ -n "$COMMIT_HASH" ]] && echo "   Commit: ${COMMIT_HASH}"
  echo ""
fi

log "🔨 Ready to build:"
echo "   Image: ${FULL_IMAGE}"
[[ "$NO_CACHE" == true ]] && echo "   Cache: disabled" || echo "   Cache: enabled"
echo "   Progress: ${PROGRESS}"
[[ ${#BUILD_ARGS[@]} -gt 0 ]] && echo "   Build args: ${BUILD_ARGS[*]}"
echo ""

# Build
log "🔨 Building Docker image..."
echo "=================================="
START_TIME=$(date +%s)

# Check for multicore builder and create if needed
BUILDER_NAME="multicore"
if ! docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1; then
  log "🔧 Creating multi-core builder..."
  docker buildx create --name "$BUILDER_NAME" --driver docker-container --bootstrap --use >/dev/null 2>&1
else
  docker buildx use "$BUILDER_NAME" >/dev/null 2>&1
fi

BUILD_FLAGS=()
[[ "$NO_CACHE" == true ]] && BUILD_FLAGS+=("--no-cache")
BUILD_FLAGS+=("--progress=${PROGRESS}")
# Load image into docker daemon after build
BUILD_FLAGS+=("--load")

# Build command using buildx for parallel layer builds
if [[ -n "$COMMIT_HASH" && "$TAG_COMMIT" == true ]]; then
  run docker buildx build \
    "${BUILD_FLAGS[@]}" \
    "${BUILD_ARGS[@]}" \
    -t "${FULL_IMAGE}" \
    -t "${IMAGE_NAME}:${COMMIT_HASH}" \
    . 2>&1 | tee build.log
else
  run docker buildx build \
    "${BUILD_FLAGS[@]}" \
    "${BUILD_ARGS[@]}" \
    -t "${FULL_IMAGE}" \
    . 2>&1 | tee build.log
fi

BUILD_EXIT_CODE=${PIPESTATUS[0]:-0}

if [[ $BUILD_EXIT_CODE -ne 0 ]]; then
  err "❌ Build failed! Check build.log for details"
  exit 1
fi

END_TIME=$(date +%s)
BUILD_TIME=$((END_TIME - START_TIME))
ok "✅ Build completed in ${BUILD_TIME}s"

# Image size
IMAGE_SIZE=$(docker images "${FULL_IMAGE}" --format '{{.Size}}' || true)
[[ -n "$IMAGE_SIZE" ]] && log "📦 Image size: ${IMAGE_SIZE}"

# Tag with commit if requested and build didn't tag (in case .git appeared late)
if [[ -n "$COMMIT_HASH" && "$TAG_COMMIT" == true ]]; then
  log "🏷️  Ensuring commit tag exists..."
  run docker tag "${FULL_IMAGE}" "${IMAGE_NAME}:${COMMIT_HASH}" || true
  ok "✅ Tagged as ${IMAGE_NAME}:${COMMIT_HASH}"
fi

# Push (optional)
if [[ "$PUSH" == true ]]; then
  echo ""
  log "📤 Pushing to Docker Hub..."
  echo "=================================="

  if [[ "$LOGIN_CHECK" == true ]]; then
    if ! docker info 2>/dev/null | grep -q "Username"; then
      err "⚠️  Not logged in to Docker Hub. Run: docker login"
      exit 1
    fi
  fi

  # Use buildx push for better performance
  run docker push "${FULL_IMAGE}"
  if [[ -n "$COMMIT_HASH" && "$TAG_COMMIT" == true ]]; then
    run docker push "${IMAGE_NAME}:${COMMIT_HASH}" || true
  fi

  ok "✅ Successfully pushed: ${FULL_IMAGE}"
fi

# Prune if requested
if [[ "$PRUNE" == true ]]; then
  echo ""
  log "🧹 Pruning unused images..."
  run docker image prune -f
  ok "✅ Cleanup completed"
fi

# Switch back to default builder after build
docker buildx use default >/dev/null 2>&1 || true

echo ""
log "📋 Deployment Commands:"
echo "=================================="
echo ""
echo "On your server, run:"
echo ""
echo "  docker pull ${FULL_IMAGE}"
echo "  docker-compose down"
echo "  docker-compose up -d"
echo "  docker-compose logs -f app"
echo ""
ok "🎉 Done!"
