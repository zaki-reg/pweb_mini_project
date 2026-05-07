# Git Commit Language

## Format
```
<type>(<scope>): <subject>

<body>
```

## Types
- **feat**: New feature or functionality
- **fix**: Bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without feature/fix
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, tooling
- **perf**: Performance improvements
- **ci**: CI/CD configuration changes

## Scope
- `backend` - Backend code changes
- `frontend` - Frontend code changes
- `db` - Database schema or migrations
- `config` - Configuration files
- `docs` - Documentation
- `infra` - Infrastructure (Docker, etc.)

## Rules
- Use imperative mood (add, not added/adding)
- Subject: max 50 chars, lowercase
- Body: max 72 chars per line
- Reference issues when applicable: Fixes #123
- Multiple scopes allowed: feat(backend,docs): ...

## Examples
```
feat(backend): add user authentication endpoint
fix(frontend): resolve login button alignment
docs: update API documentation
chore(config): add Docker compose for local development
refactor(db): simplify migration script structure
```