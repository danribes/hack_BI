# T005: Docker Compose - Learn & Guide

**Guide Type**: Container Orchestration Fundamentals
**Technology Stack**: Docker Compose 3.8
**Skill Level**: Intermediate
**Estimated Reading Time**: 25 minutes
**Last Updated**: 2025-11-08

---

## Table of Contents

1. [Introduction to Docker Compose](#introduction-to-docker-compose)
2. [Why Docker Compose](#why-docker-compose)
3. [Docker Compose File Structure](#docker-compose-file-structure)
4. [Services Configuration](#services-configuration)
5. [Volumes and Data Persistence](#volumes-and-data-persistence)
6. [Networks and Service Discovery](#networks-and-service-discovery)
7. [Service Dependencies](#service-dependencies)
8. [Health Checks](#health-checks)
9. [Environment Variables](#environment-variables)
10. [Development vs Production](#development-vs-production)
11. [Common Commands](#common-commands)
12. [Troubleshooting](#troubleshooting)
13. [Best Practices](#best-practices)
14. [Further Learning](#further-learning)

---

## Introduction to Docker Compose

### What is Docker Compose?

Docker Compose is a tool for defining and running multi-container Docker applications. With Compose, you use a YAML file to configure your application's services, networks, and volumes. Then, with a single command, you create and start all services.

**The Problem Without Compose**:
```bash
# Start database
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=pass \
  -v postgres-data:/var/lib/postgresql/data \
  postgres:16-alpine

# Start backend (needs to wait for database)
docker run -d --name backend \
  --link postgres:postgres \
  -e DATABASE_URL=postgresql://postgres:5432/db \
  -p 3000:3000 \
  backend:latest

# Start frontend (needs to wait for backend)
docker run -d --name frontend \
  --link backend:backend \
  -p 8080:8080 \
  frontend:latest
```

**Problems**:
- ❌ Complex commands to remember
- ❌ Manual service ordering
- ❌ No automatic health checking
- ❌ Hard to reproduce across environments
- ❌ Difficult to manage as team

**With Docker Compose**:
```bash
# Single command starts everything
docker-compose up
```

**Benefits**:
- ✅ Simple, declarative configuration
- ✅ Automatic service dependencies
- ✅ Built-in health checking
- ✅ Reproducible across environments
- ✅ Version controlled (YAML file in git)

---

## Why Docker Compose

### Use Cases

**Perfect For**:
1. **Development Environments**
   - Start entire stack with one command
   - Easy onboarding for new developers
   - Consistent environments across team

2. **Testing**
   - Spin up isolated test environments
   - Integration testing with real services
   - Tear down after tests complete

3. **Single-Host Deployments**
   - Small applications
   - Staging environments
   - Demo/prototype deployments

**Not Ideal For**:
1. **Production at Scale**
   - Use Kubernetes for multi-host orchestration
   - Use Docker Swarm for simpler multi-host
   - Compose is single-host only

2. **Complex Orchestration**
   - Advanced networking requirements
   - Auto-scaling
   - Rolling updates with zero downtime

### Docker Compose vs Alternatives

| Feature | Docker Compose | Kubernetes | Docker Swarm |
|---------|---------------|------------|--------------|
| Learning Curve | Easy | Hard | Medium |
| Setup | Simple | Complex | Medium |
| Multi-host | No | Yes | Yes |
| Auto-scaling | No | Yes | Limited |
| Best For | Dev/Test | Production | Small prod |

---

## Docker Compose File Structure

### Basic Structure

```yaml
version: '3.8'  # Compose file format version

services:       # Define containers
  service1:
    # Service configuration
  service2:
    # Service configuration

volumes:        # Define named volumes
  volume1:
    # Volume configuration

networks:       # Define networks
  network1:
    # Network configuration
```

### Our Healthcare AI Application

```yaml
version: '3.8'

services:
  postgres:     # Database service
    image: postgres:16-alpine
    # ...

  backend:      # API service
    build: ./backend
    depends_on:
      postgres:
        condition: service_healthy
    # ...

  frontend:     # Web UI service
    build: ./frontend
    depends_on:
      backend:
        condition: service_healthy
    # ...

volumes:
  postgres-data:  # Database persistence

networks:
  healthcare-network:  # Isolated network
```

---

## Services Configuration

### Defining a Service

```yaml
services:
  postgres:
    image: postgres:16-alpine  # Use existing image
    container_name: healthcare-postgres  # Custom container name
    restart: unless-stopped  # Restart policy
    environment:  # Environment variables
      POSTGRES_DB: healthcare_ai_db
      POSTGRES_USER: healthcare_user
      POSTGRES_PASSWORD: healthcare_pass
    volumes:  # Volume mounts
      - postgres-data:/var/lib/postgresql/data
    ports:  # Port mappings
      - "5432:5432"
    networks:  # Network connections
      - healthcare-network
```

### Image vs Build

**Option 1: Use Existing Image**
```yaml
postgres:
  image: postgres:16-alpine  # Pull from Docker Hub
```

**Option 2: Build from Dockerfile**
```yaml
backend:
  build:
    context: ./backend  # Directory with Dockerfile
    dockerfile: Dockerfile  # Dockerfile name (optional)
```

**Option 3: Build with Arguments**
```yaml
backend:
  build:
    context: ./backend
    args:
      NODE_VERSION: 20  # Build-time variable
```

### Restart Policies

```yaml
restart: "no"              # Never restart (default)
restart: always            # Always restart
restart: on-failure        # Restart on error
restart: unless-stopped    # Restart unless manually stopped
```

**Our Choice**: `unless-stopped`
- Restarts after crashes
- Restarts after host reboot
- Doesn't restart if explicitly stopped

---

## Volumes and Data Persistence

### The Problem

```
Container starts → Creates data
Container stops  → Data LOST ❌
```

### The Solution: Volumes

```
Container starts → Uses volume
Container stops  → Data PERSISTS ✅
New container    → Uses same data ✅
```

### Volume Types

#### 1. Named Volumes (Recommended)

```yaml
services:
  postgres:
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
    driver: local
```

**Benefits**:
- ✅ Docker manages lifecycle
- ✅ Portable across systems
- ✅ Better performance
- ✅ Easy to backup (`docker volume ls`)

#### 2. Bind Mounts

```yaml
services:
  backend:
    volumes:
      - ./backend/src:/app/src  # Host path:Container path
```

**Benefits**:
- ✅ Edit files on host, changes in container
- ✅ Perfect for development
- ✅ Source code hot reload

**Drawbacks**:
- ❌ OS-specific paths
- ❌ Permission issues
- ❌ Not portable

#### 3. Anonymous Volumes

```yaml
services:
  backend:
    volumes:
      - /app/node_modules  # No host path
```

**Purpose**: Prevent host mount from overwriting container directory

**Example**:
```yaml
backend:
  volumes:
    - ./backend/src:/app/src  # Mount source code
    - /app/node_modules        # Preserve node_modules in container
```

**Why Needed**: Without anonymous volume, host `./backend/src` would overwrite container's `/app`, deleting `node_modules` installed in Dockerfile.

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect healthcare-postgres-data

# Backup volume
docker run --rm -v healthcare-postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data

# Restore volume
docker run --rm -v healthcare-postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres-backup.tar.gz -C /

# Remove volume (⚠️ destroys data!)
docker volume rm healthcare-postgres-data
```

---

## Networks and Service Discovery

### Why Custom Networks?

**Default Behavior**:
```
All containers on default bridge network
  → Can communicate with IPs
  → No automatic DNS
  → Exposed to all containers
```

**Custom Network**:
```
Create isolated network
  → Services discover each other by name
  → DNS resolution automatic
  → Isolated from other apps
```

### Service Discovery

```yaml
networks:
  healthcare-network:
    driver: bridge
```

**With this network, services can communicate by name**:

```javascript
// Backend connecting to postgres
const DATABASE_URL = 'postgresql://postgres:5432/db'
                    // ^^^^^^^^ service name, auto-resolves to IP
```

**How it works**:
```
Backend tries to connect to "postgres"
  → Docker DNS resolves to postgres container IP
  → Connection established
  → No hardcoded IPs needed!
```

### Network Drivers

```yaml
networks:
  # Bridge network (default, single host)
  app-network:
    driver: bridge

  # Host network (use host's network stack)
  host-network:
    driver: host

  # Overlay network (multi-host with Swarm)
  swarm-network:
    driver: overlay
```

**Our Choice**: Bridge
- Perfect for single-host
- Isolated from other containers
- Automatic service discovery

---

## Service Dependencies

### Basic Dependencies

```yaml
backend:
  depends_on:
    - postgres  # Start postgres before backend
```

**Problem**: Container starts, NOT necessarily ready!

```
postgres container starts (PID 1)
  → depends_on satisfied
  → backend starts immediately
  → postgres still initializing
  → backend connection fails ❌
```

### Health Check Dependencies (Better!)

```yaml
postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U user -d db"]
    interval: 10s
    timeout: 5s
    retries: 5

backend:
  depends_on:
    postgres:
      condition: service_healthy  # Wait for healthy!
```

**How it works**:
```
1. postgres container starts
2. Docker runs health check every 10s
3. After 5 successful checks, marked healthy
4. backend starts (postgres is READY)
5. backend connection succeeds ✅
```

### Our Startup Sequence

```
1. postgres starts
   ↓
2. postgres becomes healthy (pg_isready succeeds)
   ↓
3. backend starts
   ↓
4. backend becomes healthy (GET /health succeeds)
   ↓
5. frontend starts
   ↓
6. All services running ✅
```

**Total startup time**: ~45 seconds

---

## Health Checks

### Health Check Configuration

```yaml
healthcheck:
  test: ["CMD-SHELL", "command to test health"]
  interval: 30s      # How often to check
  timeout: 10s       # Max time for check
  retries: 3         # Failures before unhealthy
  start_period: 40s  # Grace period for startup
```

### Health Check Examples

#### PostgreSQL
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U healthcare_user -d healthcare_ai_db"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```

**What it does**: Runs `pg_isready` command
- Returns 0 (success) if accepting connections
- Returns 1 (failure) if not ready

#### Backend (HTTP Endpoint)
```yaml
healthcheck:
  test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**What it does**: Makes HTTP request to /health
- Returns 0 if HTTP 200
- Returns 1 if error

#### Frontend (nginx)
```yaml
healthcheck:
  test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

### Health Check States

```
starting  → Container just started, within start_period
healthy   → Health checks passing
unhealthy → Health checks failing (after retries exceeded)
```

**Checking Health**:
```bash
docker-compose ps
# Shows (healthy) or (unhealthy) in STATUS
```

---

## Environment Variables

### Methods to Pass Environment Variables

#### 1. Hardcoded in Compose File (Not Recommended)
```yaml
environment:
  DATABASE_URL: postgresql://postgres:5432/db  # ❌ Visible in git
```

#### 2. From .env File (Recommended)
```yaml
environment:
  ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}  # Read from .env
```

**Create .env file**:
```bash
# .env (add to .gitignore!)
ANTHROPIC_API_KEY=sk-ant-api03-...
DB_PASSWORD=secret123
```

#### 3. From Shell Environment
```bash
export ANTHROPIC_API_KEY=sk-ant-...
docker-compose up
```

#### 4. env_file Directive
```yaml
services:
  backend:
    env_file:
      - backend.env  # Load all vars from file
```

### Variable Substitution

```yaml
postgres:
  image: postgres:${POSTGRES_VERSION:-16}-alpine
         # Uses POSTGRES_VERSION if set, else 16
```

### Service-to-Service Communication

Services automatically get environment variables:

```yaml
backend:
  environment:
    DB_HOST: postgres  # Service name
    DB_PORT: 5432
    # Backend can connect to postgres:5432
```

**Inside backend container**:
```javascript
const host = process.env.DB_HOST  // "postgres"
const connection = createConnection({
  host: host,  // Resolves to postgres container IP
  port: 5432
})
```

---

## Development vs Production

### Production (docker-compose.yml)

```yaml
services:
  backend:
    build: ./backend
    environment:
      NODE_ENV: production
    command: node dist/index.js  # Run built code
```

### Development Override (docker-compose.dev.yml)

```yaml
services:
  backend:
    build:
      target: builder  # Use builder stage
    command: npm run dev  # Hot reload
    environment:
      NODE_ENV: development
    volumes:
      - ./backend/src:/app/src:ro  # Mount source code
      - /app/node_modules  # Preserve container's node_modules
```

### Using Override Files

```bash
# Production
docker-compose up

# Development (merges both files)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

**Merge Behavior**:
- Arrays: Concatenate
- Objects: Merge (override wins)
- Scalars: Replace (override wins)

**Example**:
```yaml
# docker-compose.yml
environment:
  NODE_ENV: production
  PORT: 3000

# docker-compose.dev.yml
environment:
  NODE_ENV: development

# Result when merged:
environment:
  NODE_ENV: development  # Overridden
  PORT: 3000             # Kept
```

---

## Common Commands

### Starting Services

```bash
# Start in foreground (see logs)
docker-compose up

# Start in background (detached)
docker-compose up -d

# Rebuild images before starting
docker-compose up --build

# Force recreate containers
docker-compose up --force-recreate

# Start specific service
docker-compose up backend
```

### Stopping Services

```bash
# Stop containers (keeps volumes and networks)
docker-compose stop

# Stop and remove containers, networks
docker-compose down

# Stop and remove volumes (⚠️ DESTROYS DATA!)
docker-compose down -v

# Remove specific service
docker-compose rm backend
```

### Viewing Status

```bash
# List containers
docker-compose ps

# Show logs
docker-compose logs

# Follow logs (tail -f)
docker-compose logs -f

# Logs for specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100
```

### Executing Commands

```bash
# Run command in service
docker-compose exec backend sh

# Run as specific user
docker-compose exec -u root backend sh

# Run command without starting services
docker-compose run backend npm test

# Run in database
docker-compose exec postgres psql -U healthcare_user -d healthcare_ai_db
```

### Scaling Services

```bash
# Run 3 instances of backend
docker-compose up --scale backend=3
```

**Note**: Only works if:
- No `container_name` specified
- No port conflicts (use random ports)

### Building Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend

# Build with no cache
docker-compose build --no-cache

# Pull images only
docker-compose pull
```

### Validating Configuration

```bash
# Check for syntax errors
docker-compose config

# Show merged configuration (with overrides)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml config
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs service_name

# Check container status
docker-compose ps

# Inspect container
docker inspect container_name
```

**Common Issues**:
1. Port already in use
   - Error: "port is already allocated"
   - Fix: Change port or stop conflicting service

2. Build failed
   - Error: "build failed"
   - Fix: Check Dockerfile, run `docker-compose build`

3. Dependency not ready
   - Error: "connection refused"
   - Fix: Add health check to dependency

### Services Can't Communicate

```bash
# Check if services are on same network
docker network inspect healthcare-network

# Test connectivity
docker-compose exec backend ping postgres
docker-compose exec backend wget http://frontend:8080
```

### Volume Permission Issues

```bash
# Check volume ownership
docker-compose exec service ls -la /path

# Fix permissions
docker-compose exec -u root service chown -R user:group /path
```

### Container Keeps Restarting

```bash
# Check restart policy
docker-compose config | grep restart

# Check logs for crash reason
docker-compose logs --tail=50 service_name

# Run without restart to debug
docker-compose run --rm service_name sh
```

### Database Connection Errors

```bash
# Verify postgres is healthy
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Test connection manually
docker-compose exec backend sh
> psql postgresql://user:pass@postgres:5432/db
```

---

## Best Practices

### 1. Version Control

```bash
# Commit compose files
git add docker-compose.yml
git add docker-compose.dev.yml

# Don't commit .env
echo ".env" >> .gitignore

# Provide .env.example
cp .env .env.example
# Remove secrets from .env.example
git add .env.example
```

### 2. Service Naming

```yaml
# ✅ GOOD - Clear, descriptive names
services:
  postgres:
  backend:
  frontend:

# ❌ BAD - Vague names
services:
  db:
  api:
  web:
```

### 3. Environment Variables

```yaml
# ✅ GOOD - Use ${VAR} syntax
environment:
  API_KEY: ${ANTHROPIC_API_KEY}

# ❌ BAD - Hardcode secrets
environment:
  API_KEY: sk-ant-api03-secret123  # Never commit secrets!
```

### 4. Resource Limits

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '0.5'      # Max 50% of one CPU
        memory: 512M     # Max 512MB RAM
      reservations:
        cpus: '0.25'     # Reserve 25% CPU
        memory: 256M     # Reserve 256MB RAM
```

### 5. Logging

```yaml
backend:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"   # Max log file size
      max-file: "3"      # Keep 3 log files
```

### 6. Health Checks

```yaml
# ✅ GOOD - Always include health checks
backend:
  healthcheck:
    test: ["CMD", "wget", "-q", "http://localhost:3000/health"]
    interval: 30s

# ❌ BAD - No health check
backend:
  # No healthcheck means depends_on doesn't know when ready
```

### 7. Development Workflow

```bash
# Use aliases
alias dc='docker-compose'
alias dcup='docker-compose up -d'
alias dcdown='docker-compose down'
alias dclogs='docker-compose logs -f'

# Create Makefile
# make up, make down, make logs, etc.
```

---

## Further Learning

### Official Documentation
- **Docker Compose**: https://docs.docker.com/compose/
- **Compose File Reference**: https://docs.docker.com/compose/compose-file/
- **Compose CLI**: https://docs.docker.com/compose/reference/

### Tutorials
- Compose Getting Started: https://docs.docker.com/compose/gettingstarted/
- Awesome Compose: https://github.com/docker/awesome-compose

### Next Steps
1. Learn Kubernetes for production orchestration
2. Explore Docker Swarm for multi-host deployments
3. Study service mesh (Istio, Linkerd)
4. Learn container security best practices

---

## Summary

You've learned how to orchestrate multi-container applications with Docker Compose:

✅ **Multi-container orchestration** - One command starts everything
✅ **Service dependencies** - Proper startup order with health checks
✅ **Data persistence** - Named volumes for database
✅ **Service discovery** - Automatic DNS resolution by service name
✅ **Environment management** - Separate dev/prod configurations
✅ **Network isolation** - Custom networks for security

**Key Takeaways**:
1. Docker Compose simplifies multi-container applications
2. Health checks ensure services start in correct order
3. Named volumes persist data across container restarts
4. Custom networks enable service discovery by name
5. Override files separate dev from production config
6. Never commit secrets, use .env files

Now you can orchestrate complex applications with a single YAML file! 🚀

---

**Last Updated**: 2025-11-08
**Version**: 1.0.0
**Author**: Healthcare AI Team
**Related Docs**: T005_DockerCompose_Log.md, T005_DockerCompose_TestLog.md
