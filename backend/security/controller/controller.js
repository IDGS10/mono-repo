// Enhanced controller that acts as MVC controller
// Orchestrates calls between routes and model

const FacialAuthModel = require("../model/model");
const ResponseUtils = require("../utils/responseUtils");

module.exports = {
  /**
   * Checks server health status
   */
  checkHealth: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.checkHealth(req, res);
  }),

  /**
   * Registers a new user
   */
  registerUser: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.register(req, res);
  }),

  /**
   * User login session
   */
  loginSession: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.login(req, res);
  }),

  /**
   * User logout session
   */
  logoutSession: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.logout(req, res);
  }),

  /**
   * Gets authenticated user profile
   */
  getUserProfile: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.getUserProfile(req, res);
  }),

  /**
   * Updates authenticated user profile
   */
  updateUserProfile: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.updateUserProfile(req, res);
  }),

  /**
   * Gets user session history
   */
  getUserSessions: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.getUserSessions(req, res);
  }),

  /**
   * Gets user-specific statistics
   */
  getUserStats: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.getUserStats(req, res);
  }),

  /**
   * Gets dashboard statistics
   */
  getDashboardStats: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.getDashboardStats(req, res);
  })
};