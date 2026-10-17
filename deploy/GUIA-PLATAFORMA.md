# Guia: publicar o Parking Recife por plataforma ligada ao GitHub

O codigo ja suporta duas formas de ligacao a base de dados:
- `DATABASE_URL` (uma URL unica) — usada pelas plataformas;
- ou as variaveis `DB_HOST`/`DB_PORT`/... (usadas no seu PC e na VPS).

Na plataforma, o esquema e o admin inicial sao criados sozinhos:
- o arranque corre `npm run db:schema` antes de `npm start`;
- se `ADMIN_EMAIL` e `ADMIN_PASSWORD` estiverem definidos e nao existir
  nenhum utilizador, o admin e criado.

---

## Opcao A — Railway (mais simples, banco incluido)

1. Crie conta em **https://railway.app** (pode entrar com o GitHub).
2. **New Project** > **Deploy from GitHub repo** > escolha
   `amplatecnologiarecife/parkingrecife`.
3. No projeto, clique **+ New** > **Database** > **Add PostgreSQL**.
4. Abra o servico da aplicacao > separador **Variables** e adicione:

   | Nome | Valor |
   | --- | --- |
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
   | `DB_SSL` | `false` |
   | `JWT_SECRET` | uma chave longa (ex: gere em https://it-tools.tech/token-generator) |
   | `ADMIN_EMAIL` | `admin@parking.com` |
   | `ADMIN_PASSWORD` | uma senha forte |
   | `TARIFA_HORA` | `10` |
   | `EMPRESA_NOME` | `ESTACIONAMENTO RECIFE` |
   | `EMPRESA_CNPJ` | `62.580.141/0001-88` |
   | `EMPRESA_TELEFONE` | `81-9.8612-5798` |
   | `EMPRESA_RODAPE` | `Obrigado e volte sempre!` |

5. Em **Settings** > **Networking** > **Generate Domain**. Copie o endereco
   (ex: `https://parking-recife.up.railway.app`).
6. Volte a **Variables** e adicione `PUBLIC_URL` com esse endereco.
   (Isto faz o QR do ticket apontar para o lugar certo.)
7. O deploy corre sozinho. Abra o endereco e entre com o `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

> `railway.json` (ja no repositorio) faz o arranque aplicar o esquema antes de
> iniciar o servidor.

---

## Opcao B — Render (tem plano gratuito para o servico web)

1. Crie conta em **https://render.com** (entrar com GitHub).
2. Precisa de uma base PostgreSQL. O Render tem, mas ja nao e gratuito;
   uma alternativa gratuita e a **Neon** (https://neon.tech). Crie um projeto
   la e copie a **connection string**.
3. No Render: **New** > **Blueprint** > escolha o repositorio
   `amplatecnologiarecife/parkingrecife`. Ele le o `render.yaml`.
4. Preencha no painel (pedidos com `sync: false`):

   | Nome | Valor |
   | --- | --- |
   | `DATABASE_URL` | a connection string (Neon, ou do Render) |
   | `ADMIN_EMAIL` | `admin@parking.com` |
   | `ADMIN_PASSWORD` | uma senha forte |
   | `PUBLIC_URL` | o endereco do Render (ex: `https://parking-recife.onrender.com`) |

5. Aplique. Depois do primeiro deploy, confirme o `PUBLIC_URL` no painel.

> No plano gratuito do Render o servico "adormece" sem uso; o primeiro acesso
> pode demorar alguns segundos.

---

## Depois de publicado

- Guarde as credenciais do admin num lugar seguro e troque a senha.
- Quando tiver um dominio proprio, aponte-o para a plataforma e atualize
  `PUBLIC_URL` (o QR passa a usar o dominio).

## Atualizar o sistema

Faca `git push` no seu PC. A plataforma publica a nova versao sozinha.
