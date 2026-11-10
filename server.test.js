'use strict';

const { test, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { servidor } = require('./server');
const { DATA_FILE } = require('./store');
const fs = require('fs');

const HOST = 'http://127.0.0.1';

// Inicia o servidor em uma porta aleatória antes dos testes
servidor.listen(0, '127.0.0.1');

function requisicao(method, caminho, corpo) {
  return new Promise((resolve, reject) => {
    const url = new URL(caminho, HOST);
    const options = {
      hostname: url.hostname,
      port: servidor.address().port,
      path: url.pathname,
      method,
      headers: corpo ? { 'Content-Type': 'application/json' } : {}
    };
    const req = http.request(options, res => {
      const pedacos = [];
      res.on('data', pedaco => pedacos.push(pedaco));
      res.on('end', () => {
        const texto = Buffer.concat(pedacos).toString('utf8');
        resolve({ status: res.statusCode, corpo: texto ? JSON.parse(texto) : null });
      });
    });
    req.on('error', reject);
    if (corpo) req.write(JSON.stringify(corpo));
    req.end();
  });
}

function limparDados() {
  try {
    fs.writeFileSync(DATA_FILE, '[]\n');
  } catch (_) {}
}

async function criar(titulo) {
  return requisicao('POST', `${HOST}:${servidor.address().port}/tarefas`, { titulo });
}

test('GET /tarefas lista tarefas', async () => {
  limparDados();
  await criar('Estudar Node');
  await criar('Fazer compras');

  const res = await requisicao('GET', `${HOST}:${servidor.address().port}/tarefas`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.corpo.length, 2);
  assert.strictEqual(res.corpo[0].titulo, 'Estudar Node');
  assert.strictEqual(res.corpo[0].concluida, false);
  assert.strictEqual(res.corpo[1].titulo, 'Fazer compras');
});

test('POST /tarefas cria tarefa e retorna 201', async () => {
  limparDados();
  const res = await criar('Nova tarefa');
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.corpo.titulo, 'Nova tarefa');
  assert.strictEqual(res.corpo.concluida, false);
  assert.strictEqual(typeof res.corpo.id, 'number');
});

test('POST /tarefas rejeita titulo ausente com 400', async () => {
  limparDados();
  const res = await requisicao('POST', `${HOST}:${servidor.address().port}/tarefas`, {});
  assert.strictEqual(res.status, 400);
});

test('PATCH /tarefas/:id marca como concluida', async () => {
  limparDados();
  const criada = await criar('Para concluir');
  const res = await requisicao('PATCH', `${HOST}:${servidor.address().port}/tarefas/${criada.corpo.id}`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.corpo.concluida, true);
});

test('PATCH /tarefas/:id inexistente retorna 404', async () => {
  limparDados();
  const res = await requisicao('PATCH', `${HOST}:${servidor.address().port}/tarefas/9999`);
  assert.strictEqual(res.status, 404);
});

test('DELETE /tarefas/:id remove a tarefa', async () => {
  limparDados();
  const criada = await criar('Para deletar');
  const res = await requisicao('DELETE', `${HOST}:${servidor.address().port}/tarefas/${criada.corpo.id}`);
  assert.strictEqual(res.status, 204);

  const listagem = await requisicao('GET', `${HOST}:${servidor.address().port}/tarefas`);
  assert.strictEqual(listagem.corpo.length, 0);
});

test('DELETE /tarefas/:id inexistente retorna 404', async () => {
  limparDados();
  const res = await requisicao('DELETE', `${HOST}:${servidor.address().port}/tarefas/9999`);
  assert.strictEqual(res.status, 404);
});

after(() => {
  servidor.close();
  limparDados();
});
