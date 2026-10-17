-- Parking Recife - Esquema inicial (Etapa 1)
-- Base de dados: parking_recife
-- Executar no pgAdmin (Query Tool) ou com: psql -U postgres -d parking_recife -f sql/schema.sql

CREATE TABLE IF NOT EXISTS usuarios (
    id        SERIAL PRIMARY KEY,
    nome      VARCHAR(100) NOT NULL,
    email     VARCHAR(150) UNIQUE NOT NULL,
    senha     VARCHAR(255) NOT NULL,
    cargo     VARCHAR(50)  NOT NULL DEFAULT 'operador'
);

CREATE TABLE IF NOT EXISTS veiculos_patio (
    id           SERIAL PRIMARY KEY,
    placa        VARCHAR(10) NOT NULL,
    modelo       VARCHAR(80),
    cor          VARCHAR(30),
    data_entrada TIMESTAMP NOT NULL DEFAULT NOW(),
    status       VARCHAR(20) NOT NULL DEFAULT 'no_patio'
);

CREATE TABLE IF NOT EXISTS tickets (
    id               SERIAL PRIMARY KEY,
    veiculo_id       INTEGER NOT NULL REFERENCES veiculos_patio(id),
    valor_pago       NUMERIC(10,2) NOT NULL,
    data_saida       TIMESTAMP NOT NULL DEFAULT NOW(),
    forma_pagamento  VARCHAR(30) NOT NULL
);

-- Indice util para procurar veiculos pela placa
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos_patio (placa);
