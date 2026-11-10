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

function criarTarefa(titulo, tempoMinutos, descricao) {
  const tarefas = lerTarefas();
  const tarefa = {
    id: proximoId(tarefas),
    titulo: String(titulo),
    descricao: descricao ? String(descricao) : '',
    concluida: false,
    criadaEm: new Date().toISOString(),
    tempoMinutos: tempoMinutos ? Number(tempoMinutos) : null,
    tempoRestanteSegundos: tempoMinutos ? Math.floor(Number(tempoMinutos) * 60) : null
  };
  tarefas.push(tarefa);
  gravarTarefas(tarefas);
  return tarefa;
}

function editarTarefa(id, campos) {
  const tarefas = lerTarefas();
  const indice = tarefas.findIndex(t => Number(t.id) === Number(id));
  if (indice === -1) return null;
  if (campos.titulo !== undefined) tarefas[indice].titulo = String(campos.titulo);
  if (campos.descricao !== undefined) tarefas[indice].descricao = String(campos.descricao);
  if (campos.tempoMinutos !== undefined) {
    const tempo = campos.tempoMinutos === null || campos.tempoMinutos === '' || campos.tempoMinutos === undefined
      ? null
      : Number(campos.tempoMinutos);
    tarefas[indice].tempoMinutos = tempo;
    tarefas[indice].tempoRestanteSegundos = tempo ? Math.floor(tempo * 60) : null;
  }
  gravarTarefas(tarefas);
  return tarefas[indice];
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
  editarTarefa,
  concluirTarefa,
  deletarTarefa,
  DATA_FILE
};
