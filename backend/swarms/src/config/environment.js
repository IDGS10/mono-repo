import dotenv from 'dotenv'

dotenv.config()

export const {
  PORT,
  NODE_ENV,
  LOG_LEVEL,

  DATABASE_URL,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USERNAME,
  DB_PASSWORD,

  JWT_SECRET,
  JWT_EXPIRES_IN,
  
  CORS_ORIGIN,
} = process.env