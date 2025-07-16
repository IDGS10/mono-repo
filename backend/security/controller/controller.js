// controller/controller.js
// Controlador mejorado que actúa como un verdadero controlador MVC
// Orquesta las llamadas entre rutas y modelo

const FacialAuthModel = require("../model/model");
const ResponseUtils = require("../utils/responseUtils");

module.exports = {
  /**
   * Verifica el estado de salud del servidor
   */
  checkHealth: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.checkHealth(req, res);
  }),

  /**
   * Registra un nuevo usuario
   */
  registerUser: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.register(req, res);
  }),

  /**
   * Inicia sesión de usuario
   */
  loginSession: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.login(req, res);
  }),

  /**
   * Cierra sesión de usuario
   */
  logoutSession: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.logout(req, res);
  }),

  /**
   * Obtiene el perfil del usuario autenticado
   */
  getUserProfile: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.getUserProfile(req, res);
  }),

  /**
   * Actualiza el perfil del usuario autenticado
   */
  updateUserProfile: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.updateUserProfile(req, res);
  }),

  /**
   * Obtiene el historial de sesiones del usuario
   */
  getUserSessions: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.getUserSessions(req, res);
  }),

  /**
   * Obtiene estadísticas específicas del usuario
   */
  getUserStats: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.getUserStats(req, res);
  }),

  /**
   * Obtiene estadísticas del dashboard
   */
  getDashboardStats: ResponseUtils.asyncHandler(async (req, res) => {
    return FacialAuthModel.getDashboardStats(req, res);
  })
};