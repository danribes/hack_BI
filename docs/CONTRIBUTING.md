# Contributing to Healthcare AI Clinical Data Analyzer - Hackathon Demo

## Overview

This hackathon project follows a structured development workflow with comprehensive testing and documentation for every task. This guide helps you understand how to contribute effectively.

## Development Process

### For Each Task (H001-H037)

Every task follows this 6-step process:

1. **✅ Write implementation code**
2. **✅ Write test code**
3. **✅ Run tests and fix errors**
4. **✅ Create 3 log files** (Implementation, Test, Learn/Guide)
5. **✅ Update hackathon-tasks.md** with details
6. **✅ Mark task complete** with `[x]` checkbox

**DO NOT** skip any step. This ensures quality and maintainability.

## Log File Requirements

### File Naming Convention

All log files use the format: **Capital T + 3-digit number**

Examples:
- `T001_MonorepoSetup_Log.md`
- `T024_PatientData_Log.md`
- `T037_RiskIndicator_Guide.md`

### Three Required Logs Per Task

#### 1. Implementation Log (`log_files/TXXX_TaskName_Log.md`)

Documents implementation details, decisions, and challenges:

**Required Sections**:
- Overview (what was built)
- Implementation Steps (how it was built)
- Key Design Decisions (why choices were made)
- Files Created/Modified
- Challenges Encountered (problems and solutions)
- Testing Results (summary)
- Next Steps

**Example**: `log_files/T002_BackendInit_Log.md`

#### 2. Test Log (`log_tests/TXXX_TaskName_TestLog.md`)

Documents test cases, results, and coverage:

**Required Sections**:
- Test Execution Summary (pass/fail counts)
- Detailed Test Results (each test case)
- Performance Metrics (timing, resource usage)
- Test Coverage Analysis
- Issues Encountered (failures and fixes)
- Manual Testing Procedures (if applicable)
- Recommendations

**Example**: `log_tests/T003_FrontendInit_TestLog.md`

#### 3. Educational Guide (`log_learn/TXXX_TaskName_Guide.md`)

Educational resource explaining the technology:

**Required Sections**:
- Technology Overview
- Key Concepts Explained
- Best Practices
- Common Pitfalls
- Real-World Examples
- Additional Resources
- Glossary

**Example**: `log_learn/T005_DockerCompose_Guide.md`

## Test Requirements

### Test Script Structure

Each task needs a bash test script in `tests/TXXX_taskname_test.sh`:

```bash
#!/bin/bash

# TXXX: Task Description Test
# Brief description of what this test validates

PASSED=0
FAILED=0

echo "Running TXXX: Task Description Test"
echo "=========================================="

# Test 1: Check something exists
if [ -f "path/to/file" ]; then
  echo "✅ PASS: file exists"
  ((PASSED++))
else
  echo "❌ FAIL: file not found"
  ((FAILED++))
fi

# Test 2: Validate content
if grep -q "expected content" path/to/file; then
  echo "✅ PASS: content validated"
  ((PASSED++))
else
  echo "❌ FAIL: content missing"
  ((FAILED++))
fi

echo "=========================================="
echo "Test Results: Passed: $PASSED, Failed: $FAILED"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
  echo "✅ All tests passed!"
  exit 0
else
  echo "❌ Some tests failed!"
  exit 1
fi
```

### Minimum Test Coverage

- **File Existence**: Verify all created files exist
- **Content Validation**: Check key configuration values
- **Dependency Checks**: Ensure required packages installed
- **Build Validation**: TypeScript/build scripts succeed
- **Runtime Checks**: Services start without errors

**Target**: 100% pass rate before marking task complete

## Git Workflow

### Branch Strategy

This hackathon uses feature branches:

- **Main Branch**: Not used for this hackathon
- **Feature Branch**: `claude/download-taskmaster-repo-011CUu6maGwYy8jueRtK8LS6`

All commits go to the feature branch.

### Commit Message Format

Use descriptive commit messages that reference the task:

```
Complete H005: Docker Compose configuration for full-stack orchestration

- Created docker-compose.yml with postgres, backend, frontend services
- Added docker-compose.dev.yml for development hot reload
- Implemented health check dependencies (postgres → backend → frontend)
- Created infrastructure/postgres/init.sql initialization script
- All 22 tests passed (100% pass rate)
- Created 3 log files (T005_DockerCompose_Log/TestLog/Guide)
```

**Format**:
```
Complete HXXX: Brief task description

- Bullet points of what was implemented
- Test results
- Log files created
```

### When to Commit

Commit after **each complete task** (H001, H002, etc.), not after individual files.

A task is complete when:
1. ✅ All code implemented
2. ✅ All tests passing (100% pass rate)
3. ✅ All 3 log files created
4. ✅ hackathon-tasks.md updated
5. ✅ Task marked `[x]` complete

