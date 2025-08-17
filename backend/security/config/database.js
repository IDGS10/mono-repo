const { Pool } = require("pg");
const fs = require('fs');
const path = require('path');

// Only load environment if not already loaded
if (!process.env.DB_HOST) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

console.log('🔧 Environment variables loaded:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Verify that variables are defined
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME || !process.env.DB_PASSWORD) {
  console.error('❌ Missing environment variables for database');
  throw new Error('Database configuration incomplete - missing environment variables');
}

// Verify SSL certificate availability (optional for development)
const certPath = path.join(__dirname, '.ssl');
let sslConfig = false; // Default without SSL

// Only try to load certificates if they exist
try {
  fs.accessSync(path.join(certPath, 'postgresql-ca.crt'), fs.constants.R_OK);
  fs.accessSync(path.join(certPath, 'client.crt'), fs.constants.R_OK);
  fs.accessSync(path.join(certPath, 'client.key'), fs.constants.R_OK);

  sslConfig = {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
    ca: fs.readFileSync(path.join(certPath, 'postgresql-ca.crt')),
    cert: fs.readFileSync(path.join(certPath, 'client.crt')),
    key: fs.readFileSync(path.join(certPath, 'client.key'))
  };
  console.log("🔒 SSL configuration for PostgreSQL loaded correctly");
} catch (err) {
  console.warn('⚠️ SSL certificates not found, using simple connection:', err.message);
  // For development, you can choose between:
  if (process.env.NODE_ENV === 'development') {
    // Option 1: No SSL for development (simpler)
    sslConfig = false;
    console.log('🔓 Development mode: SSL disabled');
  } else {
    // Option 2: SSL without certificate verification
    sslConfig = {
      rejectUnauthorized: false
    };
  }
}

// Optimized pool configuration
const poolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 5432,
  ssl: sslConfig, // Use dynamic SSL configuration
  max: 20, // Optimal number for most applications
  min: 4,
  application_name: 'segDev', // To identify in PostgreSQL
  connectionTimeoutMillis: 10000, // 10 seconds
  idleTimeoutMillis: 30000, // 30 seconds
  query_timeout: 30000 // 30 seconds
};

console.log('🔧 Pool configuration:');
console.log('Host:', poolConfig.host);
console.log('Port:', poolConfig.port);
console.log('Database:', poolConfig.database);
console.log('User:', poolConfig.user);
console.log('SSL:', poolConfig.ssl ? 'Enabled' : 'Disabled');

const pool = new Pool(poolConfig);

// Best practices for connection handling
pool.on('connect', (client) => {
  console.log('🔗 Connection established, PID:', client.processID);
  // You can configure per-connection parameters here if needed
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error in pool:', err.stack || err.message);
  // Consider notifying your monitoring system here
});

// Database health function
async function checkDatabaseHealth() {
  try {
    const res = await pool.query('SELECT NOW() as current_time');
    console.log('🩺 Health check OK. DB Time:', res.rows[0].current_time);
  } catch (err) {
    console.error('🚨 Health check FAILED:', err.message);
  }
}

// Initial verification
checkDatabaseHealth();

module.exports = {
  pool,
  checkDatabaseHealth // Export to be able to use it periodically
};