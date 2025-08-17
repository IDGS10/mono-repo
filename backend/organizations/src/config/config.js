require('dotenv').config();

module.exports = {
  environment: process.env.NODE_ENV,
  port: process.env.PORT,
  
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN
  },


 email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@iot-ecosystem.com'
  },
  
  upload: {
    maxSize: 2 * 1024 * 1024, 
    allowedTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
  },
  
  invitation: {
    expirationDays: 7,
    baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  }  

  

};