### Git Commands

```bash
# Check current status
git status

# Stage all changes for a completed task
git add .

# Commit with descriptive message
git commit -m "$(cat <<'EOF'
Complete H006: Create README and project documentation

- Updated README.md for hackathon demo focus
- Created CONTRIBUTING.md with development workflow
- Created .env.example template
- All tests passed
- Created 3 log files
EOF
)"

# Push to remote branch
git push -u origin claude/download-taskmaster-repo-011CUu6maGwYy8jueRtK8LS6
```

## Code Style Guidelines

### TypeScript

**Backend** (`backend/src/`):
- **Strict mode**: Always use TypeScript strict mode
- **Type everything**: No `any` types without justification
- **Error handling**: Use try-catch with proper error types
- **Async/await**: Prefer over promises/callbacks
- **Middleware order**: CORS → JSON → Logging → Routes → Error Handler

**Frontend** (`frontend/src/`):
- **Functional components**: Use function syntax, not class components
- **Hooks**: Use React hooks (useState, useEffect, custom hooks)
- **Type props**: Define interfaces for all component props
- **Error boundaries**: Wrap components in error boundaries

### File Organization

**Backend Structure**:
```
backend/src/
├── index.ts           # Server entry point
├── api/               # Route handlers
│   ├── patients.ts
│   └── analyze.ts
├── services/          # Business logic
│   ├── patient.service.ts
│   ├── ai.service.ts
│   └── db.service.ts
├── models/            # Database models
│   └── patient.model.ts
├── ai/                # AI integration
│   └── claude.client.ts
├── config/            # Configuration
│   └── database.ts
├── types/             # TypeScript types
│   └── patient.types.ts
└── middleware/        # Express middleware
    └── error.middleware.ts
```

**Frontend Structure**:
```
frontend/src/
├── main.tsx           # Entry point
├── App.tsx            # Root component
├── components/        # Reusable UI components
│   ├── RiskAnalysisButton.tsx
│   ├── RiskAssessmentDisplay.tsx
│   └── RiskIndicator.tsx
├── pages/             # Page components
│   └── PatientAnalysis.tsx
├── api/               # API client
│   └── api.client.ts
├── hooks/             # Custom React hooks
│   └── useRiskAnalysis.ts
├── services/          # Frontend services
│   └── patient.service.ts
└── types/             # TypeScript types
    └── risk.types.ts
```

### Naming Conventions

**Files**:
- Components: `PascalCase.tsx` (e.g., `RiskIndicator.tsx`)
- Services: `camelCase.service.ts` (e.g., `patient.service.ts`)
- Types: `camelCase.types.ts` (e.g., `risk.types.ts`)
- Tests: `camelCase.test.ts` (e.g., `patient.service.test.ts`)

**Variables**:
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
- Variables: `camelCase` (e.g., `patientData`)
- Types/Interfaces: `PascalCase` (e.g., `PatientData`)
- React Components: `PascalCase` (e.g., `RiskIndicator`)

## Docker Best Practices

### Dockerfile Guidelines

1. **Multi-stage builds**: Always use builder stage + production stage
2. **Alpine images**: Use Alpine Linux for minimal size
3. **Non-root users**: Create dedicated user (nodejs:1001)
4. **Layer caching**: Order commands from least to most frequently changed
5. **.dockerignore**: Exclude node_modules, .env, tests

### Docker Compose Guidelines

1. **Health checks**: Define health checks for all services
2. **Dependencies**: Use `depends_on` with `condition: service_healthy`
3. **Named volumes**: Use named volumes for persistence
4. **Custom networks**: Define custom network for isolation
5. **Environment variables**: Use `.env` file, never hardcode secrets

## Testing Strategy

### Unit Tests (Not Required for Hackathon)

For full production, would use:
- **Backend**: Jest with ts-jest
- **Frontend**: Vitest with @testing-library/react

### Integration Tests (Bash Scripts - Required)

Every task needs bash test scripts:
- File existence checks
- Content validation
- Configuration verification
- Build success validation

### Manual Testing

Document manual testing procedures in TestLog:
- Service startup verification
- API endpoint testing (curl commands)
- UI functionality testing
- Database connectivity

## Documentation Standards

### Code Comments

**When to comment**:
- Complex algorithms or business logic
- Non-obvious design decisions
- Workarounds for known issues
- Public API functions

**When NOT to comment**:
- Self-explanatory code
- Obvious TypeScript types
- Standard patterns (Express routes, React components)

**Format**:
```typescript
/**
 * Analyzes patient clinical data using Claude AI
 *
 * @param patientId - Unique patient identifier
 * @returns Risk assessment with score and recommendations
 * @throws Error if AI service unavailable
 */
async function analyzePatient(patientId: string): Promise<RiskAssessment> {
  // Implementation
}
```

