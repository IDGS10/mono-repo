import { Sequelize } from 'sequelize'
import {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,
  DATABASE_URL,
} from './environment.js'

let sequelize

if (DATABASE_URL) {
  // If DATABASE_URL is set, use it
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
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
  // Otherwise, use the environment variables
  sequelize = new Sequelize({
    dialect: 'postgres',
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    username: DB_USERNAME,
    password: DB_PASSWORD,
    logging: false,
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

// Test the connection
sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Connection to PostgreSQL established successfully')
  })
  .catch((err) => {
    console.error('❌ Error connecting to PostgreSQL:', err)
  })

export default sequelize
