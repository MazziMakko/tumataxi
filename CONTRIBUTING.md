# Contributing to Tuma Taxi

## Code of Conduct

Be respectful, professional, and constructive.

## Development Workflow

### 1. Fork & Clone

```bash
git clone https://github.com/MazziMakko/tumataxi.git
cd tumataxi
npm install
```

### 2. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Follow existing code style
- Add TypeScript types
- Run: `npm run lint:fix`
- Run: `npm run type-check`

### 4. Commit Messages

```
feat: Add new feature
fix: Resolve bug
docs: Update documentation
test: Add unit tests
refactor: Restructure code
chore: Dependency updates
```

### 5. Push & Create PR

```bash
git push origin feature/your-feature-name
```

## Pull Request Requirements

- ✅ All tests pass
- ✅ Types validated
- ✅ Code formatted
- ✅ Documentation updated
- ✅ No console warnings/errors

## Financial/Ledger Changes

**CRITICAL:** Any changes to commission logic, ledger entries, or financial calculations require:

1. Detailed description of changes
2. Before/after examples
3. Ledger impact analysis
4. Full test coverage
5. Owner approval (@MazziMakko)

## Questions?

Create a discussion or contact: support@tumataxi.mz
