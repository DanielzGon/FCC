const API = '/api/tarefas';
const listaEl = document.getElementById('lista-tarefas');
const formEl = document.getElementById('form-tarefa');
const inputEl = document.getElementById('input-titulo');
const descricaoEl = document.getElementById('input-descricao');
const tempoEl = document.getElementById('input-tempo');

const modal = document.getElementById('modal-edicao');
const editIdEl = document.getElementById('edit-id');
const editTituloEl = document.getElementById('edit-titulo');
const editDescricaoEl = document.getElementById('edit-descricao');
const editTempoEl = document.getElementById('edit-tempo');
const btnSalvarEdicao = document.getElementById('btn-salvar-edicao');
const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');

let editandoId = null;
let timerId = null;

async function carregarTarefas() {
  const res = await fetch(API);
  const tarefas = await res.json();
  renderizar(tarefas);
}

function formatarTempo(segundos) {
  if (!segundos && segundos !== 0) return '--:--';
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function renderizar(tarefas) {
  listaEl.innerHTML = '';
  for (const tarefa of tarefas) {
    const card = document.createElement('article');
    card.className = `tarefa-card${tarefa.concluida ? ' concluida' : ''}`;

    const topo = document.createElement('div');
    topo.className = 'tarefa-topo';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = tarefa.concluida;
    checkbox.addEventListener('change', () => concluirTarefa(tarefa.id));

    const titulo = document.createElement('h3');
    titulo.className = 'tarefa-titulo';
    titulo.textContent = tarefa.titulo;

    const botoesTopo = document.createElement('div');
    botoesTopo.className = 'tarefa-botoes-topo';

    const btnEditar = document.createElement('button');
    btnEditar.type = 'button';
    btnEditar.className = 'btn-editar';
    btnEditar.textContent = 'Editar';
    btnEditar.addEventListener('click', () => abrirEdicao(tarefa));

    const btnExcluir = document.createElement('button');
    btnExcluir.type = 'button';
    btnExcluir.className = 'btn-excluir';
    btnExcluir.textContent = 'Excluir';
    btnExcluir.addEventListener('click', () => deletarTarefa(tarefa.id));

    botoesTopo.appendChild(btnEditar);
    botoesTopo.appendChild(btnExcluir);

    topo.appendChild(checkbox);
    topo.appendChild(titulo);
    topo.appendChild(botoesTopo);

    const corpo = document.createElement('div');
    corpo.className = 'tarefa-corpo';

    if (tarefa.descricao) {
      const descricaoResumo = document.createElement('div');
      descricaoResumo.className = 'descricao-resumo';
      descricaoResumo.textContent = tarefa.descricao;

      const btnExpandir = document.createElement('button');
      btnExpandir.type = 'button';
      btnExpandir.className = 'btn-expandir';
      btnExpandir.textContent = 'Expandir';
      btnExpandir.addEventListener('click', () => {
        const expandido = descricaoResumo.classList.toggle('expandida');
        btnExpandir.textContent = expandido ? 'Recolher' : 'Expandir';
      });

      corpo.appendChild(descricaoResumo);
      corpo.appendChild(btnExpandir);
    }

    const tempoDisplay = document.createElement('div');
    tempoDisplay.className = 'tarefa-tempo';
    tempoDisplay.id = `tempo-${tarefa.id}`;
    tempoDisplay.textContent = tarefa.tempoMinutos
      ? `Tempo: ${formatarTempo(tarefa.tempoRestanteSegundos)}`
      : 'Sem tempo definido';

    corpo.appendChild(tempoDisplay);

    card.appendChild(topo);
    card.appendChild(corpo);

    listaEl.appendChild(card);
  }
}

function atualizarCronometros(tarefas) {
  for (const tarefa of tarefas) {
    if (!tarefa.tempoMinutos || tarefa.concluida) continue;

    const agora = Date.now();
    const criadoEm = new Date(tarefa.criadaEm).getTime();
    const totalSegundos = tarefa.tempoMinutos * 60;
    const decorridos = Math.floor((agora - criadoEm) / 1000);
    const restante = Math.max(totalSegundos - decorridos, 0);

    const el = document.getElementById(`tempo-${tarefa.id}`);
    if (el) {
      el.textContent = restante === 0
        ? 'Tempo: 00:00 (expirado)'
        : `Tempo: ${formatarTempo(restante)}`;
    }
  }
}

function abrirEdicao(tarefa) {
  editandoId = tarefa.id;
  editIdEl.value = tarefa.id;
  editTituloEl.value = tarefa.titulo;
  editDescricaoEl.value = tarefa.descricao || '';
  editTempoEl.value = tarefa.tempoMinutos || '';
  modal.showModal();
}

function fecharEdicao() {
  modal.close();
  editandoId = null;
  editTituloEl.value = '';
  editDescricaoEl.value = '';
  editTempoEl.value = '';
}

async function adicionarTarefa(event) {
  event.preventDefault();
  const titulo = inputEl.value.trim();
  if (!titulo) return;

  const tempoMinutos = tempoEl.value.trim() ? Number(tempoEl.value) : null;
  const descricao = descricaoEl.value.trim();

  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo, tempoMinutos, descricao })
  });

  if (res.ok) {
    inputEl.value = '';
    descricaoEl.value = '';
    tempoEl.value = '';
    carregarTarefas();
  }
}

async function salvarEdicao() {
  const titulo = editTituloEl.value.trim();
  if (!titulo) return;

  const tempoMinutos = editTempoEl.value.trim() === '' ? null : Number(editTempoEl.value);
  const descricao = editDescricaoEl.value.trim();

  await fetch(`${API}/${editandoId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo, descricao, tempoMinutos })
  });

  fecharEdicao();
  carregarTarefas();
}

async function concluirTarefa(id) {
  await fetch(`${API}/${id}`, { method: 'PATCH' });
  carregarTarefas();
}

async function deletarTarefa(id) {
  await fetch(`${API}/${id}`, { method: 'DELETE' });
  carregarTarefas();
}

function iniciarRelogio() {
  if (timerId) return;
  timerId = setInterval(async () => {
    const res = await fetch(API);
    const tarefas = await res.json();
    renderizar(tarefas);
    atualizarCronometros(tarefas);
  }, 1000);
}

formEl.addEventListener('submit', adicionarTarefa);
btnSalvarEdicao.addEventListener('click', salvarEdicao);
btnCancelarEdicao.addEventListener('click', fecharEdicao);
modal.addEventListener('click', (event) => {
  if (event.target === modal) fecharEdicao();
});

carregarTarefas();
iniciarRelogio();
