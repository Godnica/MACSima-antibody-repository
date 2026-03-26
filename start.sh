#!/usr/bin/env bash
set -e

echo "============================================"
echo "  Antibody Repository — Starting..."
echo "============================================"
echo ""

docker compose up -d --build

echo ""
echo "============================================"
echo "  Application is ready!"
echo "  Open: http://localhost:${PORT:-3000}"
echo "  Default login: admin / admin"
echo "============================================"
