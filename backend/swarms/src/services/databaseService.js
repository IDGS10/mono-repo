import { sequelize } from '../models/index.js'
import logger from '../utils/logger.js'

class DatabaseService {
  static async connect() {
    try {
      await sequelize.authenticate()
      logger.info('✅ Database connection established successfully')
      return true
    } catch (error) {
      logger.error('❌ Unable to connect to the database:', error.message)
      throw error
    }
  }

  static async disconnect() {
    try {
      await sequelize.close()
      logger.info('🔌 Database connection closed')
    } catch (error) {
      logger.error('❌ Error closing database connection:', error.message)
      throw error
    }
  }

  static async sync(options = {}) {
    try {
      await sequelize.sync(options)
      logger.info('🔄 Database synchronized successfully')
    } catch (error) {
      logger.error('❌ Error synchronizing database:', error.message)
      throw error
    }
  }

  static async isHealthy() {
    try {
      await sequelize.authenticate()
      return true
    } catch {
      return false
    }
  }
}

export default DatabaseService
