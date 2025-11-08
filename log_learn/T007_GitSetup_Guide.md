# T007: Git Setup - Educational Guide

**Topic**: .gitignore Configuration and Git Best Practices
**Task**: H007 - Git setup with .gitignore
**Date**: 2025-11-08
**Level**: Beginner to Intermediate

---

## Overview

This guide teaches how to properly configure .gitignore for version control hygiene. You'll learn what should and shouldn't be tracked, how to organize .gitignore patterns, and best practices for team collaboration.

**By the end of this guide, you'll understand**:
- What .gitignore is and why it's critical
- Common patterns and what they mean
- How to organize .gitignore for maintainability
- Security best practices (never commit secrets!)
- How to fix mistakes (accidentally committed files)

---

## Table of Contents

1. [Why .gitignore Matters](#why-gitignore-matters)
2. [.gitignore Basics](#gitignore-basics)
3. [Common Patterns](#common-patterns)
4. [Organization Strategies](#organization-strategies)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)
7. [Real-World Examples](#real-world-examples)
8. [Additional Resources](#additional-resources)

---

## Why .gitignore Matters

### The Cost of Not Using .gitignore

**Scenario**: Project without .gitignore

```bash
$ git status
Untracked files:
  node_modules/         (100,000+ files)
  .env                  (contains API keys)
  dist/                 (10,000+ files)
  coverage/             (5,000+ files)
  .DS_Store             (macOS metadata)
  *.log                 (runtime logs)
```

**Problems**:
- **Bloated Repository**: Commits 100K+ unnecessary files
- **Security Risk**: Accidentally commits API keys in .env
- **Merge Conflicts**: Build outputs differ per developer
- **Slow Operations**: git commands take 10x longer
- **Polluted History**: Can't find actual code changes

**With .gitignore**:

```bash
$ git status
On branch main
nothing to commit, working tree clean
```

**Benefits**:
- Only tracks source code (100 files vs 100,000)
- Secrets never committed (.env ignored)
- No merge conflicts on generated files
- Fast git operations (<1 second)
- Clean, readable git history

### .gitignore ROI (Return on Investment)

**Investment**: 30 minutes creating comprehensive .gitignore

**Returns**:
- Prevent security incidents (API key leaks)
- Save 10+ hours debugging merge conflicts
- Reduce repository size by 95%
- Speed up git operations by 10x
- Enable team collaboration without friction

**Break-even**: After first security incident prevented, .gitignore pays for itself

---

## .gitignore Basics

### What is .gitignore?

`.gitignore` is a special file that tells git which files/directories to ignore.

**Location**: Project root directory (`.gitignore`)

**Format**: Plain text file, one pattern per line

**Example**:
```bash
# This is a comment
node_modules/        # Ignore node_modules directory
*.log                # Ignore all .log files
.env                 # Ignore .env file
```

### Pattern Syntax

**.gitignore uses glob patterns** (similar to shell wildcards):

| Pattern | Matches | Example |
|---------|---------|---------|
| `file.txt` | Exact file name | `config.txt` |
| `*.log` | All files ending in .log | `app.log`, `error.log` |
| `temp/` | Directory named temp | `temp/` (trailing slash) |
| `**/temp` | temp in any directory | `src/temp`, `api/temp` |
| `temp/**` | Everything inside temp/ | `temp/file.txt`, `temp/sub/file.txt` |
| `!important.log` | Exception (track this file) | Negates previous patterns |
| `*.log` then `!important.log` | All .log except important.log | Exceptions must come after patterns |

### Examples

**Ignore specific file**:
```bash
.env
```

**Ignore all files with extension**:
```bash
*.log
*.tmp
```

**Ignore directory**:
```bash
node_modules/
dist/
```

**Ignore files in any directory**:
```bash
**/*.log
```

**Exception (track despite pattern)**:
```bash
*.log              # Ignore all .log files
!important.log     # BUT track important.log
```

---

## Common Patterns

### Dependencies (Node.js / JavaScript)

```bash
# ============================================
# Dependencies
# ============================================
node_modules/
npm-debug.log
yarn-error.log
package-lock.json.bak
```

**Why**:
- `node_modules/` can contain 100K+ files (installed via `npm install`)
- npm/yarn logs are debugging artifacts
- Backup files (.bak) are temporary

### Environment Variables & Secrets

```bash
# ============================================
# Environment Variables & Secrets
# ============================================
.env
.env.local
.env.production
.env.*.local
*.key
*.pem
secrets/
```

**Why**:
- `.env` contains API keys, database passwords, secrets
- **CRITICAL**: Never commit secrets to git!
- Use `.env.example` (tracked) as template without secrets

### Build Outputs

```bash
# ============================================
# Build Outputs
# ============================================
dist/
build/
*.log
*.tsbuildinfo
.cache/
```

**Why**:
- Build outputs are generated from source code
- Different per developer environment
- Can be regenerated with `npm run build`
- Causes merge conflicts if tracked

### IDE & Editor Files

```bash
# ============================================
# IDE & Editors
# ============================================
.vscode/
.idea/
*.swp
*.swo
*~
.project
.settings/
```

**Why**:
- IDE settings are developer-specific
- VS Code users have `.vscode/`, IntelliJ users have `.idea/`
- Editor temp files (*.swp from vim, *~ from emacs)

### OS Files

```bash
# ============================================
# OS Files
# ============================================
.DS_Store        # macOS Finder metadata
Thumbs.db        # Windows thumbnail cache
Desktop.ini      # Windows folder settings
._*              # macOS resource forks
```

**Why**:
- Operating system creates these automatically
- No value in version control
- Pollute git history

### Testing & Coverage

```bash
# ============================================
# Testing & Coverage
# ============================================
coverage/
.nyc_output/
*.lcov
test-results/
junit.xml
```

**Why**:
- Test coverage reports are generated artifacts
- Test results are environment-specific
- Can be regenerated with `npm test`

### Docker

```bash
# ============================================
# Docker
# ============================================
*.pid
.docker-data/
docker-compose.override.yml
```

**Why**:
- `*.pid` are runtime process IDs
- `.docker-data/` is local volume data
- `docker-compose.override.yml` is local developer customization

---

## Organization Strategies

### Strategy 1: Flat List (Minimal)

**Good for**: Small projects, personal projects

```bash
node_modules/
.env
dist/
*.log
.DS_Store
```

**Pros**:
- Simple, quick to create
- Easy to scan

**Cons**:
- Hard to find patterns as project grows
- Unclear purpose of each pattern
- Difficult to maintain

### Strategy 2: Commented Sections (Better)

**Good for**: Medium projects, teams

```bash
# Dependencies
node_modules/

# Environment
.env

# Build outputs
dist/

# Logs
*.log

# OS files
.DS_Store
```

**Pros**:
- Clear purpose for each section
- Easier to find patterns
- More maintainable

**Cons**:
- Sections blend together

### Strategy 3: Organized Sections with Headers (Best)

**Good for**: Large projects, teams, production

```bash
# ============================================
# Dependencies
# ============================================
node_modules/
npm-debug.log

# ============================================
# Environment Variables & Secrets
# ============================================
.env
*.key

# ============================================
# Build Outputs
# ============================================
dist/
*.log
```

**Pros**:
- Visual separation with `====` headers
- Clear sections that stand out
- Professional appearance
- Scales well

**Cons**:
- Larger file (but worth it)

**Recommendation**: Use Strategy 3 for hackathon/production projects

---

## Security Best Practices

### Rule 1: Never Commit Secrets

**Examples of secrets**:
- API keys (Anthropic, OpenAI, AWS, Google Cloud)
- Database passwords
- Private keys (*.pem, *.key)
- OAuth tokens
- Encryption keys

**How to prevent**:

1. **Use .env files**:
```bash
# .env (IGNORED, contains secrets)
ANTHROPIC_API_KEY=sk-ant-api03-real-key-here
DATABASE_PASSWORD=supersecret123
```

2. **Create .env.example template** (TRACKED, no secrets):
```bash
# .env.example (tracked, template only)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
DATABASE_PASSWORD=your-database-password
```

3. **Add to .gitignore**:
```bash
.env              # Ignore secrets
.env.local
.env.production
```

4. **Verify**:
```bash
# Should be empty (good!)
git ls-files | grep ".env$"

# Should show .env.example (good!)
git ls-files | grep ".env.example"
```

### Rule 2: Use .gitignore Templates

**GitHub provides templates**: https://github.com/github/gitignore

**Examples**:
- Node.gitignore
- Python.gitignore
- Java.gitignore

**How to use**:
```bash
# Download Node.js template
curl https://raw.githubusercontent.com/github/gitignore/main/Node.gitignore -o .gitignore

# Customize for your project
# Add hackathon-specific patterns
```

### Rule 3: Check Before Committing

**Pre-commit checklist**:

```bash
# 1. Check what will be committed
git status

# 2. Look for sensitive patterns
git status | grep -E "(\.env|\.key|\.pem|password|secret)"

# 3. Verify .env is NOT in list
git ls-files | grep "^\.env$"    # Should be empty

# 4. If .env appears, STOP! Add to .gitignore
```

### Rule 4: If You Leak Secrets, Rotate Immediately

**If you accidentally commit .env**:

1. **STOP**: Don't push to remote (if not pushed yet)
2. **Rotate keys**: Change API keys, passwords immediately
3. **Remove from history**:
```bash
# Remove .env from last commit
git rm --cached .env
git commit --amend --no-edit

# If already pushed, must rewrite history (dangerous!)
# Better to just rotate keys
```

4. **Add to .gitignore** and recommit:
```bash
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to .gitignore"
```

---

## Troubleshooting

### Problem 1: File Ignored But Should Be Tracked

**Symptom**: `git add important-file.txt` says "The following paths are ignored"

**Cause**: Pattern in .gitignore matches file

**Solution 1**: Add exception
```bash
# .gitignore
*.txt              # Ignore all .txt files
!important.txt     # BUT track important.txt
```

**Solution 2**: Force add
```bash
git add -f important-file.txt
```

**Solution 3**: Remove pattern
```bash
# Edit .gitignore, remove *.txt pattern
```

### Problem 2: File Already Tracked, Now Want to Ignore

**Symptom**: Added `dist/` to .gitignore but still shows in `git status`

**Cause**: File was committed before .gitignore rule added

**Solution**: Remove from tracking (keeps local file)
```bash
# Remove from git tracking only
git rm -r --cached dist/

# Commit the removal
git commit -m "Stop tracking dist/ directory"

# Now dist/ is ignored
```

### Problem 3: .gitignore Not Working

**Symptom**: Added pattern to .gitignore, but files still showing in git status

**Debugging**:

```bash
# Test if file matches pattern
git check-ignore -v file.txt

# Shows which pattern (if any) matches:
# .gitignore:5:*.txt	file.txt
```

**Common causes**:
1. **File already tracked**: Use `git rm --cached` (see Problem 2)
2. **Wrong pattern**: Check syntax (trailing slash for directories)
3. **.gitignore not committed**: `git add .gitignore && git commit`
4. **Whitespace issues**: Pattern has trailing spaces

### Problem 4: Want Different .gitignore Per Branch

**Symptom**: Feature branch needs different ignore rules than main

**Solution**: Use `.git/info/exclude` for local-only rules

```bash
# Edit .git/info/exclude (not tracked by git)
vim .git/info/exclude

# Add local patterns
temp-feature-data/
```

**Why**: .gitignore is tracked (same for all developers), but .git/info/exclude is local-only

---

## Real-World Examples

### Example 1: Node.js + React + TypeScript Project

```bash
# Healthcare AI Hackathon Demo - .gitignore

# ============================================
# Dependencies
# ============================================
node_modules/

# ============================================
# Environment Variables
# ============================================
.env
.env.local

# ============================================
# Build Outputs
# ============================================
dist/
build/
*.tsbuildinfo

# Frontend build artifacts
frontend/dist/
frontend/.vite/

# Backend build artifacts
backend/dist/

# ============================================
# Testing
# ============================================
coverage/

# ============================================
# IDE
# ============================================
.vscode/
.idea/

# ============================================
# OS
# ============================================
.DS_Store
Thumbs.db

# ============================================
# Docker
# ============================================
docker-compose.override.yml
```

**Why This Works**:
- Organized by category (easy to find)
- Covers all common patterns (dependencies, env, builds, testing, IDE, OS, Docker)
- Includes project-specific paths (frontend/dist/, backend/dist/)
- 2,782 bytes of comprehensive coverage

### Example 2: Python + Django Project

```bash
# ============================================
# Python
# ============================================
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/

# ============================================
# Django
# ============================================
*.log
db.sqlite3
media/
staticfiles/

# ============================================
# Environment
# ============================================
.env
.env.local

# ============================================
# IDE
# ============================================
.vscode/
.idea/
*.swp
```

### Example 3: Minimal .gitignore (Quick Start)

**For hackathons, quick prototypes**:

```bash
# Minimal but effective .gitignore

# Dependencies
node_modules/

# Secrets
.env

# Build outputs
dist/
build/

# IDE & OS
.vscode/
.idea/
.DS_Store
Thumbs.db
```

**Good enough** for 80% of projects

---

## Best Practices Checklist

### .gitignore File

- [ ] File exists in project root (`.gitignore`)
- [ ] Organized into clear sections
- [ ] Ignores dependencies (node_modules/)
- [ ] Ignores secrets (.env, *.key)
- [ ] Ignores build outputs (dist/, build/)
- [ ] Ignores IDE files (.vscode/, .idea/)
- [ ] Ignores OS files (.DS_Store, Thumbs.db)
- [ ] Ignores test artifacts (coverage/, test-results/)
- [ ] .env.example is tracked (template without secrets)
- [ ] Comments explain non-obvious patterns

### Security

- [ ] .env is ignored (secrets not committed)
- [ ] Verified with: `git ls-files | grep "^\.env$"` (should be empty)
- [ ] API keys in .env.example are placeholders ("your-key-here")
- [ ] Pre-commit check: `git status` doesn't show .env
- [ ] Team knows: Never commit secrets

### Maintenance

- [ ] Add patterns when adding new tools
- [ ] Test patterns work: `git check-ignore -v filename`
- [ ] Update .env.example when adding variables
- [ ] Review quarterly for obsolete patterns

---

## Additional Resources

### Official Documentation
- **Git Documentation**: https://git-scm.com/docs/gitignore
- **GitHub .gitignore Templates**: https://github.com/github/gitignore

### Interactive Tools
- **gitignore.io**: https://www.toptal.com/developers/gitignore - Generate .gitignore for your stack

### Learning Resources
- **Pro Git Book** (free): https://git-scm.com/book/en/v2
- **GitHub Guides**: https://guides.github.com/introduction/git-handbook/

### Examples to Study
- **Node.js projects**: Express.js, React, Next.js (github.com)
- **This project**: Healthcare AI `.gitignore` - 28 sections, comprehensive

---

## Summary

### Key Takeaways

1. **.gitignore is critical** - Prevents 95% of common git problems
2. **Never commit secrets** - Use .env (ignored) + .env.example (tracked)
3. **Organize by category** - Use section headers for maintainability
4. **Common patterns**: node_modules/, .env, dist/, .vscode/, .DS_Store
5. **Check before commit** - `git status` should not show secrets/build outputs

### The .gitignore Trinity

**Must Ignore**:
- Dependencies (node_modules/)
- Secrets (.env, *.key)
- Build outputs (dist/, build/)

**Should Ignore**:
- IDE files (.vscode/, .idea/)
- OS files (.DS_Store, Thumbs.db)
- Test artifacts (coverage/, test-results/)

**Must Track**:
- Source code (*.ts, *.tsx, *.js)
- Configuration (package.json, tsconfig.json)
- Templates (.env.example)
- Documentation (README.md)

### Quick Reference

```bash
# Check what will be committed
git status

# Verify file is ignored
git check-ignore -v filename

# List tracked files
git ls-files

# Remove from tracking (keep local file)
git rm --cached filename

# Force add ignored file
git add -f filename
```

---

## Practice Exercise

**Challenge**: Create .gitignore for a new project

1. **Start with minimal template**:
```bash
node_modules/
.env
dist/
.vscode/
.DS_Store
```

2. **Add project-specific patterns**:
- What tools will you use? (Vite? Jest? Docker?)
- What build outputs? (dist/, .vite/, coverage/)
- What secrets? (.env.local, *.key)

3. **Organize into sections**:
- Group related patterns
- Add section headers
- Comment non-obvious patterns

4. **Test**:
```bash
# Create test files
touch .env dist/app.js .DS_Store

# Verify ignored
git status    # Should not show these files

# Verify .gitignore tracked
git ls-files | grep ".gitignore"    # Should show
```

**Bonus**: Use `gitignore.io` to generate comprehensive template for your stack

---

**Guide Complete** ✅
**Topic**: .gitignore Configuration and Git Best Practices
**Created**: 2025-11-08
**Level**: Beginner to Intermediate
