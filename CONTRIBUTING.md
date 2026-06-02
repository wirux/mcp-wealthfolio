# Contributing to @wirux/mcp-wealthfolio

## Dev Setup

```bash
git clone https://github.com/wirux/mcp-wealthfolio
cd mcp-wealthfolio
npm install
npm test
```

## TDD Workflow

1. Write the test file first (RED phase)
2. Implement to make tests pass (GREEN phase)
3. Refactor while keeping tests green (REFACTOR phase)
4. Commit test and implementation together

Tests are co-located: `foo.ts` + `foo.test.ts` in the same directory.

## Layer Boundaries

Dependencies flow inward only:
- `presentation/` → `use-cases/` → `domain/`
- `infrastructure/` → `domain/`
- `domain/` → nothing external

**Never** import from an outer layer into an inner layer.

See `CLAUDE.md` for complete layer rules, naming conventions, and patterns.

## Conventional Commits

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(domain): add Money value object
fix(infra): correct cookie refresh timing
test(use-case): add edge cases for empty portfolio
docs: update README with Docker quickstart
chore: upgrade @modelcontextprotocol/sdk
```

Types: `feat`, `fix`, `test`, `docs`, `chore`, `refactor`, `perf`
Scopes: `domain`, `use-case`, `infra`, `presentation`, `ci`, `docker`

Breaking changes: add `!` after type (`feat!:`) or `BREAKING CHANGE:` in footer.
