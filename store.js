'use strict';

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'tarefas.json');

function lerTarefas() {
  try {
    const conteudo = fs.readFileSync(DATA_FILE, 'utf8');
    if (!conteudo.trim()) return [];
    const dados = JSON.parse(conteudo);
    return Array.isArray(dados) ? dados : [];
  } catch (erro) {
    if (erro.code === 'ENOENT') return [];
    throw erro;
  }
}

function gravarTarefas(tarefas) {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(tarefas, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

function proximoId(tarefas) {
  if (tarefas.length === 0) return 1;
  const ids = tarefas.map(t => Number(t.id));
  return Math.max(...ids) + 1;
}

function listarTarefas() {
  return lerTarefas();
}

function criarTarefa(titulo) {
  const tarefas = lerTarefas();
  const tarefa = {
    id: proximoId(tarefas),
    titulo: String(titulo),
    concluida: false,
    criadaEm: new Date().toISOString()
  };
  tarefas.push(tarefa);
  gravarTarefas(tarefas);
  return tarefa;
}

function concluirTarefa(id) {
  const tarefas = lerTarefas();
  const indice = tarefas.findIndex(t => Number(t.id) === Number(id));
  if (indice === -1) return null;
  tarefas[indice].concluida = true;
  gravarTarefas(tarefas);
  return tarefas[indice];
}

function deletarTarefa(id) {
  const tarefas = lerTarefas();
  const indice = tarefas.findIndex(t => Number(t.id) === Number(id));
  if (indice === -1) return false;
  const [removida] = tarefas.splice(indice, 1);
  gravarTarefas(tarefas);
  return removida;
}

module.exports = {
  listarTarefas,
  criarTarefa,
  concluirTarefa,
  deletarTarefa,
  DATA_FILE
};
