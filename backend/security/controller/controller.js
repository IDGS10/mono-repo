// Enhanced controller that acts as MVC controller
// Orchestrates calls between routes and model

const FacialAuthModel = require("../model/model");
// ===== USAR UTILIDADES DEL MIDDLEWARE COMPARTIDO =====
const { ResponseUtils, asyncHandler } = require('@mono-repo/shared-middleware');

module.exports = {
  /**
   * Checks server health status
   */
  checkHealth: asyncHandler(async (req, res) => {
    return FacialAuthModel.checkHealth(req, res);
  }),

  /**
   * Returns a simple greeting from the security service
   */
  sayHello: asyncHandler(async (req, res) => {
    return FacialAuthModel.sayHello(req, res);
  }),

  /**
   * Registers a new user
   */
  registerUser: asyncHandler(async (req, res) => {
    return FacialAuthModel.register(req, res);
  }),

  /**
   * User login session
   */
  loginSession: asyncHandler(async (req, res) => {
    return FacialAuthModel.login(req, res);
  }),

  /**
   * User logout session
   */
  logoutSession: asyncHandler(async (req, res) => {
    return FacialAuthModel.logout(req, res);
  }),

  /**
   * Gets authenticated user profile
   */
  getUserProfile: asyncHandler(async (req, res) => {
    return FacialAuthModel.getUserProfile(req, res);
  }),

  /**
   * Updates authenticated user profile
   */
  updateUserProfile: asyncHandler(async (req, res) => {
    return FacialAuthModel.updateUserProfile(req, res);
  }),

  /**
   * Gets user session history
   */
  getUserSessions: asyncHandler(async (req, res) => {
    return FacialAuthModel.getUserSessions(req, res);
  }),

  /**
   * Gets user-specific statistics
   */
  getUserStats: asyncHandler(async (req, res) => {
    return FacialAuthModel.getUserStats(req, res);
  }),

  /**
   * Gets dashboard statistics
   */
  getDashboardStats: asyncHandler(async (req, res) => {
    return FacialAuthModel.getDashboardStats(req, res);
  })
};