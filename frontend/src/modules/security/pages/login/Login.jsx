import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaLock,
  FaEnvelope,
  FaSignInAlt,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";

import AuthLayout from "../../components/AuthLayout";
import ApiService from "../../services/ApiService";

export default function PasswordLogin() {
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await ApiService.loginCredentials(
        loginData.email,
        loginData.password
      );

      if (response.success && response.token) {
        localStorage.setItem("isLoggedIn", "true");

        // Guardar los datos completos del usuario y token
        const userData = {
          token: response.token,
          user: response.user // Almacenar el objeto completo del usuario
        };
        localStorage.setItem("monoRepoUserData", JSON.stringify(userData));

        //Redirigir al dashboard o página principal
        navigate("/analytics");
      } else {
        setError(response.error || "Error en el inicio de sesión");
      }
    } catch (error) {
      console.error("Error en login:", error);
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (error) setError("");
    setLoginData({ ...loginData, [field]: value });
  };

  return (
    <AuthLayout className="bg-[#eaf9df]">
      <div className="min-h-screen py-8 px-4 flex items-center justify-center bg-gradient-to-br from-[#cbe552] to-[#edf7f5]">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#3e5586]">
              Iniciar con Contraseña
            </h2>
            <p className="text-[#3e5586] mt-2">
              Accede a tu cuenta del dashboard
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-xl border border-[#95b54c] p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
                  <FaExclamationTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#607123] mb-2">
                  Correo Electrónico
                </label>
                <div className="relative flex items-center">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#95b54c]" />
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 w-full px-4 py-3 border rounded-lg border-gray-300 focus:ring-2 focus:ring-[#95b54c] focus:border-transparent transition-colors placeholder-gray-400"
                    placeholder="usuario@ejemplo.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#607123] mb-2">
                  Contraseña
                </label>
                <div className="relative flex items-center">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#95b54c]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-10 w-full px-4 py-3 border rounded-lg border-gray-300 focus:ring-2 focus:ring-[#95b54c] focus:border-transparent transition-colors placeholder-gray-400"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#95b54c] hover:text-[#3e5586] transition-colors"
                  >
                    {showPassword ? (
                      <FaEyeSlash className="w-5 h-5" />
                    ) : (
                      <FaEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#3e5586] text-white font-semibold rounded-2xl shadow-lg hover:bg-[#5da8a0] transition-all duration-200 px-8 py-4 flex items-center justify-center space-x-3 w-full disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[#5da8a0]"

              >
                {isLoading ? (
                  <>
                    <FaSpinner className="w-5 h-5 animate-spin" />
                    <span>Iniciando...</span>
                  </>
                ) : (
                  <>
                    <FaSignInAlt className="w-5 h-5" />
                    <span>Iniciar Sesión</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <Link
                to="/forgot-password"
                className="text-sm text-[#3e5586] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
              <div className="text-sm text-gray-700">
                ¿No tienes cuenta?{" "}
                <Link
                  to="/register"
                  className="text-[#3e5586] font-semibold hover:underline"
                >
                  Regístrate aquí
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
