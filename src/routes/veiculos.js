// Rotas de veiculos no patio (entrada, listagem, consulta)
const express = require('express');
const pool = require('../db');
const exigirLogin = require('../middleware/auth');

const router = express.Router();
router.use(exigirLogin);

// POST /api/veiculos  -> registra a entrada de um veiculo
router.post('/', async (req, res) => {
  const { placa, modelo, cor } = req.body;

  if (!placa) {
    return res.status(400).json({ erro: 'Informe a placa.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO veiculos_patio (placa, modelo, cor)
       VALUES (UPPER($1), $2, $3)
       RETURNING *`,
      [placa, modelo || null, cor || null]
    );
    res.status(201).json(rows[0]);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao registar veiculo.', detalhe: erro.message });
  }
});

// GET /api/veiculos  -> lista veiculos (opcional: ?status=no_patio)
router.get('/', async (req, res) => {
  const { status } = req.query;

  try {
    const { rows } = status
      ? await pool.query('SELECT * FROM veiculos_patio WHERE status = $1 ORDER BY data_entrada DESC', [status])
      : await pool.query('SELECT * FROM veiculos_patio ORDER BY data_entrada DESC');
    res.json(rows);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar veiculos.', detalhe: erro.message });
  }
});

// GET /api/veiculos/:id  -> consulta um veiculo
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM veiculos_patio WHERE id = $1', [req.params.id]);
    if (!rows[0]) {
      return res.status(404).json({ erro: 'Veiculo nao encontrado.' });
    }
    res.json(rows[0]);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao consultar veiculo.', detalhe: erro.message });
  }
});

module.exports = router;
