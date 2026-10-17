// Parking Recife - painel web (JavaScript do navegador)
const $ = (seletor) => document.querySelector(seletor);

let token = null;
let usuario = null;

const FORMAS_PAGAMENTO = [
  { valor: 'pix', texto: 'PIX' },
  { valor: 'dinheiro', texto: 'Dinheiro' },
  { valor: 'cartao', texto: 'Cartao' },
];

// ---- Utilitarios -----------------------------------------------------------

function avisar(mensagem) {
  const el = $('#aviso');
  el.textContent = mensagem;
  el.classList.remove('oculto');
  setTimeout(() => el.classList.add('oculto'), 2500);
}

function formatarData(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('pt-BR');
}

async function api(caminho, opcoes = {}) {
  const cabecalhos = { 'Content-Type': 'application/json', ...(opcoes.headers || {}) };
  if (token) cabecalhos.Authorization = 'Bearer ' + token;

  const resposta = await fetch(caminho, { ...opcoes, headers: cabecalhos });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || 'Erro ' + resposta.status);
  return dados;
}

// ---- Login / sessao --------------------------------------------------------

function entrarNaSessao(usuarioLogado, tokenRecebido) {
  usuario = usuarioLogado;
  token = tokenRecebido;
  $('#telaLogin').classList.add('oculto');
  $('#painel').classList.remove('oculto');
  $('#areaUsuario').innerHTML =
    '<span>' + usuario.nome + ' (' + usuario.cargo + ')</span>' +
    '<button class="botao botao-claro" id="btnSair">Sair</button>';
  $('#btnSair').addEventListener('click', sair);
  carregarPainel();
}

function sair() {
  token = null;
  usuario = null;
  $('#painel').classList.add('oculto');
  $('#telaLogin').classList.remove('oculto');
  $('#areaUsuario').innerHTML = '';
}

// ---- Renderizacao ----------------------------------------------------------

function renderizarVeiculos(veiculos) {
  const corpo = $('#corpoVeiculos');
  corpo.innerHTML = '';
  $('#veiculosVazio').classList.toggle('oculto', veiculos.length > 0);

  for (const v of veiculos) {
    const linha = document.createElement('tr');

    const opcoes = FORMAS_PAGAMENTO
      .map((f) => '<option value="' + f.valor + '">' + f.texto + '</option>')
      .join('');

    linha.innerHTML =
      '<td>' + v.placa + '</td>' +
      '<td>' + (v.modelo || '-') + '</td>' +
      '<td>' + (v.cor || '-') + '</td>' +
      '<td>' + formatarData(v.data_entrada) + '</td>' +
      '<td><select data-id="' + v.id + '">' + opcoes + '</select></td>' +
      '<td><button class="botao botao-linha" data-id="' + v.id + '">Registar saida</button></td>';

    corpo.appendChild(linha);
  }

  corpo.querySelectorAll('button[data-id]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const id = Number(botao.dataset.id);
      const forma = corpo.querySelector('select[data-id="' + id + '"]').value;
      registarSaida(id, forma);
    });
  });
}

function renderizarTickets(tickets) {
  const corpo = $('#corpoTickets');
  corpo.innerHTML = '';
  $('#ticketsVazio').classList.toggle('oculto', tickets.length > 0);

  const nomes = Object.fromEntries(FORMAS_PAGAMENTO.map((f) => [f.valor, f.texto]));

  for (const t of tickets) {
    const linha = document.createElement('tr');
    linha.innerHTML =
      '<td>' + t.placa + '</td>' +
      '<td>R$ ' + t.valor_pago + '</td>' +
      '<td>' + formatarData(t.data_saida) + '</td>' +
      '<td>' + (nomes[t.forma_pagamento] || t.forma_pagamento) + '</td>' +
      '<td><button class="botao botao-claro" data-recibo="' + t.id + '">Reimprimir</button></td>';
    corpo.appendChild(linha);
  }

  corpo.querySelectorAll('button[data-recibo]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const url = '/recibo/' + botao.dataset.recibo + '?token=' + encodeURIComponent(token);
      window.open(url, '_blank');
    });
  });
}

// ---- Acoes -----------------------------------------------------------------

async function carregarPainel() {
  try {
    const [veiculos, tickets] = await Promise.all([
      api('/api/veiculos?status=no_patio'),
      api('/api/tickets'),
    ]);
    renderizarVeiculos(veiculos);
    renderizarTickets(tickets.slice(0, 10));
  } catch (erro) {
    avisar('Falha ao carregar: ' + erro.message);
  }
}

async function registarSaida(veiculoId, formaPagamento) {
  try {
    const ticket = await api('/api/tickets', {
      method: 'POST',
      body: JSON.stringify({ veiculo_id: veiculoId, forma_pagamento: formaPagamento }),
    });
    avisar('Saida registada. Valor: R$ ' + ticket.valor_pago);
    carregarPainel();
  } catch (erro) {
    avisar('Erro: ' + erro.message);
  }
}

// ---- Eventos ---------------------------------------------------------------

$('#formLogin').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  $('#loginErro').textContent = '';
  try {
    const dados = await api('/api/usuarios/login', {
      method: 'POST',
      body: JSON.stringify({ email: $('#loginEmail').value, senha: $('#loginSenha').value }),
    });
    entrarNaSessao(dados.usuario, dados.token);
  } catch (erro) {
    $('#loginErro').textContent = erro.message;
  }
});

$('#formEntrada').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  $('#entradaErro').textContent = '';
  try {
    await api('/api/veiculos', {
      method: 'POST',
      body: JSON.stringify({
        placa: $('#entPlaca').value,
        modelo: $('#entModelo').value,
        cor: $('#entCor').value,
      }),
    });
    $('#formEntrada').reset();
    avisar('Entrada registada.');
    carregarPainel();
  } catch (erro) {
    $('#entradaErro').textContent = erro.message;
  }
});

$('#btnAtualizar').addEventListener('click', carregarPainel);
