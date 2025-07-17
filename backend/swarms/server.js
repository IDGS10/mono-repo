import app from './src/app.js';
import { PORT, NODE_ENV } from './src/config/environment.js';
import DatabaseService from './src/services/databaseService.js';
import logger from './src/utils/logger.js';
import Banner from './src/utils/banner.js';

const server = app.listen(PORT, () => {
  if (NODE_ENV === 'development') {
    Banner.showBanner()
    Banner.showServerInfo(PORT, NODE_ENV)
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📍 Environment: ${NODE_ENV}`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`📡 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    logger.info('🔒 HTTP server closed');
    
    try {
      await DatabaseService.disconnect();
      logger.info('👋 Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default server;
