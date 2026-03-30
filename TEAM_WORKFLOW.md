# Workflow de Equipa (H101)

Objetivo: evitar conflitos e perda de trabalho entre Mendes, Luis, Nuno, Henrique e Rui.

## 1) Branch por pessoa e tarefa

Formato:

- `feature/mendes-<tema>`
- `feature/luis-<tema>`
- `feature/nuno-<tema>`
- `feature/henrique-<tema>`
- `feature/rui-<tema>`

Exemplo:

- `feature/mendes-auth-login`

## 2) Fluxo obrigatório antes de programar

```bash
git checkout main
git pull origin main
git checkout -b feature/<nome>-<tema>
```

## 3) Fluxo para entregar trabalho

```bash
git add .
git commit -m "feat(<area>): <mensagem curta>"
git push -u origin feature/<nome>-<tema>
```

Depois abrir Pull Request para `main`.

## 4) Regras de segurança da equipa

- Nunca fazer `push` direto para `main`
- Nunca usar `git push --force` em branches partilhadas
- PR pequena e focada (menos conflito)
- Resolver conflitos na própria branch antes do merge

## 5) Convenção de commits

- `feat(front-office): ...`
- `feat(back-office): ...`
- `feat(pwa): ...`
- `fix(front-office): ...`
- `docs: ...`
- `chore: ...`
