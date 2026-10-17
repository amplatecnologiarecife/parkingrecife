// Conexao com o PostgreSQL.
// Aceita duas formas:
//   1) DATABASE_URL (usada por plataformas como Render/Railway/Heroku)
//   2) Variaveis separadas DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME (local)
const { Pool } = require('pg');

const usaUrl = Boolean(process.env.DATABASE_URL);
const precisaSsl = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

const pool = usaUrl
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: precisaSsl ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

module.exports = pool;
