// Parking Recife - servidor backend (Etapa 2)
require('dotenv').config();

const path = require('path');
const express = require('express');
const pool = require('./db');

const rotasUsuarios = require('./routes/usuarios');
const rotasVeiculos = require('./routes/veiculos');
const rotasTickets = require('./routes/tickets');
const rotasRecibo = require('./routes/recibo');
const rotasVerificar = require('./routes/verificar');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Painel web (ficheiros estaticos em public/)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rota de confirmacao do servidor (API)
app.get('/api/status', (req, res) => {
  res.send('Servidor do Parking Recife Ativo');
});

// Rota de saude: confirma servidor + base de dados
app.get('/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS agora');
    res.json({ status: 'ok', banco: 'ligado', agora: rows[0].agora });
  } catch (erro) {
    res.status(500).json({ status: 'erro', banco: 'sem ligacao', detalhe: erro.message });
  }
});

app.use('/api/usuarios', rotasUsuarios);
app.use('/api/veiculos', rotasVeiculos);
app.use('/api/tickets', rotasTickets);
app.use('/recibo', rotasRecibo);
app.use('/verificar', rotasVerificar);

app.listen(PORT, () => {
  console.log(`Servidor do Parking Recife a correr em http://localhost:${PORT}`);
});
