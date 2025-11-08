# T012: Database Connection from Backend - Educational Guide

**Topic**: PostgreSQL Connection Pooling with node-postgres (pg)
**Date**: 2025-11-08
**Level**: Intermediate

---

## Overview

This guide covers how to integrate PostgreSQL into a Node.js/Express backend using the node-postgres (pg) client library with connection pooling for optimal performance.

---

## Key Concepts

### 1. What is node-postgres (pg)?

**node-postgres** (npm package: `pg`) is the most popular PostgreSQL client for Node.js.

**Features**:
- Pure JavaScript implementation (no native dependencies)
- Connection pooling built-in
- Promises and async/await support
- Parameterized queries (SQL injection protection)
- TypeScript support via @types/pg

**Alternative Libraries**:
- **Knex.js**: Query builder on top of pg
- **Sequelize**: Full ORM (Object-Relational Mapping)
- **Prisma**: Modern ORM with type-safe queries

**Why pg?**:
- Lightweight and fast
- Direct SQL control
- No abstraction overhead
- Perfect for custom queries

### 2. Connection Pooling

**What is Connection Pooling?**

A connection pool maintains a set of reusable database connections instead of creating new connections for each request.

**Without Pooling** (BAD):
```typescript
// Each request creates a new connection
app.get('/api/data', async (req, res) => {
  const client = new Client({ /* config */ });
  await client.connect();        // Slow! (~100ms)
  const result = await client.query('SELECT * FROM users');
  await client.end();            // Closes connection
  res.json(result.rows);
});
```

**Problems**:
- Connection establishment is slow (~100ms per connection)
- Database has limited connections (default: 100)
- Resource exhaustion under load

**With Pooling** (GOOD):
```typescript
// Connections are reused
const pool = new Pool({ /* config */ });

app.get('/api/data', async (req, res) => {
  const client = await pool.connect();  // Fast! Reuses existing connection
  const result = await client.query('SELECT * FROM users');
  client.release();              // Returns to pool
  res.json(result.rows);
});
```

**Benefits**:
- Fast queries (~1ms to get connection from pool)
- Controlled resource usage
- Better scalability

### 3. Pool Configuration Options

```typescript
const pool = new Pool({
  // Connection settings
  host: 'localhost',              // Database server
  port: 5432,                     // PostgreSQL default port
  database: 'mydb',               // Database name
  user: 'myuser',                 // Username
  password: 'mypassword',         // Password

  // Pool settings
  max: 10,                        // Max connections in pool
  min: 0,                         // Min connections to keep open
  idleTimeoutMillis: 30000,       // Close idle connections after 30s
  connectionTimeoutMillis: 5000,  // Error after 5s if can't connect
});
```

**Choosing Pool Size (max)**:
- **Too small**: Requests wait for available connections
- **Too large**: Database overwhelmed, memory usage high
- **Rule of thumb**: `(CPU cores * 2) + effective_spindle_count`
- **For this project**: 10 connections is good for development

### 4. Connection vs Pool

**Client** (Single Connection):
```typescript
import { Client } from 'pg';

const client = new Client({ /* config */ });
await client.connect();
await client.query('SELECT NOW()');
await client.end();
```

**Pool** (Connection Pool):
```typescript
import { Pool } from 'pg';

const pool = new Pool({ /* config */ });
const client = await pool.connect();
await client.query('SELECT NOW()');
client.release();  // Don't close, return to pool
```

**Use Pool for**:
- Web servers (Express, Fastify)
- Long-running applications
- Multiple concurrent requests

**Use Client for**:
- One-off scripts
- Database migrations
- CLI tools

### 5. Query Methods

**Method 1: Pool.query() - Simple Queries**
```typescript
// Direct query on pool (acquires and releases automatically)
const result = await pool.query('SELECT * FROM users WHERE id = $1', [123]);
console.log(result.rows);
```

**Method 2: Pool.connect() - Multiple Queries**
```typescript
// Get client from pool for multiple queries
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO users (name) VALUES ($1)', ['Alice']);
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();  // ALWAYS release!
}
```

**Method 3: Custom Wrapper (This Project)**
```typescript
export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Query:', { text, duration, rows: result.rowCount });
  return result;
}
```

### 6. Parameterized Queries (SQL Injection Prevention)

**BAD - SQL Injection Vulnerable**:
```typescript
// NEVER DO THIS!
const userId = req.params.id;
const result = await pool.query(`SELECT * FROM users WHERE id = ${userId}`);
// Attack: userId = "1 OR 1=1; DROP TABLE users;"
```

