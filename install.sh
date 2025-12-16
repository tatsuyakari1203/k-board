#!/usr/bin/env bash
# K-Board All-in-One Installer
# Usage: curl -sSL https://raw.githubusercontent.com/tatsuyakari1203/k-board/main/install.sh | bash

set -e

# Configuration
REPO_URL="https://raw.githubusercontent.com/tatsuyakari1203/k-board/main"
COMPOSE_FILE="docker-compose.yml"
APP_NAME="k-board"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
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
    warn "Directory $INSTALL_DIR exists."
    read -p "Do you want to update/overwrite it? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Aborting installation."
        exit 0
    fi
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

# 4. Configuration Wizard
echo ""
echo "========================================="
echo "       CONFIGURATION WIZARD"
echo "========================================="
echo ""

# Default values
DEFAULT_PORT=3000
DEFAULT_DOMAIN="http://localhost:$DEFAULT_PORT"
DEFAULT_MONGO_USER="admin"
DEFAULT_MONGO_PASS="password123"

# Interactive prompts
read -p "Enter Application Port [${DEFAULT_PORT}]: " APP_PORT
APP_PORT=${APP_PORT:-$DEFAULT_PORT}

read -p "Enter Domain/URL (e.g. https://kboard.com) [${DEFAULT_DOMAIN}]: " AUTH_URL
AUTH_URL=${AUTH_URL:-$DEFAULT_DOMAIN}

read -p "Enter MongoDB Username [${DEFAULT_MONGO_USER}]: " MONGO_USERNAME
MONGO_USERNAME=${MONGO_USERNAME:-$DEFAULT_MONGO_USER}

read -p "Enter MongoDB Password [${DEFAULT_MONGO_PASS}]: " MONGO_PASSWORD
MONGO_PASSWORD=${MONGO_PASSWORD:-$DEFAULT_MONGO_PASS}

# 5. Generate Environment
log "Generating .env file..."

# Generate secure secret
if command -v openssl &> /dev/null; then
    AUTH_SECRET=$(openssl rand -hex 32)
else
    AUTH_SECRET=$(head -c 32 /dev/urandom | xxd -p)
fi

cat <<EOF > .env
# Auto-generated configuration
APP_PORT=${APP_PORT}
MONGO_USERNAME=${MONGO_USERNAME}
MONGO_PASSWORD=${MONGO_PASSWORD}
AUTH_SECRET=${AUTH_SECRET}
AUTH_URL=${AUTH_URL}
EOF

success "Configuration saved to .env"

# 6. Create Uploads Directory
log "Setting up uploads directory..."
mkdir -p public/uploads
# Set permissions to ensure container can write (UID 1001 is usually nextjs user in container)
chmod 777 public/uploads
success "Created public/uploads directory"

# 7. Launch Stack
log "Pulling latest images..."
$DOCKER_COMPOSE_CMD pull

log "Starting application..."
$DOCKER_COMPOSE_CMD up -d

echo ""
echo "========================================="
success "K-Board is successfully deployed!"
echo "========================================="
echo ""
echo "📱 Application: ${AUTH_URL}"
echo "📂 Directory:   $(pwd)"
echo "🔐 Admin User:  (Create one via /auth/register on first visit)"
echo ""
echo "To stop the app:"
echo "  cd $(pwd) && $DOCKER_COMPOSE_CMD down"
echo ""

