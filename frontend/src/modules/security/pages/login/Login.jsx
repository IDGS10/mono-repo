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

  //Estado interno del formulario
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await ApiService.loginCredentials(
        formData.email,
        formData.password
      );

      if (response.success && response.userToken) {
        //Guardamos el estado de login para verificación de la sesión
        localStorage.setItem("isLoggedIn", "true");
        //JWT del usuario
        localStorage.setItem("monoRepoUserData", response.userToken);
        //Redirigir al dashboard
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
    //Quitamos el error cuando el usuario empiece a escribir
    if (error) setError("");

    const newData = {
      ...loginData,
      [field]: value,
    };

    setLoginData(newData);
  };

  return (
    <AuthLayout className="bg-gray-50">
      <div className="min-h-screen py-8 px-4 flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#3e5866]">
              Iniciar con Contraseña
            </h2>
            <p className="text-gray-600 mt-2">
              Accede a tu cuenta del dashboard
            </p>
          </div>

          <div className="bg-white  rounded-xl shadow-lg border border-gray-200 p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
                  <FaExclamationTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative flex items-center">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300 hover:border-gray-400 placeholder-gray-400"
                    placeholder="usuario@ejemplo.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative flex items-center">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="pl-10 pr-10 w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300 hover:border-gray-400 placeholder-gray-400"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                className="bg-blue-600/90 text-white font-semibold rounded-2xl shadow-md hover:bg-blue-700 transition-all duration-200 px-8 py-4 flex items-center justify-center space-x-3 w-full disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800"
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

            {/* Links adicionales */}
            <div className="mt-6 text-center space-y-2">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                ¿No tienes cuenta?{" "}
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-500 transition-colors"
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
