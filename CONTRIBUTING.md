# Guia de Colaboração (H101)

## Workflow recomendado

1. Atualizar `main` local:
   - `git checkout main`
   - `git pull origin main`
2. Criar branch por tarefa:
   - `git checkout -b feature/<nome>-<tema>`
3. Trabalhar e validar localmente.
4. Commit com mensagem clara:
   - `feat(front-office): add login form`
   - `fix(pwa): correct offline cache key`
5. Publicar branch:
   - `git push -u origin feature/<nome>-<tema>`
6. Abrir Pull Request para `main`.

## Convenções para evitar sobrescrever trabalho dos outros

- Não fazer `push` direto na `main`.
- Não usar `git push --force` em branches partilhadas.
- Fazer `pull` da `main` todos os dias antes de começar.
- Resolver conflitos localmente antes de abrir PR.
- Preferir PRs pequenas (mais fáceis de rever e com menos conflitos).

## Distribuição sugerida (ponto de partida)

- Mendes: coordenação + integração
- Luis: tarefas Front-Office
- Nuno: tarefas Back-Office
- Henrique: tarefas PWA
- Rui: testes e validação cruzada

Podem ajustar esta distribuição conforme o avanço do projeto.
