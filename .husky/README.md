# Husky Git Hooks Configuration

This directory contains the Git hooks managed by Husky for the hybrid encryption
library.

## Hooks Setup

### Pre-commit (`.husky/pre-commit`)

**Purpose**: Fast quality checks before each commit **Duration**: ~5-10 seconds
**Checks**:

- Code formatting and linting via lint-staged
- TypeScript type checking
- ESLint error checking (warnings allowed)

### Pre-push (`.husky/pre-push`)

**Purpose**: Comprehensive validation before pushing to remote **Duration**:
~3-5 minutes **Checks**:

- Full test suite (313 tests)
- TypeScript compilation
- Build verification

## Developer Workflow

### Fast Development Cycle

```bash
# Make changes
git add .
git commit -m "message"  # ⚡ Fast (~10 seconds)
git commit -m "message"  # ⚡ Fast again
git commit -m "message"  # ⚡ Keep working quickly
```

### Before Sharing Code

```bash
git push origin main      # 🧪 Comprehensive checks (~3-5 minutes)
```

## Manual Quality Checks

```bash
npm run quality-check     # Fast error-only check
npm run lint             # Full lint with warnings
npm run test:run         # Full test suite
npm run build            # TypeScript compilation
```

## Benefits

- **Fast commits**: No more waiting 3 minutes for every commit
- **Comprehensive validation**: Full checks before code is shared
- **Early error detection**: Critical issues caught quickly
- **Flexible development**: Warnings don't block development flow
