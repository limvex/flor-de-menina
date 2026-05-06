# Como contribuir

## Fluxo de desenvolvimento

1. Pegue uma issue do GitHub Project
2. Mova pra "In Progress"
3. Crie branch a partir de `main`:
```bash
git checkout main && git pull
git checkout -b feat/NN-nome-da-task
```
4. Desenvolva seguindo o checklist da issue
5. Rode validações locais antes do PR:
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
6. Commit seguindo conventional commits:
```bash
git commit -m "feat: implementa CRUD de produtos"
```
7. Push e abra PR contra `main`
8. PR precisa referenciar a issue: `Closes #N`
9. Após merge, mova issue pra "Done"

## Convenção de branches
- `feat/NN-nome` — nova feature (NN = número da issue)
- `fix/NN-nome` — correção de bug
- `chore/NN-nome` — tarefa de manutenção
- `docs/NN-nome` — documentação

## Code review
- Self-review antes de pedir review
- PRs pequenos sempre que possível, mas não fragmente artificialmente
- Inclua print/vídeo de UI quando aplicável

## Testes
- E2E com Playwright em fluxos críticos (login, checkout, admin CRUD)
- Unitários no NestJS pra services com lógica não-trivial
- Sem dogma de cobertura: testa o que dói se quebrar
