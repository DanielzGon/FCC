'use strict';

const http = require('http');
const {
  listarTarefas,
  criarTarefa,
  concluirTarefa,
  deletarTarefa
} = require('./store');

const PORTA = process.env.PORT || 0;

function enviarJson(res, status, corpo) {
  const payload = JSON.stringify(corpo);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload)
  });
  res.end(payload);
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    const pedacos = [];
    req.on('data', pedaco => pedacos.push(pedaco));
    req.on('end', () => resolve(Buffer.concat(pedacos).toString('utf8')));
    req.on('error', reject);
  });
}

function extrairIdDaUrl(url) {
  const partes = url.split('/').filter(Boolean); // ['', 'tarefas', '3'] -> ['tarefas', '3']
  if (partes.length !== 2 || partes[0] !== 'tarefas') return null;
  const id = Number(partes[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const servidor = http.createServer(async (req, res) => {
  const { method } = req;
  const url = req.url || '/';

  try {
    // GET /tarefas
    if (method === 'GET' && url === '/tarefas') {
      const tarefas = listarTarefas();
      return enviarJson(res, 200, tarefas);
    }

    // POST /tarefas
    if (method === 'POST' && url === '/tarefas') {
      const texto = await lerCorpo(req);
      let corpo;
      try {
        corpo = JSON.parse(texto || '{}');
      } catch (_) {
        return enviarJson(res, 400, { erro: 'JSON invalido' });
      }
      if (!corpo.titulo || String(corpo.titulo).trim() === '') {
        return enviarJson(res, 400, { erro: 'titulo e obrigatorio' });
      }
      const tarefa = criarTarefa(corpo.titulo.trim());
      return enviarJson(res, 201, tarefa);
    }

    // PATCH /tarefas/:id (marcar como concluida)
    if (method === 'PATCH' && url.startsWith('/tarefas/')) {
      const id = extrairIdDaUrl(url);
      if (!id) {
        return enviarJson(res, 404, { erro: 'tarefa nao encontrada' });
      }
      const tarefa = concluirTarefa(id);
      if (!tarefa) {
        return enviarJson(res, 404, { erro: 'tarefa nao encontrada' });
      }
      return enviarJson(res, 200, tarefa);
    }

    // DELETE /tarefas/:id
    if (method === 'DELETE' && url.startsWith('/tarefas/')) {
      const id = extrairIdDaUrl(url);
      if (!id) {
        return enviarJson(res, 404, { erro: 'tarefa nao encontrada' });
      }
      const removida = deletarTarefa(id);
      if (!removida) {
        return enviarJson(res, 404, { erro: 'tarefa nao encontrada' });
      }
      res.writeHead(204, { 'Content-Length': 0 });
      return res.end();
    }

    return enviarJson(res, 404, { erro: 'rota nao encontrada' });
  } catch (erro) {
    return enviarJson(res, 500, { erro: 'erro interno' });
  }
});

if (process.argv[1] === __filename || require.main === module) {
  servidor.listen(PORTA, () => {
    const endereco = servidor.address();
    console.log(`Servidor rodando na porta ${endereco.port}`);
  });
}

module.exports = { servidor };
