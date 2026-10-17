// Rotas de usuarios: cadastro e login
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// POST /api/usuarios  -> cria um usuario com a senha criptografada
router.post('/', async (req, res) => {
  const { nome, email, senha, cargo } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Informe nome, email e senha.' });
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 10);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nome, email, senha, cargo)
       VALUES ($1, $2, $3, COALESCE($4, 'operador'))
       RETURNING id, nome, email, cargo`,
      [nome, email, senhaHash, cargo || null]
    );
    res.status(201).json(rows[0]);
  } catch (erro) {
    if (erro.code === '23505') {
      return res.status(409).json({ erro: 'Este email ja esta cadastrado.' });
    }
    res.status(500).json({ erro: 'Erro ao criar usuario.', detalhe: erro.message });
  }
});

// POST /api/usuarios/login  -> confere a senha e devolve um token
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe email e senha.' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const usuario = rows[0];

    // Mesma mensagem para usuario inexistente e senha errada (evita revelar quem existe)
    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(401).json({ erro: 'Email ou senha invalidos.' });
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, cargo: usuario.cargo },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, cargo: usuario.cargo } });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao fazer login.', detalhe: erro.message });
  }
});

module.exports = router;
