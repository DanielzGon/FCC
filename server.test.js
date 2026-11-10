'use strict';

const http = require('http');
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { servidor } = require('./server');

const DATA_FILE = path.join(__dirname, 'tarefas.json');

let porta;

test('inicia o servidor', async () => {
  await new Promise(resolve => {
    servidor.listen(0, '127.0.0.1', () => {
      const endereco = servidor.address();
      porta = endereco.port;
      resolve();
    });
  });
});

async function requisicao(method, url, corpo) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: porta,
      path: url,
      method,
      headers: corpo ? { 'Content-Type': 'application/json' } : {}
    };
    const req = http.request(opts, res => {
      const pedacos = [];
      res.on('data', pedaco => pedacos.push(pedaco));
      res.on('end', () => {
        const texto = Buffer.concat(pedacos).toString('utf8');
        let corpoParseado = texto;
        if (texto) {
          try {
            corpoParseado = JSON.parse(texto);
          } catch (_) {
            corpoParseado = texto;
          }
        }
        resolve({ status: res.statusCode, corpo: corpoParseado });
      });
    });
    req.on('error', reject);
    if (corpo) req.write(JSON.stringify(corpo));
    req.end();
  });
}

async function limparTarefas() {
  fs.writeFileSync(DATA_FILE, '[]');
}

test('GET /api/tarefas retorna lista vazia inicialmente', async () => {
  await limparTarefas();
  const res = await requisicao('GET', '/api/tarefas');
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.corpo, []);
});

test('POST /api/tarefas cria uma tarefa e retorna 201', async () => {
  await limparTarefas();
  const res = await requisicao('POST', '/api/tarefas', { titulo: 'Estudar Node.js' });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.corpo.titulo, 'Estudar Node.js');
  assert.strictEqual(res.corpo.concluida, false);
  assert.strictEqual(Number.isInteger(res.corpo.id), true);
  assert.strictEqual(res.corpo.id, 1);
});

test('POST /api/tarefas retorna 400 quando titulo nao e informado', async () => {
  await limparTarefas();
  const res = await requisicao('POST', '/api/tarefas', { titulo: '' });
  assert.strictEqual(res.status, 400);
  assert.ok(res.corpo.erro);
});

test('GET /api/tarefas lista as tarefas criadas', async () => {
  await limparTarefas();
  await requisicao('POST', '/api/tarefas', { titulo: 'Tarefa A' });
  await requisicao('POST', '/api/tarefas', { titulo: 'Tarefa B' });
  const res = await requisicao('GET', '/api/tarefas');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.corpo.length, 2);
  assert.strictEqual(res.corpo[0].titulo, 'Tarefa A');
  assert.strictEqual(res.corpo[1].titulo, 'Tarefa B');
});

test('PATCH /api/tarefas/:id marca tarefa como concluida', async () => {
  await limparTarefas();
  const criada = await requisicao('POST', '/api/tarefas', { titulo: 'Para concluir' });
  const res = await requisicao('PATCH', `/api/tarefas/${criada.corpo.id}`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.corpo.concluida, true);
  assert.strictEqual(res.corpo.id, criada.corpo.id);
});

test('PATCH /api/tarefas/:id retorna 404 para id inexistente', async () => {
  await limparTarefas();
  const res = await requisicao('PATCH', '/api/tarefas/999');
  assert.strictEqual(res.status, 404);
});

test('DELETE /api/tarefas/:id remove a tarefa e retorna 204', async () => {
  await limparTarefas();
  const criada = await requisicao('POST', '/api/tarefas', { titulo: 'Para deletar' });
  const res = await requisicao('DELETE', `/api/tarefas/${criada.corpo.id}`);
  assert.strictEqual(res.status, 204);

  const listagem = await requisicao('GET', '/api/tarefas');
  assert.strictEqual(listagem.corpo.length, 0);
});

test('DELETE /api/tarefas/:id retorna 404 para id inexistente', async () => {
  await limparTarefas();
  const res = await requisicao('DELETE', '/api/tarefas/999');
  assert.strictEqual(res.status, 404);
});

test('GET / serve o index.html', async () => {
  const res = await requisicao('GET', '/');
  assert.strictEqual(res.status, 200);
  assert.ok(res.corpo.includes('<html'));
});

test('GET rotas inexistentes retorna 404', async () => {
  const res = await requisicao('GET', '/api/inexistente');
  assert.strictEqual(res.status, 404);
  assert.ok(res.corpo.erro);
});
