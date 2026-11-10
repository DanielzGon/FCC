# API de Tarefas (Node.js, sem dependencias externas)

API REST mínima criada apenas com módulos nativos do Node.js (`http`, `fs`, `node:test`).

## Endpoints

| Método | Caminho | Descrição |
|--------|---------|-----------|
| GET | `/tarefas` | Lista todas as tarefas |
| POST | `/tarefas` | Cria uma tarefa (body: `{ "titulo": "..." }`) |
| PATCH | `/tarefas/:id` | Marca uma tarefa como concluída |
| DELETE | `/tarefas/:id` | Remove uma tarefa |

Os dados são salvos em `tarefas.json`.

## Como rodar

```bash
node server.js
```

O servidor escuta na porta definida por `PORT` ou em uma porta aleatória se não informada.

## Como testar

```bash
node --test
```

Todos os testes usam `node:test` + `node:assert` e cobrem os quatro endpoints (casos de sucesso e erro).

## Requisitos

- Node.js (modulos nativos apenas, sem `npm install`)
