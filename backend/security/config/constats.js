module.exports = {
  PORT: process.env.PORT || 8000,
  JWT_SECRET: process.env.JWT_SECRET,
  SESSION_TIMEOUT: process.env.SESSION_TIMEOUT || "24h",

  // Security Settings
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  LOCKOUT_DURATION: parseInt(process.env.LOCKOUT_DURATION) || 3600000, // 1 hour in ms
  PASSWORD_MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,

  // Facial Recognition Settings (if needed)
  SIMILARITY_THRESHOLD: 0.85, // 85% of similarity threshold (increased for more security)
  MIN_CONFIDENCE_THRESHOLD: 0.85, // 85% for high confidence
};
