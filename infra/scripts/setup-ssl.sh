#!/bin/bash
set -e

DOMAIN="beritakarya.co"
EMAIL="admin@beritakarya.co"
SSL_DIR="/etc/ssl/beritakarya"
ENV_FILE="/opt/beritakarya/.env.production"
LOCAL_ENV="infra/docker/.env"

echo "🔐 Setting up Wildcard SSL for *.$DOMAIN using acme.sh & Vercel DNS..."

# Source Vercel Token from environment files if not already set
if [ -z "$VERCEL_TOKEN" ]; then
  if [ -f "$ENV_FILE" ]; then
    echo "Sourcing Vercel Token from $ENV_FILE..."
    VERCEL_TOKEN=$(grep -E "^VERCEL_TOKEN=" "$ENV_FILE" | cut -d'=' -f2- | tr -d ' ' | tr -d '"' | tr -d "'")
  elif [ -f "$LOCAL_ENV" ]; then
    echo "Sourcing Vercel Token from $LOCAL_ENV..."
    VERCEL_TOKEN=$(grep -E "^VERCEL_TOKEN=" "$LOCAL_ENV" | cut -d'=' -f2- | tr -d ' ' | tr -d '"' | tr -d "'")
  fi
fi

if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ ERROR: VERCEL_TOKEN environment variable is not set and was not found in environment files!"
  echo "Harap set VERCEL_TOKEN terlebih dahulu sebelum menjalankan skrip ini."
  exit 1
fi

export VERCEL_TOKEN="$VERCEL_TOKEN"

# Install acme.sh if not installed
if [ ! -d "$HOME/.acme.sh" ] && [ ! -f "$HOME/.acme.sh/acme.sh" ]; then
  echo "📦 Installing acme.sh..."
  curl https://get.acme.sh | sh -s email=$EMAIL
  # Source shell configs to make acme.sh command available
  source ~/.bashrc || true
  source ~/.profile || true
fi

# Double check acme.sh path
ACME_BIN="$HOME/.acme.sh/acme.sh"
if [ ! -f "$ACME_BIN" ]; then
  echo "❌ ERROR: acme.sh installation failed or binary not found at $ACME_BIN"
  exit 1
fi

echo "🚀 Issuing Wildcard Certificate via Vercel DNS API..."
"$ACME_BIN" --issue \
  --dns dns_vercel \
  -d "$DOMAIN" \
  -d "*.$DOMAIN" \
  --server letsencrypt

# Ensure target SSL directory exists
mkdir -p "$SSL_DIR"

echo "📦 Installing certificates to Nginx directory $SSL_DIR..."
"$ACME_BIN" --install-cert \
  -d "$DOMAIN" \
  --cert-file "$SSL_DIR/cert.pem" \
  --key-file "$SSL_DIR/privkey.pem" \
  --fullchain-file "$SSL_DIR/fullchain.pem" \
  --reloadcmd "systemctl reload nginx"

echo "✅ Wildcard SSL setup with acme.sh completed successfully!"