**GOOD - Safe with Parameterized Queries**:
```typescript
const userId = req.params.id;
const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
// $1, $2, $3... are placeholders
// Values are safely escaped by pg library
```

### 7. Error Handling

**Pool-level Errors**:
```typescript
// Handle unexpected errors (network failures, etc.)
pool.on('error', (err, client) => {
  console.error('Unexpected pool error:', err);
  process.exit(-1);  // Exit and let process manager restart
});
```

**Query-level Errors**:
```typescript
try {
  const result = await pool.query('SELECT * FROM nonexistent_table');
} catch (error) {
  if (error.code === '42P01') {
    console.error('Table does not exist');
  }
  // PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
}
```

### 8. Graceful Shutdown

**Why Important?**

When shutting down your server, you must close the database pool to:
- Prevent connection leaks
- Complete in-flight queries
- Avoid "connection refused" errors

**Implementation**:
```typescript
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await pool.end();  // Close all connections
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await pool.end();
  process.exit(0);
});
```

**What happens**:
1. `pool.end()` waits for all active queries to complete
2. Closes idle connections
3. Prevents new connections
4. Returns when all connections closed

### 9. Environment Variables for Database Config

**Why Use Environment Variables?**

- **Security**: Never commit credentials to git
- **Flexibility**: Different configs for dev/staging/prod
- **Docker-friendly**: Easy to override in containers

**Example (.env file)**:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb
DB_USER=myuser
DB_PASSWORD=mypassword
```

**Usage**:
```typescript
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'defaultdb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});
```

### 10. Testing Database Connection

**Health Check Function**:
```typescript
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time, version() as version');
    client.release();

    console.log('✅ Database connected');
    console.log('   Time:', result.rows[0].time);
    console.log('   Version:', result.rows[0].version);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
```

**When to Test**:
- Server startup (verify database is reachable)
- Health check endpoint (for monitoring)
- Before running migrations

---

## Best Practices

### ✅ Do

1. **Use connection pooling** for web servers
2. **Use parameterized queries** to prevent SQL injection
3. **Always release connections** back to the pool
4. **Handle pool errors** with error event listener
5. **Close pool on shutdown** for graceful exit
6. **Use environment variables** for database credentials
7. **Test connection on startup** to fail fast if database is down
8. **Log query performance** for debugging

### ❌ Don't

1. **Don't create new pools per request** (creates too many connections)
2. **Don't forget to release connections** (causes connection leaks)
3. **Don't use string concatenation** for queries (SQL injection risk)
4. **Don't commit .env files** to git (security risk)
5. **Don't hardcode credentials** in source code
6. **Don't ignore pool errors** (can cause silent failures)
7. **Don't use SELECT *** in production** (performance and security)

---

## Common Patterns

### Pattern 1: Health Check Endpoint

```typescript
app.get('/api/db/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});
```

### Pattern 2: Transaction Wrapper

```typescript
export async function transaction(callback: (client: PoolClient) => Promise<void>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await callback(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Usage:
await transaction(async (client) => {
  await client.query('INSERT INTO users (name) VALUES ($1)', ['Alice']);
  await client.query('INSERT INTO logs (message) VALUES ($1)', ['User created']);
});
```

### Pattern 3: Query Logging Wrapper

```typescript
export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query:', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error:', { text, error });
    throw error;
  }
}
```

---

## Troubleshooting

### Problem: "Connection refused"

**Cause**: PostgreSQL not running or wrong host/port

**Solution**:
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check connection from host
psql -h localhost -p 5432 -U myuser -d mydb
```

### Problem: "Too many clients"

**Cause**: Connection leak (not releasing connections)

**Solution**:
1. Check for missing `client.release()` calls
2. Reduce pool max size
3. Increase PostgreSQL max_connections

### Problem: "Password authentication failed"

**Cause**: Wrong credentials in .env

**Solution**:
1. Verify .env values match docker-compose.yml
2. Check if .env is being loaded (dotenv.config())

---

## Summary

**Key Takeaways**:
1. **Connection pooling** improves performance and scalability
2. **Parameterized queries** prevent SQL injection attacks
3. **Environment variables** keep credentials secure
4. **Always release connections** to avoid leaks
5. **Graceful shutdown** prevents data corruption
6. **Health checks** enable monitoring and debugging

---

**Guide Complete** ✅
