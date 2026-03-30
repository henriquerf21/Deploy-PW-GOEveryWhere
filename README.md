# H101 - Organização do Projeto

Este repositório está organizado para trabalho em equipa (5 elementos):

- Mendes
- Luis
- Nuno
- Henrique
- Rui

## Estrutura

- `Front-Office/` - aplicação web atual (Vue + Vite)
- `Back-Office/` - área reservada para backend/admin
- `PWA/` - área reservada para funcionalidades PWA

## Regras rápidas para evitar conflitos

1. Ninguém trabalha diretamente na `main`.
2. Cada tarefa vai numa branch própria:
   - `feature/mendes-login`
   - `feature/luis-dashboard`
3. Antes de começar:
   - `git checkout main`
   - `git pull origin main`
4. Depois:
   - `git checkout -b feature/<nome>-<tarefa>`
   - Commits pequenos e frequentes
   - `git push -u origin feature/<nome>-<tarefa>`
5. Criar Pull Request para `main` e só fazer merge após revisão.

Mais detalhes em `CONTRIBUTING.md`.
