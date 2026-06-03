#!/bin/bash
# ─────────────────────────────────────────────────────────────
# deploy-api.sh — Script deploy ulang API container di VPS
# Jalankan dari: /opt/beritakarya
# Usage: bash infra/scripts/deploy-api.sh
# ─────────────────────────────────────────────────────────────
set -e

COMPOSE_FILE="infra/docker/docker-compose.backend.yml"
PROJECT_DIR="/opt/beritakarya"

echo "🚀 [1/5] Masuk ke direktori project..."
cd "$PROJECT_DIR"

echo "📥 [2/5] Pull perubahan terbaru dari Git..."
git pull origin main

echo "🔨 [3/5] Build image API baru (Selagi container lama tetap menyala melayani request)..."
docker compose -f "$COMPOSE_FILE" build api

echo "▶️  [4/5] Deploy kontainer baru dengan Zero-Downtime restart..."
# up -d --no-deps api akan menggantikan container api yang lama dengan yang baru dalam waktu < 2 detik!
docker compose -f "$COMPOSE_FILE" up -d --no-deps api

echo "🧹 [5/5] Membersihkan image lama yang tidak terpakai..."
docker image prune -f

echo ""
echo "⏳ Menunggu API selesai startup (20 detik)..."
sleep 20

echo ""
echo "📋 Status container:"
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "📜 Log API (30 baris terakhir):"
docker compose -f "$COMPOSE_FILE" logs --tail=30 api

echo ""
echo "✅ Deploy selesai! Periksa log di atas untuk memastikan API berjalan normal."
