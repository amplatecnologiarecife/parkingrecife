// Pagina publica de verificacao: aberta quando o QR do ticket e lido
const express = require('express');
const pool = require('../db');
const { formatarDataHora, formatarMoeda, formatarFormaPagamento, escapar } = require('../lib/formato');
const { codigoValido } = require('../lib/codigo');

const router = express.Router();

function pagina(miolo) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Verificacao de ticket</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; background: #f2f4f8; color: #1f2937; }
  .topo { background: #14346b; color: #fff; padding: 16px 24px; font-size: 18px; font-weight: 600; text-align: center; }
  .cartao { max-width: 420px; margin: 32px auto; background: #fff; border-radius: 10px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .selo { text-align: center; font-size: 16px; font-weight: 700; padding: 12px; border-radius: 8px; margin-bottom: 20px; }
  .selo.ok { background: #dcfce7; color: #166534; }
  .selo.erro { background: #fee2e2; color: #991b1b; }
  table { width: 100%; border-collapse: collapse; font-size: 15px; }
  td { padding: 9px 4px; border-bottom: 1px solid #eef1f5; }
  td:first-child { color: #6b7280; }
  td:last-child { text-align: right; font-weight: 600; }
</style>
</head>
<body>
  <div class="topo">Parking Recife</div>
  <div class="cartao">${miolo}</div>
</body>
</html>`;
}

function paginaInvalida() {
  return pagina('<div class="selo erro">Ticket nao encontrado ou codigo invalido.</div>');
}

// GET /verificar/:id?c=codigo -> dados do ticket para conferencia
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { c } = req.query;

  if (!codigoValido(id, c)) {
    return res.status(404).type('html').send(paginaInvalida());
  }

  try {
    const { rows } = await pool.query(
      `SELECT t.*, v.placa, v.modelo
         FROM tickets t
         JOIN veiculos_patio v ON v.id = t.veiculo_id
        WHERE t.id = $1`,
      [id]
    );
    const registro = rows[0];
    if (!registro) {
      return res.status(404).type('html').send(paginaInvalida());
    }

    const miolo = `
      <div class="selo ok">Ticket valido</div>
      <table>
        <tr><td>Controle</td><td>${escapar(String(registro.id).padStart(6, '0'))}</td></tr>
        <tr><td>Placa</td><td>${escapar(registro.placa)}</td></tr>
        <tr><td>Modelo</td><td>${escapar(registro.modelo || '-')}</td></tr>
        <tr><td>Valor pago</td><td>${escapar(formatarMoeda(registro.valor_pago))}</td></tr>
        <tr><td>Pagamento</td><td>${escapar(formatarFormaPagamento(registro.forma_pagamento))}</td></tr>
        <tr><td>Saida</td><td>${escapar(formatarDataHora(registro.data_saida))}</td></tr>
      </table>`;

    res.type('html').send(pagina(miolo));
  } catch (erro) {
    res.status(500).type('html').send(pagina('<div class="selo erro">Erro: ' + escapar(erro.message) + '</div>'));
  }
});

module.exports = router;
