// Aplica o esquema (sql/schema.sql) na base de dados configurada no .env
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/db');

async function main() {
  const ficheiro = path.join(__dirname, '..', 'sql', 'schema.sql');
  const sql = fs.readFileSync(ficheiro, 'utf8');
  await pool.query(sql);
  console.log('Esquema aplicado com sucesso.');
  await pool.end();
}

main().catch((erro) => {
  console.error('Erro ao aplicar o esquema:', erro.message);
  process.exit(1);
});
