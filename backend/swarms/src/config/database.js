import { Sequelize } from 'sequelize'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  DATABASE_URL,
} from './environment.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Función para leer certificados SSL
function getSSLConfig() {
  try {
    const sslDir = path.join(__dirname, '.ssl')
    
    return {
      ca: fs.readFileSync(path.join(sslDir, 'postgresql-ca.crt')),
      cert: fs.readFileSync(path.join(sslDir, 'client.crt')),
      key: fs.readFileSync(path.join(sslDir, 'client.key')),
      rejectUnauthorized: false, // Cambia a true en producción
    }
  } catch (error) {
    console.error('Error al leer los certificados SSL:', error)
    return null
  }
}

const sslConfig = getSSLConfig()

let sequelize

if (DATABASE_URL) {
  // Si tienes DATABASE_URL, úsala con SSL
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: sslConfig
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
    },
  })
} else {
  // Si no tienes DATABASE_URL, usa las variables individuales
  sequelize = new Sequelize({
    dialect: 'postgres',
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    username: DB_USERNAME,
    password: DB_PASSWORD,
    logging: false,
    dialectOptions: {
      ssl: sslConfig
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
    },
  })
}

// Probar la conexión
sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexión SSL a PostgreSQL establecida correctamente')
  })
  .catch(err => {
    console.error('❌ Error al conectar con SSL:', err)
  })

export default sequelize