### README Updates

Update README.md when:
- Adding new features
- Changing setup instructions
- Modifying tech stack
- Updating progress tracking

## Common Pitfalls to Avoid

### ❌ Don't Do This

1. **Skipping tests**: Never mark task complete without 100% test pass rate
2. **Missing log files**: All 3 log files required (Implementation, Test, Learn)
3. **Incomplete documentation**: Update hackathon-tasks.md with full details
4. **Committing secrets**: Never commit `.env` or API keys
5. **Skipping error handling**: Always use try-catch and error middleware

### ✅ Do This Instead

1. **Write tests first**: Test-driven development catches errors early
2. **Document as you go**: Write logs while implementation is fresh
3. **Update tasks.md**: Keep progress tracking current
4. **Use .env.example**: Template for environment variables
5. **Handle all errors**: Graceful degradation, not crashes

## Development Environment

### Recommended Setup

**IDE**: VS Code with extensions:
- ESLint
- Prettier
- TypeScript + JavaScript Language Features
- Tailwind CSS IntelliSense
- Docker
- GitLens

**Terminal**: Use iTerm2 or Windows Terminal for better Docker logs

### Environment Variables

Create `.env` in project root (copy from `.env.example`):

```bash
# Backend Configuration
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://healthcare_user:healthcare_pass@localhost:5432/healthcare_ai_db

# AI Service
ANTHROPIC_API_KEY=sk-ant-api03-...

# CORS
CORS_ORIGIN=http://localhost:8080,http://localhost:5173
```

**Never commit `.env`** - it's in `.gitignore`

## Getting Help

### Debugging Resources

1. **Implementation Logs**: Check `log_files/` for previous task details
2. **Test Logs**: Review `log_tests/` for common issues and solutions
3. **Learning Guides**: Consult `log_learn/` for technology explanations
4. **Task Plan**: See `.specify/memory/hackathon-tasks.md` for task details

### Common Issues

**Docker build fails**:
```bash
# Clear Docker cache
docker system prune -a
docker-compose build --no-cache
```

**TypeScript errors**:
```bash
# Rebuild TypeScript
cd backend && npm run build
cd frontend && npm run build
```

**Tests failing**:
```bash
# Check file paths are correct
# Verify grep patterns match actual content
# Ensure all dependencies installed
```

## Task Workflow Example

Here's a complete example of implementing task H024:

### 1. Implement Code

Create `backend/src/services/patient.service.ts`:
```typescript
export class PatientService {
  async getPatients() {
    // Implementation
  }
}
```

### 2. Write Tests

Create `tests/T024_patientdata_test.sh`:
```bash
#!/bin/bash
# T024: Mock Patient data service Test

# Test file exists
if [ -f "backend/src/services/patient.service.ts" ]; then
  echo "✅ PASS: patient service exists"
fi
```

### 3. Run Tests

```bash
bash tests/T024_patientdata_test.sh
# Verify 100% pass rate
```

### 4. Create Log Files

- `log_files/T024_PatientData_Log.md` - Implementation details
- `log_tests/T024_PatientData_TestLog.md` - Test results
- `log_learn/T024_PatientData_Guide.md` - Educational content

### 5. Update hackathon-tasks.md

Mark task complete with details:
```markdown
- [x] H024 Mock Patient data service (hardcoded patients)
  - **Implementation**: Created PatientService class with 5 mock patients
  - **Tests**: 10/10 tests passed (100% pass rate)
  - **Logs Created**:
    - T024_PatientData_Log.md
    - T024_PatientData_TestLog.md
    - T024_PatientData_Guide.md
  - **Completed**: 2025-11-08
```

### 6. Commit and Push

```bash
git add .
git commit -m "Complete H024: Mock Patient data service"
git push -u origin claude/download-taskmaster-repo-011CUu6maGwYy8jueRtK8LS6
```

## Review Checklist

Before marking any task complete, verify:

- [ ] All implementation code written and tested
- [ ] Test script created in `tests/TXXX_*.sh`
- [ ] All tests passing (100% pass rate)
- [ ] Implementation log created in `log_files/`
- [ ] Test log created in `log_tests/`
- [ ] Learning guide created in `log_learn/`
- [ ] `hackathon-tasks.md` updated with full details
- [ ] Task checkbox marked `[x]` complete
- [ ] Changes committed with descriptive message
- [ ] Changes pushed to remote branch

## Questions?

Review completed tasks (H001-H005) as examples:
- See `log_files/` for implementation examples
- See `log_tests/` for test coverage examples
- See `log_learn/` for documentation examples

---

**Remember**: Quality over speed. A well-tested, well-documented task is better than rushing through multiple tasks with errors.
