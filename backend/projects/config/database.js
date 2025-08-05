import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

// Log environment variables for debugging
console.log('🔧 Variables de entorno cargadas:')
console.log('DB_HOST:', process.env.DB_HOST)
console.log('DB_USER:', process.env.DB_USER)
console.log('DB_NAME:', process.env.DB_NAME)
console.log('DB_PORT:', process.env.DB_PORT)
console.log('NODE_ENV:', process.env.NODE_ENV)

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST ,
  port: parseInt(process.env.DB_PORT) ,
  database: process.env.DB_NAME ,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD,
  
  // Connection pool settings for remote server
  max: 10, // Reduce max connections for remote server
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 10000, // Increased timeout for remote connections
  
  // SSL configuration - required for remote PostgreSQL connections
  ssl: {
    rejectUnauthorized: false // Allow self-signed certificates
  },
  
  // Additional options for better connection handling
  query_timeout: 60000, // 60 seconds
  statement_timeout: 60000, // 60 seconds
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
}

console.log('🔒 Configuración SSL para PostgreSQL cargada correctamente')
console.log('🔧 Configuración del pool:')
console.log(`Host: ${dbConfig.host}`)
console.log(`Puerto: ${dbConfig.port}`)
console.log(`Base de datos: ${dbConfig.database}`)
console.log(`Usuario: ${dbConfig.user}`)
console.log(`SSL: ${dbConfig.ssl ? 'Habilitado' : 'Deshabilitado'}`)

// Create the connection pool
const pool = new Pool(dbConfig)

// Handle pool events
pool.on('connect', (client) => {
  console.log('🔗 Conexión establecida, PID:', client.processID)
})

pool.on('error', (err, client) => {
  console.error('❌ Error inesperado en el pool:', err)
  // Don't exit process on connection errors, try to reconnect
})

pool.on('acquire', (client) => {
  console.log('📝 Cliente adquirido del pool')
})

pool.on('release', (client) => {
  console.log('🔄 Cliente liberado al pool')
})

// Test database connection with retry logic
export const testConnection = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Intento de conexión ${attempt}/${retries}...`)
      
      const client = await pool.connect()
      const result = await client.query('SELECT NOW() as server_time, version() as pg_version')
      client.release()
      
      console.log('✅ Conexión exitosa a PostgreSQL (VPC)')
      console.log('🗄️  Base de datos:', dbConfig.database)
      console.log('🌐 Host:', dbConfig.host)
      console.log('⏰ Hora del servidor:', result.rows[0].server_time)
      console.log('🐘 Versión PostgreSQL:', result.rows[0].pg_version.split(' ')[0])
      
      return true
    } catch (err) {
      console.error(`❌ Intento ${attempt} falló:`, err.message)
      
      if (attempt === retries) {
        console.error('💥 Todos los intentos de conexión fallaron')
        console.error('🔍 Verifica:')
        console.error('   - Credenciales de base de datos')
        console.error('   - Conectividad de red al servidor')
        console.error('   - Configuración de firewall/VPC')
        console.error('   - Estado del servidor PostgreSQL')
        return false
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
    }
  }
  return false
}

// Execute query with error handling and retry logic
export const query = async (text, params, retries = 2) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const start = Date.now()
    let client = null
    
    try {
      client = await pool.connect()
      const result = await client.query(text, params)
      const duration = Date.now() - start
      
      console.log('📊 Query ejecutado exitosamente:', { 
        duration: `${duration}ms`, 
        rows: result.rowCount,
        command: result.command 
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - start
      console.error('💥 Error en query:', { 
        text: text.substring(0, 100) + '...', 
        error: error.message,
        duration: `${duration}ms`,
        attempt 
      })
      
      if (attempt === retries) {
        throw error
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    } finally {
      if (client) {
        client.release()
      }
    }
  }
}

// Get a client from the pool (for transactions)
export const getClient = async () => {
  try {
    const client = await pool.connect()
    console.log('📋 Cliente obtenido para transacción')
    return client
  } catch (error) {
    console.error('❌ Error obteniendo cliente:', error.message)
    throw error
  }
}

// Test specific database and table access
export const testDatabaseAccess = async () => {
  try {
    console.log('🔍 Verificando acceso a base de datos...')
    
    // Test basic connection
    const timeResult = await query('SELECT NOW() as current_time')
    console.log('✅ Consulta básica exitosa')
    
    // Test database existence
    const dbResult = await query(
      'SELECT datname FROM pg_database WHERE datname = $1', 
      [dbConfig.database]
    )
    
    if (dbResult.rows.length === 0) {
      throw new Error(`Base de datos '${dbConfig.database}' no encontrada`)
    }
    
    console.log('✅ Base de datos existe')
    
    // Test user permissions
    const permResult = await query(`
      SELECT 
        has_database_privilege(current_user, current_database(), 'CREATE') as can_create,
        has_database_privilege(current_user, current_database(), 'CONNECT') as can_connect
    `)
    
    console.log('✅ Permisos verificados:', permResult.rows[0])
    
    // Test projects table
    const tableResult = await query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_name = 'projects'
    `)
    
    if (tableResult.rows.length > 0) {
      console.log('✅ Tabla projects encontrada')
    } else {
      console.warn('⚠️  Tabla projects no encontrada')
    }
    
    return true
  } catch (error) {
    console.error('❌ Error verificando acceso a BD:', error.message)
    throw error
  }
}

// End pool (for graceful shutdown)
export const end = async () => {
  try {
    await pool.end()
    console.log('🔌 Pool de conexiones cerrado correctamente')
  } catch (error) {
    console.error('❌ Error cerrando pool:', error.message)
  }
}

export default { query, getClient, testConnection, testDatabaseAccess, end }