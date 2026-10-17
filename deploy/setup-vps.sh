#!/usr/bin/env bash
# Parking Recife - prepara a VPS (Ubuntu 22.04+ / Debian 12+)
# Uso:  bash deploy/setup-vps.sh
# Nada e apagado; o script pode ser corrido mais de uma vez.

set -euo pipefail

DB_USER="parking"
DB_NAME="parking_recife"
DB_PASS="${DB_PASS:-}"
APP_DIR="/var/www/parking-recife"

echo "== 1/6 Atualizando pacotes =="
sudo apt-get update -y

echo "== 2/6 Instalando Node.js 22 =="
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "== 3/6 Instalando PostgreSQL =="
if ! command -v psql >/dev/null 2>&1; then
  sudo apt-get install -y postgresql
  sudo systemctl enable --now postgresql
fi

echo "== 4/6 Instalando PM2 e Nginx =="
sudo npm install -g pm2 >/dev/null
if ! command -v nginx >/dev/null 2>&1; then
  sudo apt-get install -y nginx
fi

echo "== 5/6 Preparando o banco de dados =="
if [ -z "$DB_PASS" ]; then
  echo "AVISO: defina a password com DB_PASS antes de correr, ex:"
  echo "  DB_PASS='minha_senha_forte' bash deploy/setup-vps.sh"
  exit 0
fi

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;
SQL

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
fi

echo "== 6/6 Criando pasta da aplicacao =="
sudo mkdir -p "${APP_DIR}"
sudo chown -R "$USER":"$USER" "${APP_DIR}"

echo
echo "Pronto! Proximos passos (veja deploy/GUIA-VPS.md):"
echo "  1) clone o repositorio em ${APP_DIR}"
echo "  2) crie o .env  (cp .env.production.example .env)"
echo "  3) npm ci && npm run db:schema && node scripts/criar-admin.js ..."
echo "  4) pm2 start ecosystem.config.js && pm2 save && pm2 startup"
echo "  5) configure o Nginx (deploy/nginx-parking.conf)"
