// Reimprimir ticket: gera uma pagina imprimivel (bobina termica 80mm)
const express = require('express');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { formatarDataHora, formatarMoeda, formatarFormaPagamento, escapar } = require('../lib/formato');
const { gerarCodigo } = require('../lib/codigo');

const router = express.Router();

// Aceita o token no cabecalho Authorization ou na query (?token=...).
// A query e necessaria porque a pagina de impressao abre numa nova aba.
function autorizar(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const doCabecalho = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;
  const token = doCabecalho || req.query.token;

  if (!token) return res.status(401).send('Token em falta.');
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).send('Token invalido ou expirado.');
  }
}

function montarPagina({ ticket, veiculo, qrDataUrl }) {
  const empresa = process.env.EMPRESA_NOME || 'ESTACIONAMENTO RECIFE';
  const cnpj = process.env.EMPRESA_CNPJ || '';
  const telefone = process.env.EMPRESA_TELEFONE || '';
  const rodape = process.env.EMPRESA_RODAPE || 'Obrigado e volte sempre!';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Ticket ${escapar(String(ticket.id).padStart(6, '0'))}</title>
<style>
  @page { size: 80mm auto; margin: 3mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Consolas", "Courier New", monospace; color: #000; background: #fff; }
  .recibo { width: 74mm; margin: 0 auto; padding: 4mm 2mm; text-align: center; }
  h1 { font-size: 20px; line-height: 1.2; margin: 0 0 4px; letter-spacing: 1px; }
  .cnpj { font-size: 13px; margin: 0 0 12px; }
  .linha { border-top: 1px dashed #000; margin: 10px 0; }
  .campos { font-size: 14px; line-height: 1.7; text-align: center; }
  .campos b { font-weight: 700; }
  .qr { width: 52mm; height: 52mm; margin: 12px auto 4px; display: block; }
  .boas-vindas { font-size: 15px; margin: 8px 0 4px; }
  .telefone { font-size: 14px; letter-spacing: 0.5px; margin: 10px 0 8px; }
  .placa { width: 58mm; margin: 6px auto; border: 3px solid #000; border-radius: 6px; overflow: hidden; }
  .placa-topo { background: #003399; color: #fff; font-size: 9px; height: 12px; line-height: 12px; position: relative; }
  .placa-topo .brasil { position: absolute; left: 6px; top: 0; }
  .placa-corpo { background: #fff; font-size: 34px; font-weight: 700; letter-spacing: 4px; padding: 2px 0 4px; }
  .rodape { font-size: 12px; margin-top: 10px; line-height: 1.5; }
  .valores { font-size: 14px; text-align: left; margin: 8px 0; }
  .valores div { display: flex; justify-content: space-between; }
  .botao-print {
    display: block; width: 74mm; margin: 12px auto; padding: 10px; font-size: 14px;
    background: #14346b; color: #fff; border: none; border-radius: 6px; cursor: pointer;
  }
  @media print { .botao-print { display: none; } }
</style>
</head>
<body>
  <button class="botao-print" onclick="window.print()">Imprimir ticket</button>
  <div class="recibo">
    <h1>${escapar(empresa).replace(/\s+(\S+)$/, '<br>$1')}</h1>
    <p class="cnpj">CNPJ: ${escapar(cnpj)}</p>
    <div class="linha"></div>
    <div class="campos">
      <div>Controle: <b>${escapar(String(ticket.id).padStart(3, '0'))}</b></div>
      <div>Ticket: <b>${escapar(String(ticket.id).padStart(8, '0'))}</b></div>
      <div>Placa: <b>${escapar(veiculo.placa)}</b></div>
      <div>Entrada: ${escapar(formatarDataHora(veiculo.data_entrada))}</div>
      <div>Saida: ${escapar(formatarDataHora(ticket.data_saida))}</div>
    </div>
    <img class="qr" src="${qrDataUrl}" alt="QR Code" />
    <div class="linha"></div>
    <div class="valores">
      <div><span>Valor pago:</span><b>${escapar(formatarMoeda(ticket.valor_pago))}</b></div>
      <div><span>Pagamento:</span><b>${escapar(formatarFormaPagamento(ticket.forma_pagamento))}</b></div>
    </div>
    <div class="linha"></div>
    <p class="boas-vindas">Seja bem vindo!</p>
    <p class="telefone">TELEFONE - ${escapar(telefone)}</p>
    <div class="placa">
      <div class="placa-topo"><span class="brasil">BRASIL</span></div>
      <div class="placa-corpo">${escapar(veiculo.placa)}</div>
    </div>
    <p class="rodape">${escapar(rodape)}</p>
  </div>
</body>
</html>`;
}

// GET /recibo/:id -> pagina de reimpressao do ticket
router.get('/:id', autorizar, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, v.placa, v.modelo, v.cor, v.data_entrada
         FROM tickets t
         JOIN veiculos_patio v ON v.id = t.veiculo_id
        WHERE t.id = $1`,
      [req.params.id]
    );
    const registro = rows[0];
    if (!registro) return res.status(404).send('Ticket nao encontrado.');

    const ticket = {
      id: registro.id,
      valor_pago: registro.valor_pago,
      data_saida: registro.data_saida,
      forma_pagamento: registro.forma_pagamento,
    };
    const veiculo = {
      placa: registro.placa,
      data_entrada: registro.data_entrada,
    };

    // O QR aponta para a pagina publica de verificacao do proprio sistema
    const baseUrl = process.env.PUBLIC_URL || (req.protocol + '://' + req.get('host'));
    const linkVerificacao = baseUrl + '/verificar/' + ticket.id + '?c=' + gerarCodigo(ticket.id);
    const qrDataUrl = await QRCode.toDataURL(linkVerificacao, { margin: 1, width: 400 });

    res.type('html').send(montarPagina({ ticket, veiculo, qrDataUrl }));
  } catch (erro) {
    res.status(500).send('Erro ao gerar ticket: ' + erro.message);
  }
});

module.exports = router;
