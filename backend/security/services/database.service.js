const { pool } = require("../config/database");

// Connection to PostgreSQL
async function connectDatabase() {
  console.log("🔄 Intentando conectar a la base de datos...");

  try {
    // Add 10 seconds timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: La conexión tardó más de 10 segundos')), 10000)
    );

    const connectPromise = pool.connect();

    const client = await Promise.race([connectPromise, timeoutPromise]);

    console.log("✅ Conectado exitosamente a PostgreSQL (VPC)");
    console.log(`🗄️  Base de datos: ${process.env.DB_NAME || 'segDatabase'}`);
    console.log(`🌐 Host: ${process.env.DB_HOST || 'Base de datos externa'}`);

    client.release();

    console.log("🔄 Inicializando tablas de la base de datos...");
    await initializeDatabase();
    console.log("✅ Base de datos inicializada correctamente");

  } catch (err) {
    console.error("❌ Error conectando a PostgreSQL:");
    console.error("   Mensaje:", err.message);
    console.error("   Código:", err.code);
    console.error("   Stack:", err.stack);

    // Don't exit process immediately for debugging
    console.log("⚠️  Continuando sin base de datos (modo desarrollo)");
    return false;
  }

  return true;
}

// Create tables if not exist
async function initializeDatabase() {
  try {
    console.log("🔄 Creando tablas necesarias...");

    const createTables = `
      -- Tabla de usuarios
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'active',
        rol VARCHAR(50) DEFAULT 'Manager' CHECK (rol IN ('Manager', 'Project manager', 'Organization', 'Cluster manager')),
        accepted INTEGER DEFAULT 0,
        org_id INTEGER,
        last_login TIMESTAMP,
        profile_picture TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de sesiones de login
      CREATE TABLE IF NOT EXISTS login_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL,
        ip_address INET,
        user_agent TEXT,
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

    -- Tabla de intentos de login
    CREATE TABLE IF NOT EXISTS login_attempts (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255),
      ip_address INET,
      success BOOLEAN,
      failure_reason TEXT,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de configuración de usuario
    CREATE TABLE IF NOT EXISTS user_settings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      setting_key VARCHAR(100) NOT NULL,
      setting_value TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(user_id, setting_key)
    );

    -- Índices para mejor rendimiento
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON login_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON login_sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);
  `;

    await pool.query(createTables);
    console.log("✅ Tablas de PostgreSQL inicializadas correctamente");

    // Migration to add last_login column if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
      `);
      console.log("✅ Columna last_login agregada/verificada");
    } catch (err) {
      console.log("⚠️  Columna last_login ya existe o error menor:", err.message);
    }

    // Migration to add profile_picture column if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS profile_picture TEXT;
      `);
      console.log("✅ Columna profile_picture agregada/verificada");
    } catch (err) {
      console.log("⚠️  Columna profile_picture ya existe o error menor:", err.message);
    }

    await seedDefaultData();

  } catch (err) {
    console.error("❌ Error creando tablas:", err.message);
    throw err;
  }
}

// Initial seed data for default user in case of empty database
async function seedDefaultData() {
  try {
    const { rows } = await pool.query("SELECT COUNT(*) as count FROM users");

    if (Number.parseInt(rows[0].count) === 0) {
      console.log("🌱 Creando usuario de prueba...");
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("admin123", 12);

      await pool.query(
        `
        INSERT INTO users (first_name, last_name, email, password_hash, phone, status, rol)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
        [
          "Admin",
          "Sistema",
          "admin@faceauth.com",
          hashedPassword,
          "3001234567",
          "active",
          "Propietario",
        ]
      );

      console.log("✅ Usuario de prueba creado: admin@faceauth.com / admin123");
    }
  } catch (err) {
    console.error("❌ Error creando usuario de prueba:", err.message);
  }
}

module.exports = {
  connectDatabase,
  initializeDatabase,
  seedDefaultData,
};
