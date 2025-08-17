const app = require('./src/app');
const config = require('./src/config/config');

const PORT = config.port || 3001;

// Configurar la conexión de base de datos para el middleware después de que la app esté lista
const startServer = async () => {
  try {
    // Obtener el pool de base de datos
    const db = require('./src/config/database');
    
    // Configurar el pool en el middleware para validación de tokens
    // (Si el middleware necesita acceso a la BD para validar usuarios activos)
    
    app.listen(PORT, () => {
      console.log(`🚀 Organizations Service corriendo en puerto ${PORT}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`🔐 JWT configurado: ${process.env.JWT_SECRET ? '✓' : '✗'}`);
    });
  } catch (error) {
    console.error('Error iniciando el servidor:', error);
    process.exit(1);
  }
};

startServer();