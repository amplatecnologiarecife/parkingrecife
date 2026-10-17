// Rotas de tickets: registar saida (calcula o valor) e listar
const express = require('express');
const pool = require('../db');
const exigirLogin = require('../middleware/auth');

const router = express.Router();
router.use(exigirLogin);

const TARIFA_HORA = Number(process.env.TARIFA_HORA) || 10;

// Calcula o valor: horas arredondadas para cima, minimo de 1 hora
function calcularValor(dataEntrada, dataSaida) {
  const ms = new Date(dataSaida) - new Date(dataEntrada);
  const horas = Math.max(1, Math.ceil(ms / (1000 * 60 * 60)));
  return { horas, valor: Number((horas * TARIFA_HORA).toFixed(2)) };
}

// POST /api/tickets  -> fecha o ticket de um veiculo
// Body: { veiculo_id, forma_pagamento }
router.post('/', async (req, res) => {
  const { veiculo_id, forma_pagamento } = req.body;

  if (!veiculo_id || !forma_pagamento) {
    return res.status(400).json({ erro: 'Informe veiculo_id e forma_pagamento.' });
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const { rows } = await cliente.query(
      'SELECT * FROM veiculos_patio WHERE id = $1 FOR UPDATE',
      [veiculo_id]
    );
    const veiculo = rows[0];

    if (!veiculo) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ erro: 'Veiculo nao encontrado.' });
    }
    if (veiculo.status !== 'no_patio') {
      await cliente.query('ROLLBACK');
      return res.status(409).json({ erro: 'Este veiculo ja teve a saida registada.' });
    }

    const agora = new Date();
    const { horas, valor } = calcularValor(veiculo.data_entrada, agora);

    const novoTicket = await cliente.query(
      `INSERT INTO tickets (veiculo_id, valor_pago, data_saida, forma_pagamento)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [veiculo_id, valor, agora, forma_pagamento]
    );

    await cliente.query(
      "UPDATE veiculos_patio SET status = 'saiu' WHERE id = $1",
      [veiculo_id]
    );

    await cliente.query('COMMIT');
    res.status(201).json({ ...novoTicket.rows[0], horas });
  } catch (erro) {
    await cliente.query('ROLLBACK');
    res.status(500).json({ erro: 'Erro ao registar saida.', detalhe: erro.message });
  } finally {
    cliente.release();
  }
});

// GET /api/tickets  -> lista os tickets emitidos
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, v.placa, v.modelo
         FROM tickets t
         JOIN veiculos_patio v ON v.id = t.veiculo_id
        ORDER BY t.data_saida DESC`
    );
    res.json(rows);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar tickets.', detalhe: erro.message });
  }
});

module.exports = router;
