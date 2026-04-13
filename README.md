# H101 - Organização do Projeto

Este repositório está organizado para trabalho em equipa (5 elementos):

- Mendes
- Luis
- Nuno
- Henrique
- Rui

## Estrutura

- `Front-Office/` — site público (Vue 3 + Vite). Dentro de `src/`: `views/` (ecrãs por rota), `components/`, `stores/`, `router/`, `utils/`, `config/`, `styles/`.
- `Back-Office/` — consola de administração (Vue 3 + Vite). Mesma ideia: `views/`, `layouts/`, `components/`, `stores/`, etc.
- `PWA/` — PWA dos estafetas; projeto ativo em `PWA/estafeta-app/`.
- `backend/` — API Strapi (não é Vue).

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

Abrir o monorepo no VS Code/Cursor: ficheiro `H101.code-workspace` na raiz (pastas Front-Office, Back-Office, PWA e backend).

O `.gitignore` na raiz ignora `**/.cursor/skills/`, `**/.agent/`, `**/node_modules/`, `**/dist/`, `.vite`, `**/.tmp/`, `**/.strapi/`, `**/.git-frontend-backup/`, `PWA/project-*/` (protótipos duplicados) e `.DS_Store`, para o zip de entrega e o repositório não levarem artefactos locais nem pastas de skills do editor.
