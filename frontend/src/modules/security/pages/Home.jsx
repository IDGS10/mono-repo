import { FaShieldAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <AuthLayout className="bg-[#eaf9df]">
      <div className="min-h-screen bg-gradient-to-br from-[#cbe552] to-[#edf7f5] flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div
              className="inline-flex p-6 rounded-full mb-6 shadow"
              style={{ backgroundColor: "#3e5586" }}
            >
              <FaShieldAlt className="w-16 h-16 text-white" />
            </div>
            <h1
              className="text-5xl font-bold mb-4"
              style={{ color: "#3e5586" }}
            >
              Bienvenido a SecureAuth
            </h1>
            <p className="text-[#607123] text-lg">
              Tu plataforma segura y confiable
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {/* Botón Iniciar Sesión - ACCESIBLE */}
            <button
              onClick={() => navigate("/login")}
              className="bg-[#3e5586] hover:bg-[#5da8a0] text-white font-semibold text-xl px-10 py-5 rounded-2xl shadow-md transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#95b54c]"
              style={{ minWidth: 220 }}
            >
              Iniciar Sesión
            </button>

            {/* Botón Registrarse - ACCESIBLE */}
            <button
              onClick={() => navigate("/register")}
              className="bg-[#3e5586] hover:bg-[#5da8a0] text-white font-semibold text-xl px-10 py-5 rounded-2xl shadow-md transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#5da8a0]"
              style={{ minWidth: 220 }}
            >
              Registrarse
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
