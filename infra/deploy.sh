#!/bin/bash
set -e

# Load environment variables
if [ -f /opt/misoa/.env ]; then
  set -a
  source /opt/misoa/.env
  set +a
fi

export GITHUB_REPOSITORY_OWNER=${GITHUB_REPOSITORY_OWNER:-isokjon-osimjonov}
export DB_PASSWORD=${DB_PASSWORD:-misoacosmetics2117}

echo "=== Misoa Market Blue-Green Deploy ==="
echo "Image tag: ${IMAGE_TAG:-latest}"

# Detect live port from upstream block
# First server in upstream = live
CURRENT_UPSTREAM=$(grep -m1 \
  'server 127.0.0.1:' \
  /etc/nginx/sites-available/api.misoa.uz 2>/dev/null \
  | grep -oP ':\K[0-9]+' \
  | head -1 || true)

# Default to 4000 if not found
CURRENT_UPSTREAM=${CURRENT_UPSTREAM:-4000}

if [ "$CURRENT_UPSTREAM" = "4000" ]; then
  LIVE_COLOR="blue"
  LIVE_PORT="4000"
  IDLE_COLOR="green"
  IDLE_PORT="4001"
else
  LIVE_COLOR="green"
  LIVE_PORT="4001"
  IDLE_COLOR="blue"
  IDLE_PORT="4000"
fi

echo "Currently live: $LIVE_COLOR (port $LIVE_PORT)"
echo "Deploying to idle: $IDLE_COLOR (port $IDLE_PORT)"

# Apply new migrations
echo "Applying migrations..."
if [ -d /opt/misoa/libs/db/src/migrations ]; then
  for f in $(find /opt/misoa/libs/db/src/migrations -name "*.sql" | sort); do
    sed 's/--> statement-breakpoint/;/g' \
      "$f" | docker exec -i \
      misoa_postgres_prod \
      psql -U postgres -d misoa_db \
      2>&1 | grep -E "ERROR" \
      | grep -v "already exists" \
      | head -3 || true
  done
  echo "Migrations applied ✅"
else
  echo "Migrations directory not found, skipping..."
fi

# Pull the new image
docker compose -f docker-compose.prod.yml pull api_$IDLE_COLOR

# Start the idle container with the new image
docker compose -f docker-compose.prod.yml --profile $IDLE_COLOR up -d api_$IDLE_COLOR

echo "Waiting for $IDLE_COLOR to become healthy..."
sleep 5

# Health check the idle container directly on its port
HEALTH_CHECK_OK=false
for i in $(seq 1 10); do
  if curl -sf http://127.0.0.1:$IDLE_PORT/health > /dev/null; then
    HEALTH_CHECK_OK=true
    break
  fi
  echo "Attempt $i: not healthy yet, waiting..."
  sleep 3
done

if [ "$HEALTH_CHECK_OK" = false ]; then
  echo "ERROR: $IDLE_COLOR failed health check. Aborting deploy."
  echo "Rolling back: stopping $IDLE_COLOR container."
  docker compose -f docker-compose.prod.yml stop api_$IDLE_COLOR
  exit 1
fi

echo "$IDLE_COLOR is healthy. Switching Nginx traffic..."

# Write new Nginx config with
# new port as primary
sudo tee /etc/nginx/sites-available/api.misoa.uz > /dev/null << NGINX
upstream misoa_api {
    server 127.0.0.1:${IDLE_PORT};
    server 127.0.0.1:${LIVE_PORT} backup;
}

server {
    listen 80;
    server_name api.misoa.uz;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name api.misoa.uz;

    ssl_certificate /etc/letsencrypt/live/misoa.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/misoa.uz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://misoa_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
NGINX

sudo tee /etc/nginx/sites-available/management.misoa.uz > /dev/null << NGINX
server {
    listen 80;
    server_name management.misoa.uz;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name management.misoa.uz;

    ssl_certificate /etc/letsencrypt/live/misoa.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/misoa.uz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /socket.io/ {
        proxy_pass http://misoa_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
NGINX

sudo nginx -t && sudo systemctl reload nginx

echo "Traffic switched to $IDLE_COLOR (port $IDLE_PORT)."
echo "Stopping old $LIVE_COLOR container in 10 seconds (safety window)..."
sleep 10

docker compose -f docker-compose.prod.yml stop api_$LIVE_COLOR

echo "Updating admin panel..."

docker compose -f docker-compose.prod.yml pull admin

docker compose -f docker-compose.prod.yml up -d admin

echo "Waiting for admin to become healthy..."
sleep 5

ADMIN_HEALTH_OK=false
for i in $(seq 1 10); do
  if curl -sf http://127.0.0.1:8081 > /dev/null; then
    ADMIN_HEALTH_OK=true
    break
  fi
  echo "Admin attempt $i: not healthy yet, waiting..."
  sleep 3
done

if [ "$ADMIN_HEALTH_OK" = false ]; then
  echo "WARNING: admin failed health check after update."
  echo "Admin panel may be down — check manually:"
  echo "  docker logs misoa_admin_prod"
  # Note: we don't exit 1 here or roll back API deploy —
  # admin failing shouldn't block/rollback a successful
  # API deploy, they're independent concerns. Just warn.
else
  echo "Admin panel updated and healthy."
fi

echo "=== Deploy complete. Live: $IDLE_COLOR ==="
