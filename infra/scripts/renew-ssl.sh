#!/bin/bash

# SSL Certificate Renewal Script for BeritaKarya (acme.sh wrapper)
# Usage: ./renew-ssl.sh
# Add to crontab: 0 3 * * * /opt/beritakarya/infra/scripts/renew-ssl.sh

echo "Checking SSL certificate renewal via acme.sh..."

ACME_BIN="$HOME/.acme.sh/acme.sh"
ENV_FILE="/opt/beritakarya/.env.production"
LOCAL_ENV="infra/docker/.env"

if [ ! -f "$ACME_BIN" ]; then
  echo "❌ ERROR: acme.sh binary not found at $ACME_BIN"
  echo "Harap jalankan setup-ssl.sh terlebih dahulu."
  exit 1
fi

# Source Vercel Token from environment files if not already set (safety fallback)
if [ -z "$VERCEL_TOKEN" ]; then
  if [ -f "$ENV_FILE" ]; then
    export VERCEL_TOKEN=$(grep -E "^VERCEL_TOKEN=" "$ENV_FILE" | cut -d'=' -f2- | tr -d ' ' | tr -d '"' | tr -d "'")
  elif [ -f "$LOCAL_ENV" ]; then
    export VERCEL_TOKEN=$(grep -E "^VERCEL_TOKEN=" "$LOCAL_ENV" | cut -d'=' -f2- | tr -d ' ' | tr -d '"' | tr -d "'")
  fi
fi

# Execute acme.sh cron check
# Note: acme.sh --cron will check all certs and renew those that are near expiration.
# We run it and capture the exit code safely without set -e breaking execution.
"$ACME_BIN" --cron --home "$HOME/.acme.sh"
ACME_STATUS=$?

if [ $ACME_STATUS -eq 0 ]; then
  echo "✅ SSL certificate renewal check completed successfully."
  exit 0
else
  echo "❌ ERROR: SSL renewal check failed with exit code $ACME_STATUS."
  exit 1
fi