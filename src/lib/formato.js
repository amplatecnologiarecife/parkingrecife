// Formatacao partilhada (datas, moeda e escape de HTML)
function formatarDataHora(data) {
  const d = new Date(data);
  const p = (n) => String(n).padStart(2, '0');
  return (
    p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' +
    p(d.getHours()) + ':' + p(d.getMinutes())
  );
}

function formatarMoeda(valor) {
  return 'R$ ' + Number(valor).toFixed(2).replace('.', ',');
}

function formatarFormaPagamento(forma) {
  const nomes = { pix: 'PIX', dinheiro: 'Dinheiro', cartao: 'Cartao' };
  return nomes[forma] || forma;
}

function escapar(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

module.exports = { formatarDataHora, formatarMoeda, formatarFormaPagamento, escapar };
