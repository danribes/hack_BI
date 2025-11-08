# T004: Docker & Dockerfiles - Learn & Guide

**Guide Type**: Container Technology Fundamentals
**Technology Stack**: Docker + Multi-stage Builds + Alpine Linux
**Skill Level**: Intermediate
**Estimated Reading Time**: 30 minutes
**Last Updated**: 2025-11-08

---

## Table of Contents

1. [Introduction to Docker](#introduction-to-docker)
2. [Docker vs Virtual Machines](#docker-vs-virtual-machines)
3. [Dockerfile Fundamentals](#dockerfile-fundamentals)
4. [Multi-Stage Builds](#multi-stage-builds)
5. [Alpine Linux Benefits](#alpine-linux-benefits)
6. [Security Best Practices](#security-best-practices)
7. [Optimization Techniques](#optimization-techniques)
8. [Health Checks](#health-checks)
9. [Signal Handling (dumb-init)](#signal-handling-dumb-init)
10. [Nginx for Frontend](#nginx-for-frontend)
11. [Dockerignore Files](#dockerignore-files)
12. [Common Pitfalls](#common-pitfalls)
13. [Production Deployment](#production-deployment)
14. [Docker Compose Preview](#docker-compose-preview)
15. [Further Learning](#further-learning)

---

## Introduction to Docker

### What is Docker?

Docker is a platform for developing, shipping, and running applications in **containers**. Containers package your application code together with all its dependencies, libraries, and configuration files into a single unit that runs consistently across different environments.

**The Problem Docker Solves**:
```
Developer's Machine:  ✅ "Works on my machine!"
QA Environment:       ❌ Different Node version, breaks
Production Server:    ❌ Missing dependencies, crashes
```

**With Docker**:
```
Developer's Machine:  ✅ Container runs
QA Environment:       ✅ Same container runs
Production Server:    ✅ Same container runs
```

###Key Concepts

**Image**: Blueprint/Template
- Read-only template with your application and dependencies
- Built from a Dockerfile
- Stored in registries (Docker Hub, etc.)

**Container**: Running Instance
- Running instance of an image
- Lightweight, isolated environment
- Can create many containers from one image

**Analogy**:
- Image = Class definition (code)
- Container = Object instance (running program)

### Docker Architecture

```
┌──────────────────────────────────────┐
│        Docker Client (CLI)            │
│          docker build                 │
│          docker run                   │
└──────────────┬───────────────────────┘
               │ REST API
┌──────────────▼───────────────────────┐
│        Docker Daemon (Engine)         │
│  ┌────────────────────────────────┐  │
│  │    Container 1  Container 2    │  │
│  │    (isolated)   (isolated)     │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │         Images                  │  │
│  └────────────────────────────────┘  │
└───────────────────────────────────────┘
               │
┌──────────────▼───────────────────────┐
│          Host Operating System        │
└───────────────────────────────────────┘
```

---

## Docker vs Virtual Machines

### Virtual Machines (Old Way)

```
┌──────────────────────────────────────┐
│  App A    │  App B    │  App C       │
│  Bins/Libs│  Bins/Libs│  Bins/Libs   │
├───────────┼───────────┼──────────────┤
│  Guest OS │  Guest OS │  Guest OS    │  ← Heavy!
│  (Linux)  │  (Linux)  │  (Ubuntu)    │
├───────────┴───────────┴──────────────┤
│         Hypervisor (VMware)          │
├──────────────────────────────────────┤
│       Host Operating System          │
├──────────────────────────────────────┤
│           Hardware                   │
└──────────────────────────────────────┘

Size: ~10GB per VM
Boot: 30-60 seconds
```

### Docker Containers (New Way)

```
┌──────────────────────────────────────┐
│  App A    │  App B    │  App C       │
│  Bins/Libs│  Bins/Libs│  Bins/Libs   │
├───────────┴───────────┴──────────────┤
│         Docker Engine                │  ← Lightweight!
├──────────────────────────────────────┤
│       Host Operating System          │
├──────────────────────────────────────┤
│           Hardware                   │
└──────────────────────────────────────┘

Size: ~100MB per container
Boot: <1 second
```

### Key Differences

| Feature | Virtual Machines | Docker Containers |
|---------|-----------------|-------------------|
| Isolation | Full OS | Process-level |
| Size | GB | MB |
| Boot Time | Minutes | Seconds |
| Resource Usage | Heavy | Light |
| Portability | Low | High |
| Best For | Full OS isolation | Microservices |

---

## Dockerfile Fundamentals

### What is a Dockerfile?

A text file with instructions for building a Docker image. Think of it as a recipe.

### Basic Structure

```dockerfile
# 1. Base Image
FROM node:20-alpine

# 2. Working Directory
WORKDIR /app

# 3. Copy Files
COPY package*.json ./

# 4. Run Commands
RUN npm install

# 5. Copy Application
COPY . .

# 6. Expose Ports
EXPOSE 3000

# 7. Start Application
CMD ["node", "index.js"]
```

### Essential Directives

#### FROM - Base Image

```dockerfile
FROM node:20-alpine
```

**Purpose**: Every Dockerfile starts with FROM
**What it does**: Downloads the base image
**Best Practices**:
- Use specific versions (not `latest`)
- Use Alpine variants for smaller images
- Use official images when possible

```dockerfile
# ❌ BAD - Unpredictable
FROM node

# ❌ BAD - Still unpredictable
FROM node:latest

# ✅ GOOD - Specific version
FROM node:20

# ✅ BETTER - Smaller image
FROM node:20-alpine
```

#### WORKDIR - Set Working Directory

```dockerfile
WORKDIR /app
```

**Purpose**: Sets the directory for subsequent commands
**What it does**: Creates directory if it doesn't exist, then cd into it

**Why use it**:
```dockerfile
# ❌ Without WORKDIR
COPY . /app
RUN cd /app && npm install
RUN cd /app && npm build

# ✅ With WORKDIR
WORKDIR /app
COPY . .
RUN npm install
RUN npm build
```

#### COPY - Copy Files

```dockerfile
COPY package*.json ./
COPY . .
```

**Purpose**: Copy files from host to container
**Syntax**: `COPY <source> <destination>`

**Best Practice**: Copy package.json first for better caching
```dockerfile
# ✅ GOOD - Leverages cache
COPY package*.json ./
RUN npm install          # Only re-runs if package.json changes
COPY . .                 # Source code changes don't trigger npm install

# ❌ BAD - Always re-installs
COPY . .
RUN npm install          # Re-runs every time ANY file changes
```

#### RUN - Execute Commands

```dockerfile
RUN npm install
RUN npm run build
```

**Purpose**: Execute commands during image build
**Creates**: New layer in the image

**Optimization**: Chain commands to reduce layers
```dockerfile
# ❌ BAD - 3 layers
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# ✅ GOOD - 1 layer
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*
```

#### EXPOSE - Document Ports

```dockerfile
EXPOSE 3000
```

**Purpose**: Documents which port the container listens on
**NOTE**: Doesn't actually publish the port (use `-p` flag with `docker run`)

#### CMD - Default Command

```dockerfile
CMD ["node", "index.js"]
```

**Purpose**: Default command to run when container starts
**Can be overridden** when starting container

**Exec Form vs Shell Form**:
```dockerfile
# ✅ GOOD - Exec form (preferred)
CMD ["node", "index.js"]

# ❌ BAD - Shell form (wraps in /bin/sh -c)
CMD node index.js
```

**Why Exec form is better**:
- Direct execution (no shell wrapper)
- Proper signal handling
- Faster startup

#### USER - Set User

```dockerfile
RUN addgroup -g 1001 nodejs && adduser -u 1001 nodejs
USER nodejs
```

**Purpose**: Run container as non-root user
**Security**: Critical for production deployments

---

## Multi-Stage Builds

### The Problem

```dockerfile
# Single-stage build
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install          # Installs ALL dependencies
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]
```

**Issues**:
- ❌ Final image includes devDependencies (TypeScript, etc.)
- ❌ Final image includes source TypeScript files
- ❌ Final image includes build tools
- ❌ Result: 500MB+ image with lots of unnecessary files

### The Solution: Multi-Stage

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build        # Compiles TypeScript → JavaScript

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production  # Only production deps
COPY --from=builder /app/dist ./dist  # Copy built files
CMD ["node", "dist/index.js"]
```

**Benefits**:
- ✅ Builder stage: ~500MB (with all build tools)
- ✅ Final image: ~150MB (only runtime + built code)
- ✅ 70% size reduction!

### How It Works

```
Stage 1: Builder
  ↓ Install all dependencies (dev + production)
  ↓ Build TypeScript → JavaScript
  ↓ Result: dist/ directory

Stage 2: Production
  ↓ Fresh start from base image
  ↓ Install only production dependencies
  ↓ Copy built code from Stage 1
  ↓ Result: Clean, minimal image
```

### COPY --from=builder

```dockerfile
COPY --from=builder /app/dist ./dist
```

**Purpose**: Copy files from previous stage
**What it does**: Extracts files from builder stage without including all the baggage

**Analogy**:
- Builder stage = Factory (messy, lots of tools)
- Production stage = Store (clean, only finished products)
- COPY --from = Taking products from factory to store

---

## Alpine Linux Benefits

### What is Alpine?

Ultra-minimal Linux distribution designed for containers.

### Size Comparison

```
ubuntu:22.04         80 MB
debian:bookworm     120 MB
node:20             900 MB
node:20-alpine        5 MB  ← Tiny!
```

### Our Images

```
Backend:
- node:20            ~900 MB
- node:20-alpine     ~150 MB (with app)
- Savings: 750 MB

Frontend:
- nginx:1.25         ~150 MB
- nginx:1.25-alpine   ~25 MB (with app)
- Savings: 125 MB
```

### Benefits

1. **Smaller Images**:
   - Faster downloads
   - Faster deploys
   - Less disk space
   - Lower bandwidth costs

2. **Security**:
   - Fewer packages = smaller attack surface
   - Fewer vulnerabilities
   - Easier to audit

3. **Performance**:
   - Faster container starts
   - Less memory usage
   - More containers per host

### Trade-offs

**Pros**:
- ✅ Tiny size (~5MB base)
- ✅ Security-focused
- ✅ Fast

**Cons**:
- ❌ Uses musl libc (not glibc)
- ❌ Some packages need compilation
- ❌ Slightly different from Ubuntu/Debian

**For our stack** (Node.js, TypeScript, React):
- ✅ No issues
- ✅ All works perfectly
- ✅ Alpine is perfect choice

---

## Security Best Practices

### 1. Non-Root Users

**Problem**:
```dockerfile
# Container runs as root by default
FROM node:20-alpine
CMD ["node", "index.js"]  # Runs as root (UID 0)
```

**Risk**: If container is compromised, attacker has root access

**Solution**:
```dockerfile
FROM node:20-alpine
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs
USER nodejs  # All subsequent commands run as nodejs user
CMD ["node", "index.js"]  # Runs as nodejs (UID 1001)
```

**Benefits**:
- ✅ Limited permissions
- ✅ Can't modify system files
- ✅ Follows principle of least privilege

### 2. No Secrets in Images

**Problem**:
```dockerfile
# ❌ NEVER DO THIS
COPY .env .
# Secret is now in image layer FOREVER
# Even if you RUN rm .env later!
```

**Why it's bad**:
- Every layer is saved in image
- Anyone with image can extract secrets
- `docker history` shows all layers
- Can't be removed without rebuilding

**Solution**:
```dockerfile
# 1. Add .env to .dockerignore
echo ".env" >> .dockerignore

# 2. Pass secrets at runtime
docker run -e DB_PASSWORD=secret myimage

# 3. Or use Docker secrets (Swarm)
docker secret create db_password password.txt
```

### 3. Minimal Base Images

**Principle**: Only include what you need

```dockerfile
# ❌ BAD - Includes GUI, hundreds of packages
FROM ubuntu:22.04

# ✅ GOOD - Minimal, only essentials
FROM node:20-alpine
```

**Why**:
- Fewer packages = fewer vulnerabilities
- Smaller attack surface
- Less to audit

### 4. Scan for Vulnerabilities

```bash
# Use Trivy to scan images
trivy image myapp:latest

# Shows CVEs and severity
CRITICAL: 3
HIGH: 7
MEDIUM: 12
```

### 5. Don't Use latest Tag

```dockerfile
# ❌ BAD - Unpredictable
FROM node:latest

# ✅ GOOD - Specific version
FROM node:20.11.0-alpine3.19
```

**Why**:
- Reproducible builds
- Know exactly what's in image
- Prevent surprise breaking changes

---

## Optimization Techniques

### 1. Layer Caching

Docker caches each layer. If nothing changed, reuses cache.

```dockerfile
# ✅ OPTIMIZED - Dependencies cached
COPY package*.json ./
RUN npm ci              # Cached if package.json unchanged
COPY . .                # Source code changes don't invalidate cache
RUN npm run build       # Only rebuilds if code changed
```

**Impact**:
- First build: 60 seconds
- Rebuild (no dependency changes): 5 seconds
- 12x faster!

### 2. Order Matters

```dockerfile
# ❌ BAD - Always re-installs
COPY . .
RUN npm install

# ✅ GOOD - Caches npm install
COPY package*.json ./
RUN npm install
COPY . .
```

**Rule**: Order from least to most frequently changing

1. Base image (rarely changes)
2. System packages (rarely change)
3. Dependencies (sometimes change)
4. Source code (changes often)

### 3. Combine RUN Commands

```dockerfile
# ❌ BAD - Many layers
RUN npm install
RUN npm run build
RUN npm prune --production

# ✅ GOOD - One layer
RUN npm install && \
    npm run build && \
    npm prune --production
```

**Why**: Fewer layers = smaller image

### 4. Clean Up in Same Layer

```dockerfile
# ❌ BAD - Cache still in layer
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*  # Doesn't reduce image size!

# ✅ GOOD - Clean up in same layer
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*  # Reduces image size
```

### 5. Use .dockerignore

```
node_modules
.git
*.log
.env
```

**Benefits**:
- Faster builds (smaller context)
- Smaller images
- No secrets accidentally included

**Size Impact**:
- Without: 200MB context
- With: 50KB context
- 4000x smaller!

---

## Health Checks

### What are Health Checks?

Docker periodically runs a command to check if container is healthy.

### Syntax

```dockerfile
HEALTHCHECK --interval=30s \
            --timeout=3s \
            --start-period=5s \
            --retries=3 \
  CMD command to check health
```

**Parameters**:
- `interval`: How often to check (default: 30s)
- `timeout`: How long to wait for response (default: 30s)
- `start-period`: Grace period for startup (default: 0s)
- `retries`: Failures needed to mark unhealthy (default: 3)

### Backend Example

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

**What it does**:
1. Makes HTTP GET to /health endpoint
2. If returns 200: exit 0 (healthy)
3. If error: exit 1 (unhealthy)
4. Runs every 30 seconds
5. After 3 failures: marked unhealthy

### Frontend Example

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1
```

**What it does**:
- Uses wget to check if nginx is serving
- `--spider`: Don't download, just check
- Exit 0 if success, 1 if failure

### Why Health Checks Matter

**Without health check**:
```
Container crashes
  → Docker doesn't know
  → Keeps sending traffic
  → Users get errors
```

**With health check**:
```
Container crashes
  → Health check fails
  → Docker marks unhealthy
  → Orchestrator restarts container
  → Traffic redirected to healthy containers
```

### Monitoring

```bash
# Check health status
docker ps
# Shows "healthy" or "unhealthy" in STATUS

# Inspect health
docker inspect --format='{{.State.Health.Status}}' container_id
```

---

## Signal Handling (dumb-init)

### The PID 1 Problem

In Docker containers, your app runs as PID 1 (first process). PID 1 has special responsibilities in Unix:

1. Reap zombie processes
2. Forward signals to children
3. Handle shutdown gracefully

**Problem**: Node.js doesn't handle PID 1 responsibilities well.

### Without dumb-init

```dockerfile
CMD ["node", "index.js"]  # Node is PID 1
```

**What happens on `docker stop`**:
```
Docker sends SIGTERM to PID 1 (node)
  → Node might not forward to children
  → Children keep running
  → After 10 seconds, Docker sends SIGKILL
  → Ungraceful shutdown
  → Potential data loss
```

### With dumb-init

```dockerfile
RUN apk add --no-cache dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]  # dumb-init is PID 1, node is child
```

**What happens on `docker stop`**:
```
Docker sends SIGTERM to PID 1 (dumb-init)
  → dumb-init forwards SIGTERM to node
  → Node receives signal properly
  → Node closes connections gracefully
  → Node exits cleanly
  → No SIGKILL needed
```

### Benefits

1. **Graceful Shutdown**:
   - Finish processing current requests
   - Close database connections
   - Save state
   - Clean exit

2. **Zombie Reaping**:
   - Cleans up terminated child processes
   - Prevents resource leaks

3. **Proper Signal Forwarding**:
   - Ensures all processes receive signals
   - Critical for containers

---

## Nginx for Frontend

### Why Nginx Instead of Node?

**Node.js for serving static files**:
```javascript
// ❌ Using Node.js
import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'

const app = express()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(express.static(path.join(__dirname, 'dist')))
app.listen(8080)
```

**Problems**:
- Slow for static files
- High memory usage (~50MB+)
- Can handle ~100 concurrent connections
- Overkill for serving files

**Nginx**:
- Built specifically for static files
- Low memory usage (~10MB)
- Can handle 10,000+ concurrent connections
- Much smaller image (25MB vs 150MB)

### Performance Comparison

```
Serving 1000 requests for static files:

Node.js:
- Time: 5 seconds
- Memory: 50MB
- CPU: 60%

Nginx:
- Time: 0.5 seconds
- Memory: 10MB
- CPU: 10%
```

**10x better performance!**

### SPA Routing

React Router (and other SPAs) need special nginx config:

**Problem without configuration**:
```
User navigates to /about
  → Browser requests /about from server
  → Nginx looks for /about file
  → File doesn't exist
  → Returns 404
  → ❌ Broken app
```

**Solution with try_files**:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**How it works**:
```
User navigates to /about
  → Nginx tries /about (doesn't exist)
  → Nginx tries /about/ (doesn't exist)
  → Nginx serves /index.html
  → React app loads
  → React Router handles /about
  → ✅ Correct page displayed
```

### Gzip Compression

```nginx
gzip on;
gzip_types text/plain text/css application/javascript application/json;
```

**Benefits**:
- 60-80% size reduction for text files
- Faster page loads
- Lower bandwidth costs

**Example**:
- Uncompressed: 403 KB
- Gzipped: 119 KB
- Savings: 70%!

---

## Dockerignore Files

### What is .dockerignore?

Like .gitignore, but for Docker. Tells Docker which files to exclude from build context.

### Why It Matters

**Build Context**: All files Docker needs to build image

**Without .dockerignore**:
```
Sending build context: 200.5 MB  ← Huge!
Build time: 45 seconds
```

**With .dockerignore**:
```
Sending build context: 50.2 KB  ← Tiny!
Build time: 3 seconds
```

**4000x smaller context, 15x faster build!**

### Essential Patterns

```
# Dependencies (installed in container)
node_modules
npm-debug.log

# Build output (built in container)
dist
build

# Git
.git
.gitignore

# Environment files (secrets!)
.env
.env.local
.env.*.local

# IDE
.vscode
.idea

# Tests (not needed in production)
*.test.ts
*.spec.ts
__tests__
coverage

# Logs
*.log
logs

# OS
.DS_Store
Thumbs.db
```

### Security Benefit

```dockerfile
# Even if you don't have .dockerignore:
COPY . .  # ❌ Accidentally copies .env!

# Docker image now contains secrets
# Can't be removed (in layer history)
# Security breach!
```

**With .dockerignore**:
```
.env
```
→ `.env` never sent to Docker
→ Can't accidentally be included
→ ✅ Safe!

---

## Common Pitfalls

### 1. Using latest Tag

```dockerfile
# ❌ BAD
FROM node:latest

# ✅ GOOD
FROM node:20.11.0-alpine3.19
```

**Why**: "latest" changes over time, making builds unpredictable.

### 2. Running as Root

```dockerfile
# ❌ BAD - Security risk
CMD ["node", "index.js"]

# ✅ GOOD - Non-root user
USER nodejs
CMD ["node", "index.js"]
```

### 3. Secrets in Image

```dockerfile
# ❌ NEVER DO THIS
COPY .env .
```

**Even if you delete later**:
```dockerfile
COPY .env .
RUN use-env-file
RUN rm .env  # ❌ Secret still in previous layer!
```

### 4. Not Using .dockerignore

Leads to:
- Slow builds (huge contexts)
- Accidental secret inclusion
- Wasted bandwidth

### 5. Too Many Layers

```dockerfile
# ❌ BAD - 10 layers
RUN apt-get update
RUN apt-get install curl
RUN apt-get install git
...

# ✅ GOOD - 1 layer
RUN apt-get update && \
    apt-get install -y curl git ... && \
    rm -rf /var/lib/apt/lists/*
```

---

## Production Deployment

### 1. Build Images

```bash
# Backend
docker build -t myapp-backend:v1.0.0 ./backend

# Frontend
docker build -t myapp-frontend:v1.0.0 ./frontend
```

### 2. Push to Registry

```bash
# Tag for registry
docker tag myapp-backend:v1.0.0 myregistry.com/myapp-backend:v1.0.0

# Push
docker push myregistry.com/myapp-backend:v1.0.0
```

### 3. Deploy

**Docker Compose** (single host):
```yaml
version: '3.8'
services:
  backend:
    image: myregistry.com/myapp-backend:v1.0.0
  frontend:
    image: myregistry.com/myapp-frontend:v1.0.0
```

**Kubernetes** (multi-host):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: backend
        image: myregistry.com/myapp-backend:v1.0.0
```

---

## Docker Compose Preview

Next task (H005) will create Docker Compose configuration:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://postgres:5432/db

  frontend:
    build: ./frontend
    ports:
      - "8080:8080"
    depends_on:
      - backend

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

**Benefits**:
- One command starts entire stack
- Automatic networking
- Manages dependencies
- Perfect for development

---

## Further Learning

### Official Documentation
- **Docker Docs**: https://docs.docker.com
- **Dockerfile Reference**: https://docs.docker.com/reference/dockerfile/
- **Best Practices**: https://docs.docker.com/develop/dev-best-practices/

### Books
- *Docker Deep Dive* by Nigel Poulton
- *Docker in Action* by Jeff Nickoloff

### Practice
- Docker Playground: https://labs.play-with-docker.com
- Practice building images
- Experiment with multi-stage builds
- Try different base images

---

## Summary

You've learned how to create production-ready Dockerfiles with:

✅ **Multi-stage builds** - 70-95% size reduction
✅ **Alpine Linux** - Minimal base images
✅ **Security** - Non-root users, no secrets
✅ **Optimization** - Layer caching, .dockerignore
✅ **Health checks** - Automatic monitoring
✅ **Signal handling** - Graceful shutdowns
✅ **Nginx** - High-performance serving

**Key Takeaways**:
1. Multi-stage builds dramatically reduce image size
2. Alpine Linux provides minimal, secure base images
3. Never run containers as root
4. Never include secrets in images
5. Use .dockerignore to speed up builds
6. Health checks enable automatic monitoring
7. Nginx is best for serving static files

Now you can build optimized, secure Docker images for production! 🚀

---

**Last Updated**: 2025-11-08
**Version**: 1.0.0
**Author**: Healthcare AI Team
**Related Docs**: T004_DockerFiles_Log.md, T004_DockerFiles_TestLog.md
