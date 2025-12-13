#!/usr/bin/env bash
# K-Board Quick Access Installer
# Usage: curl -sSL https://raw.githubusercontent.com/tatsuyakari1203/k-board/main/install.sh | bash

set -e

# Configuration
REPO_URL="https://raw.githubusercontent.com/tatsuyakari1203/k-board/main"
COMPOSE_FILE="docker-compose.yml"
APP_NAME="k-board"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo -e "${GREEN}"
echo "  _  __      ____                      _ "
echo " | |/ /     |  _ \                    | |"
echo " | ' /______| |_) | ___   __ _ _ __ __| |"
echo " |  <|______|  _ < / _ \ / _\` | '__/ _\` |"
echo " | . \      | |_) | (_) | (_| | | | (_| |"
echo " |_|\_\     |____/ \___/ \__,_|_|  \__,_|"
echo -e "${NC}"
echo "Installing K-Board..."
echo "========================================="

# 1. Check Pre-requisites
log "Checking system requirements..."

if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install Docker first: https://get.docker.com/"
fi

# Check for 'docker compose' (plugin) or 'docker-compose' (standalone)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    error "Docker Compose is not installed."
fi

success "Docker is present."

# 2. Setup Directory
INSTALL_DIR="${APP_NAME}-deploy"
if [ -d "$INSTALL_DIR" ]; then
    log "Directory $INSTALL_DIR exists. Updating..."
else
    log "Creating directory $INSTALL_DIR..."
    mkdir -p "$INSTALL_DIR"
fi
cd "$INSTALL_DIR"

# 3. Download Configuration
log "Downloading configuration..."
if command -v curl &> /dev/null; then
    curl -sSL -o docker-compose.yml "$REPO_URL/$COMPOSE_FILE" || error "Failed to download docker-compose.yml"
elif command -v wget &> /dev/null; then
    wget -q -O docker-compose.yml "$REPO_URL/$COMPOSE_FILE" || error "Failed to download docker-compose.yml"
else
    error "Neither curl nor wget is installed."
fi

# 4. Generate Environment
if [ ! -f .env ]; then
    log "Generating default .env file..."

    # Generate secure secret
    if command -v openssl &> /dev/null; then
        AUTH_SECRET=$(openssl rand -hex 32)
    else
        AUTH_SECRET=$(head -c 32 /dev/urandom | xxd -p)
    fi

    cat <<EOF > .env
# Auto-generated configuration
MONGO_USERNAME=admin
MONGO_PASSWORD=password123
AUTH_SECRET=${AUTH_SECRET}
AUTH_URL=http://localhost:3000
EOF
    success "Generated .env with secure secret."
else
    log "Using existing .env configuration."
fi

# 5. Launch Stack
log "Pulling latest images..."
$DOCKER_COMPOSE_CMD pull

log "Starting application..."
$DOCKER_COMPOSE_CMD up -d

echo ""
echo "========================================="
success "K-Board is successfully deployed!"
echo "========================================="
echo ""
echo "📱 Application: http://localhost:3000"
echo "📂 Directory:   /$(pwd)"
echo "🔐 Admin User:  (Create one via /auth/register on first visit)"
echo ""
echo "To stop the app:"
echo "  cd $INSTALL_DIR && $DOCKER_COMPOSE_CMD down"
echo ""
