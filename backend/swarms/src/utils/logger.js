import { addColors, format, transports, createLogger } from 'winston'
import { join } from 'path'
import process from 'process'

// 1. LOG LEVELS AND COLORS CONFIGURATION
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

addColors(LOG_COLORS)

// 2. LOG FORMAT CONFIGURATION
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.colorize({ all: true }),
  format.printf(({ timestamp, level, message }) => 
    `${timestamp} [${level}]: ${message}`
  )
)

// 3. TRANSPORTS CONFIGURATION
const createTransports = () => {
  const transportsList = [
    // Always show in console
    new transports.Console()
  ]

  // Add file transports only in production
  if (process.env.NODE_ENV === 'production') {
    transportsList.push(
      new transports.File({
        filename: join('logs', 'error.log'),
        level: 'error',
      }),
      new transports.File({
        filename: join('logs', 'combined.log'),
      })
    )
  }

  return transportsList
}

// 4. CREATE THE LOGGER
const logger = createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels: LOG_LEVELS,
  format: logFormat,
  transports: createTransports(),
})

// 5. CONVENIENCE FUNCTIONS
export const log = {
  error: (...args) => logger.error(args.join(' ')),
  warn: (...args) => logger.warn(args.join(' ')),
  info: (...args) => logger.info(args.join(' ')),
  http: (...args) => logger.http(args.join(' ')),
  debug: (...args) => logger.debug(args.join(' ')),
}

// 6. EXPORTS
export default logger
export const { error, warn, info, http, debug } = log