# Lista de Tarefas (Node.js, sem dependencias externas)

API REST mínima criada apenas com módulos nativos do Node.js (`http`, `fs`). A interface web (HTML/CSS/JS) é servida pelo próprio servidor a partir da pasta `/public`.

## Estrutura

```
tarefas/
├─ server.js          # Servidor HTTP + roteamento da API e arquivos estáticos
├─ store.js           # Leitura/gravacao atomica de tarefas.json
├─ tarefas.json       # Banco de dados em arquivo JSON
├─ public/
│  ├─ index.html      # Interface web
│  ├─ style.css       # Estilos
│  └─ app.js          # Logica do frontend (fetch para a API)
└─ README.md
```

## Endpoints da API

| Método | Caminho | Descrição |
|--------|---------|-----------|
| GET | `/api/tarefas` | Lista todas as tarefas |
| POST | `/api/tarefas` | Cria uma tarefa (body: `{ "titulo": "..." }`) |
| PATCH | `/api/tarefas/:id` | Marca uma tarefa como concluída |
| DELETE | `/api/tarefas/:id` | Remove uma tarefa |

## Como rodar

```bash
node server.js
```

O servidor escuta em `http://127.0.0.1:PORT` (usa a variavel `PORT` ou a porta 3000 por padrão).

Abra `http://127.0.0.1:3000` no navegador para usar a interface web.

## Como testar

```bash
node --test
```

Todos os testes usam `node:test` + `node:assert` e cobrem os quatro endpoints da API (casos de sucesso e erro).

## Requisitos

- Node.js (modulos nativos apenas, sem `npm install`)
