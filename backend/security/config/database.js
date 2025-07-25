const { Pool } = require("pg");
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde config.env
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

console.log('🔧 Variables de entorno cargadas:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Verificar que las variables están definidas
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME || !process.env.DB_PASSWORD) {
  console.error('❌ Variables de entorno faltantes para la base de datos');
  process.exit(1);
}

// Verificar disponibilidad de certificados SSL (opcional para desarrollo)
const certPath = path.join(__dirname, '.ssl');
let sslConfig = false; // Por defecto sin SSL

// Solo intentar cargar certificados si existen
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
  console.log("🔒 Configuración SSL para PostgreSQL cargada correctamente");
} catch (err) {
  console.warn('⚠️ Certificados SSL no encontrados, usando conexión simple:', err.message);
  // Para desarrollo, permitir conexión sin certificados pero con SSL básico
  sslConfig = {
    rejectUnauthorized: true // Cambiar a false solo si es necesario para desarrollo
  };
}

// Configuración optimizada del pool
const poolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 5432,
  ssl: sslConfig, // Usar la configuración SSL dinámica
  max: 20, // Número óptimo para la mayoría de aplicaciones
  min: 4,
  application_name: 'segDev', // Para identificar en PostgreSQL
  connectionTimeoutMillis: 10000, // 10 segundos
  idleTimeoutMillis: 30000, // 30 segundos
  query_timeout: 30000 // 30 segundos
};

console.log('🔧 Configuración del pool:');
console.log('Host:', poolConfig.host);
console.log('Puerto:', poolConfig.port);
console.log('Base de datos:', poolConfig.database);
console.log('Usuario:', poolConfig.user);
console.log('SSL:', poolConfig.ssl ? 'Habilitado' : 'Deshabilitado');

const pool = new Pool(poolConfig);

// Mejores prácticas para manejo de conexiones
pool.on('connect', (client) => {
  console.log('🔗 Conexión establecida, PID:', client.processID);
  // Puedes configurar parámetros por conexión aquí si es necesario
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool:', err.stack || err.message);
  // Considera notificar a tu sistema de monitoreo aquí
});

// Función de salud de la base de datos
async function checkDatabaseHealth() {
  try {
    const res = await pool.query('SELECT NOW() as current_time');
    console.log('🩺 Health check OK. DB Time:', res.rows[0].current_time);
  } catch (err) {
    console.error('🚨 Health check FAILED:', err.message);
  }
}

// Verificación inicial
checkDatabaseHealth();

module.exports = {
  pool,
  checkDatabaseHealth // Exportar para poder usarla periódicamente
};