-- Healthcare AI Clinical Data Analyzer - Database Initialization
-- This script runs once when the PostgreSQL container is first created

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable timezone support
SET timezone = 'UTC';

-- Database schema will be created by application migrations
-- This file is a placeholder for future initialization scripts

-- Example: Create application-specific schema
-- CREATE SCHEMA IF NOT EXISTS healthcare;

-- Verify database is ready
SELECT 'Database initialized successfully' AS status;
