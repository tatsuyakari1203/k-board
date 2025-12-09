#!/bin/sh
echo "🐳 Building Docker image k-board:latest..."
docker build -t k-board:latest .
echo "✅ Build complete! To run:"
echo "docker run -p 3000:3000 --env-file .env.local k-board:latest"
