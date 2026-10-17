// Cria (ou atualiza) um usuario administrador.
// Uso: node scripts/criar-admin.js "email" "senha" "Nome"
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/db');

async function main() {
  const [email, senha, nome] = process.argv.slice(2);

  if (!email || !senha) {
    console.error('Uso: node scripts/criar-admin.js "email" "senha" "Nome"');
    process.exit(1);
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nome, email, senha, cargo)
     VALUES ($1, $2, $3, 'gerente')
     ON CONFLICT (email) DO UPDATE SET senha = EXCLUDED.senha, nome = EXCLUDED.nome
     RETURNING id, nome, email, cargo`,
    [nome || 'Administrador', email, senhaHash]
  );

  console.log('Usuario pronto:', rows[0]);
  await pool.end();
}

main().catch((erro) => {
  console.error('Erro:', erro.message);
  process.exit(1);
});
