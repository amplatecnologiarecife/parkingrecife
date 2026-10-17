// Cria o usuario administrador inicial quando a base esta vazia.
// Usado em plataformas (Render/Railway) onde nao ha terminal para correr scripts.
// So age se ADMIN_EMAIL e ADMIN_PASSWORD estiverem definidos.
const bcrypt = require('bcryptjs');
const pool = require('../db');

async function garantirAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const senha = process.env.ADMIN_PASSWORD;

  if (!email || !senha) return;

  const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM usuarios');
  if (rows[0].total > 0) return;

  const senhaHash = await bcrypt.hash(senha, 10);
  await pool.query(
    `INSERT INTO usuarios (nome, email, senha, cargo)
     VALUES ($1, $2, $3, 'gerente')`,
    [process.env.ADMIN_NOME || 'Administrador', email, senhaHash]
  );
  console.log('Usuario administrador inicial criado:', email);
}

module.exports = { garantirAdmin };
