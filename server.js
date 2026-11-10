'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const {
  listarTarefas,
  criarTarefa,
  editarTarefa,
  concluirTarefa,
  deletarTarefa
} = require('./store');

const PORTA = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

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
  const partes = url.split('/').filter(Boolean);
  if (partes.length !== 3 || partes[0] !== 'api' || partes[1] !== 'tarefas') return null;
  const id = Number(partes[2]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function servirArquivo(res, caminhoArquivo, tipoConteudo) {
  fs.readFile(caminhoArquivo, (erro, conteudo) => {
    if (erro) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Arquivo não encontrado');
      return;
    }
    res.writeHead(200, { 'Content-Type': tipoConteudo + '; charset=utf-8' });
    res.end(conteudo);
  });
}

const servidor = http.createServer(async (req, res) => {
  const { method } = req;
  const url = req.url || '/';

  try {
    // --- API ---
    if (url.startsWith('/api/')) {
      // GET /api/tarefas
      if (method === 'GET' && url === '/api/tarefas') {
        const tarefas = listarTarefas();
        return enviarJson(res, 200, tarefas);
      }

      // POST /api/tarefas
      if (method === 'POST' && url === '/api/tarefas') {
        const texto = await lerCorpo(req);
        let corpo;
        try {
          corpo = JSON.parse(texto || '{}');
        } catch (_) {
          return enviarJson(res, 400, { erro: 'JSON inválido' });
        }
        if (!corpo.titulo || String(corpo.titulo).trim() === '') {
          return enviarJson(res, 400, { erro: 'título é obrigatório' });
        }
        let tempoMinutos = corpo.tempoMinutos;
        if (tempoMinutos !== undefined && tempoMinutos !== null && tempoMinutos !== '') {
          tempoMinutos = Number(tempoMinutos);
          if (!Number.isFinite(tempoMinutos) || tempoMinutos <= 0) {
            return enviarJson(res, 400, { erro: 'tempo deve ser um numero maior que zero' });
          }
        } else {
          tempoMinutos = null;
        }
        const tarefa = criarTarefa(corpo.titulo.trim(), tempoMinutos, corpo.descricao);
        return enviarJson(res, 201, tarefa);
      }

      // PATCH /api/tarefas/:id
      if (method === 'PATCH' && url.startsWith('/api/tarefas/')) {
        const id = extrairIdDaUrl(url);
        if (!id) {
          return enviarJson(res, 404, { erro: 'tarefa não encontrada' });
        }
        const tarefa = concluirTarefa(id);
        if (!tarefa) {
          return enviarJson(res, 404, { erro: 'tarefa não encontrada' });
        }
        return enviarJson(res, 200, tarefa);
      }

      // PUT /api/tarefas/:id  (editar titulo, descricao e/ou tempo)
      if (method === 'PUT' && url.startsWith('/api/tarefas/')) {
        const id = extrairIdDaUrl(url);
        if (!id) {
          return enviarJson(res, 404, { erro: 'tarefa não encontrada' });
        }
        const corpoEdicao = {};
        if (corpo.titulo !== undefined) corpoEdicao.titulo = corpo.titulo;
        if (corpo.descricao !== undefined) corpoEdicao.descricao = corpo.descricao;
        if (corpo.tempoMinutos !== undefined) corpoEdicao.tempoMinutos = corpo.tempoMinutos;
        const atualizada = editarTarefa(id, corpoEdicao);
        if (!atualizada) {
          return enviarJson(res, 404, { erro: 'tarefa não encontrada' });
        }
        return enviarJson(res, 200, atualizada);
      }

      // DELETE /api/tarefas/:id
      if (method === 'DELETE' && url.startsWith('/api/tarefas/')) {
        const id = extrairIdDaUrl(url);
        if (!id) {
          return enviarJson(res, 404, { erro: 'tarefa não encontrada' });
        }
        const removida = deletarTarefa(id);
        if (!removida) {
          return enviarJson(res, 404, { erro: 'tarefa não encontrada' });
        }
        res.writeHead(204, { 'Content-Length': 0 });
        return res.end();
      }

      return enviarJson(res, 404, { erro: 'rota não encontrada' });
    }

    // --- Arquivos estáticos ---
    if (method === 'GET') {
      if (url === '/') {
        return servirArquivo(res, path.join(PUBLIC_DIR, 'index.html'), 'text/html');
      }
      if (url === '/style.css') {
        return servirArquivo(res, path.join(PUBLIC_DIR, 'style.css'), 'text/css');
      }
      if (url === '/app.js') {
        return servirArquivo(res, path.join(PUBLIC_DIR, 'app.js'), 'application/javascript');
      }
    }

    return enviarJson(res, 404, { erro: 'rota não encontrada' });
  } catch (erro) {
    return enviarJson(res, 500, { erro: 'erro interno' });
  }
});

if (process.argv[1] === __filename || require.main === module) {
  servidor.listen(PORTA, '127.0.0.1', () => {
    const endereco = servidor.address();
    console.log(`Servidor rodando em http://${endereco.address}:${endereco.port}`);
  });
}

module.exports = { servidor };
