// Middleware: exige um token de login valido no cabecalho Authorization
const jwt = require('jsonwebtoken');

function exigirLogin(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: 'Token em falta. Faca login primeiro.' });
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (erro) {
    return res.status(401).json({ erro: 'Token invalido ou expirado.' });
  }
}

module.exports = exigirLogin;
