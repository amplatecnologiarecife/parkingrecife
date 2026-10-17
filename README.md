# Parking Recife — Painel (Etapa 3)

Painel web local: Node.js (Express) + PostgreSQL, com login por token (JWT), senhas criptografadas (bcrypt) e interface no navegador.

## Estrutura
```
parking-recife/
  package.json
  .env                # credenciais locais (nao versionar)
  .env.example        # modelo
  sql/schema.sql      # cria as 3 tabelas
  public/index.html   # painel (tela de login + dashboard)
  public/style.css
  public/app.js
  src/server.js       # servidor Express + rotas
  src/db.js           # conexao PostgreSQL
  src/middleware/auth.js   # valida o token de login
  src/routes/usuarios.js   # cadastro e login
  src/routes/veiculos.js   # entrada, listagem, consulta
  src/routes/tickets.js    # saida (calcula valor) e listagem
```

## Correr
```cmd
cd "C:\Users\Desktop\Documents\Default Project\parking-recife"
npm start
```
Depois abra no navegador: **http://localhost:3000**

## Acesso inicial
- Email: `admin@parking.com`
- Senha: `admin123`

(Troque esta senha em producao.)

## O que o painel faz
1. **Entrar** com email e senha.
2. **Registar entrada** de um veiculo (placa, modelo, cor).
3. Ver os **veiculos no patio** e **registar a saida** escolhendo a forma de pagamento.
4. Ver os **ultimos tickets** com valor e data.
5. **Reimprimir** o ticket (botao na tabela de tickets).

## Reimprimir ticket
O botao **Reimprimir** abre em nova aba uma pagina no formato de bobina
termica (80mm), com cabecalho da empresa, controle, data, QR Code, placa
no estilo Mercosul, valor pago e rodape. Nessa pagina, o botao
**Imprimir ticket** (o dialogo do Windows) tem a opcao de "Salvar como PDF".

Endereco direto: `http://localhost:3000/recibo/ID?token=SEU_TOKEN`

### QR Code e verificacao
O QR aponta para uma pagina publica de verificacao do proprio sistema:
`PUBLIC_URL/verificar/ID?c=codigo`. O `codigo` e um HMAC do ID, portanto
nao da para adivinhar outros tickets mudando o numero.

Configuravel no `.env`:
- `EMPRESA_NOME`, `EMPRESA_CNPJ`, `EMPRESA_TELEFONE`, `EMPRESA_RODAPE`
- `PUBLIC_URL` (endereco publico do sistema, usado no QR; em branco usa o host da requisicao)

Rotas:
| Metodo | Rota | Descricao |
| --- | --- | --- |
| GET | `/recibo/:id?token=...` | Pagina imprimivel do ticket |
| GET | `/verificar/:id?c=...` | Conferencia publica (destino do QR) |

> Nota: o `/recibo` usa o token na URL porque abre numa aba nova. Para producao,
> o ideal e trocar por um token de curta duracao proprio do recibo.

## API

### Usuarios (publico)
| Metodo | Rota | Body | Descricao |
| --- | --- | --- | --- |
| POST | `/api/usuarios` | `{nome,email,senha,cargo}` | Cria usuario (senha vai em hash) |
| POST | `/api/usuarios/login` | `{email,senha}` | Devolve `{token, usuario}` |

### Veiculos (precisa do cabecalho `Authorization: Bearer TOKEN`)
| Metodo | Rota | Body | Descricao |
| --- | --- | --- | --- |
| POST | `/api/veiculos` | `{placa,modelo,cor}` | Regista entrada |
| GET | `/api/veiculos` | - | Lista (filtro opcional `?status=no_patio`) |
| GET | `/api/veiculos/:id` | - | Consulta um veiculo |

### Tickets (precisa do token)
| Metodo | Rota | Body | Descricao |
| --- | --- | --- | --- |
| POST | `/api/tickets` | `{veiculo_id,forma_pagamento}` | Regista saida e calcula o valor |
| GET | `/api/tickets` | - | Lista os tickets emitidos |

Regra de cobranca: `valor = horas * TARIFA_HORA` (horas arredondadas para cima, minimo 1).

## Exemplo rapido (PowerShell)
```powershell
$base = "http://localhost:3000"
Invoke-RestMethod "$base/api/usuarios" -Method Post -ContentType "application/json" `
  -Body '{"nome":"Ana","email":"ana@parking.com","senha":"segredo123","cargo":"gerente"}'

$login = Invoke-RestMethod "$base/api/usuarios/login" -Method Post -ContentType "application/json" `
  -Body '{"email":"ana@parking.com","senha":"segredo123"}'
$h = @{ Authorization = "Bearer $($login.token)" }

Invoke-RestMethod "$base/api/veiculos" -Method Post -Headers $h -ContentType "application/json" `
  -Body '{"placa":"ABC1D23","modelo":"Onix","cor":"Prata"}'
Invoke-RestMethod "$base/api/veiculos" -Headers $h
```
