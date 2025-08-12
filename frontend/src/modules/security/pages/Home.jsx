import { FaShieldAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import AuthLayout from "../components/AuthLayout";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <AuthLayout className="bg-gray-50">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div
              className="inline-flex p-6 rounded-full mb-6"
              style={{ backgroundColor: "#e8f5f3" }}
            >
              <FaShieldAlt className="w-16 h-16" style={{ color: "#3e5866" }} />
            </div>
            <h1
              className="text-5xl font-bold mb-4"
              style={{ color: "#3e5866" }}
            >
              Bienvenido a SecureAuth
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {/* Botón Iniciar Sesión */}
            <button
              onClick={() => navigate("/login")}
              className="backdrop-blur-md bg-white/30 border border-blue-200 shadow-2xl rounded-2xl px-10 py-6 flex items-center justify-center space-x-4 text-xl font-bold text-blue-900 hover:bg-white/60 hover:shadow-blue-200 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 cursor-pointer"
              style={{ minWidth: 220 }}
            >
              <span>Iniciar Sesión</span>
            </button>
            {/* Botón Registrarse */}
            <button
              onClick={() => navigate("/register")}
              className="backdrop-blur-md bg-white/30 border border-teal-200 shadow-2xl rounded-2xl px-10 py-6 flex items-center justify-center space-x-4 text-xl font-bold text-teal-900 hover:bg-white/60 hover:shadow-teal-200 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-teal-200 cursor-pointer"
              style={{ minWidth: 220 }}
            >
              <span>Registrarse</span>
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
