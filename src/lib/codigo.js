// Codigo de verificacao do ticket (evita que alguem adivinhe IDs na pagina publica)
const crypto = require('crypto');

const SEGREDO = process.env.JWT_SECRET || 'dev-segredo-temporario';

function gerarCodigo(id) {
  return crypto
    .createHmac('sha256', SEGREDO)
    .update('ticket:' + id)
    .digest('hex')
    .slice(0, 10);
}

function codigoValido(id, codigo) {
  if (!codigo) return false;
  const esperado = gerarCodigo(id);
  const recebido = String(codigo);
  return (
    recebido.length === esperado.length &&
    crypto.timingSafeEqual(Buffer.from(recebido), Buffer.from(esperado))
  );
}

module.exports = { gerarCodigo, codigoValido };
