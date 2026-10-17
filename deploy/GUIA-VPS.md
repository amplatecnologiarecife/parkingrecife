# Guia: publicar o Parking Recife na VPS (Hetzner — 157.90.16.218)

Passo a passo, do zero. Onde estiver `157.90.16.218`, mantenha o seu IP.

---

## 0. Descobrir o sistema da VPS

No painel da Hetzner, abra o **Console** da VPS (ou conecte por SSH e veja o
comando abaixo). Rode:

```bash
cat /etc/os-release
```

- Se aparecer `Ubuntu` ou `Debian` → este guia serve direto.
- Se aparecer `Rocky`/`AlmaLinux`/`Fedora` → avise, o script muda de `apt` para `dnf`.

---

## 1. Conectar por SSH (do seu Windows)

Abra o **PowerShell** e digite (troque `root` se o seu acesso for outro):

```powershell
ssh root@157.90.16.218
```

Na primeira vez ele pergunta *yes/no* → digite `yes`.

---

## 2. Preparar a VPS (instala Node, PostgreSQL, PM2, Nginx)

Você vai precisar do projeto na VPS para ter o script. Faça na ordem:

### 2a. Instalar o Git na VPS
```bash
apt-get update -y && apt-get install -y git
```

### 2b. Clonar o projeto (você terá a URL do GitHub no passo 4 do lado do Windows)
```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/SEU_USUARIO/parking-recife.git
cd parking-recife
```

### 2c. Rodar o preparo
```bash
DB_PASS='escolha_uma_senha_forte' bash deploy/setup-vps.sh
```

---

## 3. Configurar o projeto na VPS

```bash
cd /var/www/parking-recife

# dependencias (usa o package-lock, sem desvios)
npm ci --omit=dev

# ficheiro de ambiente
cp .env.production.example .env
nano .env
```

No `.env`, preencha (tecle `Ctrl+O`, `Enter`, `Ctrl+X` para gravar e sair):

- `JWT_SECRET` → gere uma chave: `openssl rand -hex 32` e cole.
- `DB_USER=parking`
- `DB_PASSWORD=` a mesma senha forte do passo 2c
- `DB_NAME=parking_recife`
- `PUBLIC_URL=http://157.90.16.218`

Depois:

```bash
npm run db:schema
npm run criar-admin -- "admin@parking.com" "uma_senha_bem_forte" "Administrador"
```

---

## 4. Manter sempre no ar (PM2)

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# o pm2 imprime um comando com sudo; copie, cole e execute.
```

Teste no navegador do Windows: **http://157.90.16.218:3000**

> Se não abrir, o firewall pode estar fechando a porta 3000 — resolvemos
> colocando o Nginx na frente (passo 5) e liberando só 80.

---

## 5. Nginx na porta 80 (deixa sem `:3000` na URL)

```bash
cp deploy/nginx-parking.conf /etc/nginx/sites-available/parking-recife
ln -s /etc/nginx/sites-available/parking-recife /etc/nginx/sites-enabled/parking-recife
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Agora abra **http://157.90.16.218** (sem porta).

---

## 6. Firewall (opcional, mas recomendado)

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

---

## Comandos do dia a dia

| O que quero | Comando |
| --- | --- |
| Ver se está a correr | `pm2 status` |
| Ver os logs | `pm2 logs parking-recife` |
| Reiniciar | `pm2 restart parking-recife` |
| Parar | `pm2 stop parking-recife` |

## Atualizar o sistema depois de mudar o código

No Windows: `git push`. Na VPS:

```bash
cd /var/www/parking-recife
git pull
npm ci --omit=dev
pm2 restart parking-recife
```

---

## Depois, quando tiver dominio

1. Aponte o dominio (registo A) para `157.90.16.218`.
2. No `.env`, mude `PUBLIC_URL=https://seudominio.com`.
3. Instale o certificado:
   ```bash
   apt-get install -y certbot python3-certbot-nginx
   certbot --nginx -d seudominio.com
   ```
4. `pm2 restart parking-recife`
