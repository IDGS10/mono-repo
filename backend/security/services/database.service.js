const { pool } = require("../config/database");

//Connection to PostgreSQL
async function connectDatabase() {
  try {
    const client = await pool.connect();
    console.log("✅ Conectado exitosamente a PostgreSQL (Neon)");
    console.log(`🗄️  Base de datos: ${process.env.DB_NAME}`);
    console.log(`🌐 Host: ${process.env.DB_HOST}`);
    client.release();
    await initializeDatabase();
  } catch (err) {
    console.error("❌ Error conectando a PostgreSQL:", err.message);
    process.exit(1);
  }
}

//Create tables if not exist
async function initializeDatabase() {
  const createTables = `
    -- Tabla de usuarios
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      id_number VARCHAR(50) UNIQUE,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de embeddings faciales
    CREATE TABLE IF NOT EXISTS face_embeddings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      embedding_data TEXT NOT NULL,
      capture_type VARCHAR(50) NOT NULL CHECK(capture_type IN ('normal', 'sonrisa', 'asentir', 'subir_cabeza')),
      quality_score REAL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- Tabla de sesiones de login
    -- CORRECCIÓN: Cambiar token_hash por token
    CREATE TABLE IF NOT EXISTS login_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
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
    CREATE INDEX IF NOT EXISTS idx_face_embeddings_user_id ON face_embeddings(user_id);
    CREATE INDEX IF NOT EXISTS idx_login_sessions_user_id ON login_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON login_sessions(token);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
    CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON login_attempts(created_at);
  `;

  try {
    await pool.query(createTables);
    console.log("✅ Tablas de PostgreSQL inicializadas correctamente");
    await migrateDatabase();
    await seedDefaultData();
  } catch (err) {
    console.error("❌ Error creando tablas:", err.message);
  }
}

//Database migration function
async function migrateDatabase() {
  try {
    console.log("🔄 Verificando migraciones de base de datos...");

    // Migración para corregir la columna token_hash a token
    const migrateTokenColumn = `
      -- Verificar si la columna token_hash existe y cambiarla por token
      DO $$ 
      BEGIN
        IF EXISTS(SELECT * FROM information_schema.columns 
                  WHERE table_name='login_sessions' AND column_name='token_hash') THEN
          ALTER TABLE login_sessions RENAME COLUMN token_hash TO token;
          ALTER TABLE login_sessions ALTER COLUMN token TYPE TEXT;
        END IF;
      END $$;
    `;

    await pool.query(migrateTokenColumn);
    console.log("✅ Migración de columna token completada");

    //Migration for capture_type constraint
    const migrateCaptureTypeConstraint = `
      -- Eliminar constraint viejo si existe
      ALTER TABLE face_embeddings DROP CONSTRAINT IF EXISTS face_embeddings_capture_type_check;
      
      -- Agregar nuevo constraint con tipos actualizados
      ALTER TABLE face_embeddings ADD CONSTRAINT face_embeddings_capture_type_check 
        CHECK(capture_type IN ('normal', 'sonrisa', 'asentir', 'subir_cabeza'));
    `;

    await pool.query(migrateCaptureTypeConstraint);
    console.log("✅ Migración de constraint capture_type completada");
  } catch (err) {
    console.error(
      "⚠️ Error en migraciones (puede ser normal en primera ejecución):",
      err.message
    );
  }
}

//Initial seed data for default user in case of empty database
async function seedDefaultData() {
  try {
    const { rows } = await pool.query("SELECT COUNT(*) as count FROM users");

    if (Number.parseInt(rows[0].count) === 0) {
      console.log("🌱 Creando usuario de prueba...");
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("admin123", 12);

      await pool.query(
        `
        INSERT INTO users (first_name, last_name, email, password_hash, phone, id_number)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
        [
          "Admin",
          "Sistema",
          "admin@faceauth.com",
          hashedPassword,
          "3001234567",
          "12345678",
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
};