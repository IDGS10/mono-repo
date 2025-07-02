import { FaShieldAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Componente Header
function Header() {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo y título */}
          <div className="flex items-center space-x-3">
            <button
              className="bg-gradient-to-br from-blue-900 to-blue-800 p-2 rounded-lg hover:from-blue-800 hover:to-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
              onClick={() => navigate("/home")}
              aria-label="Ir a inicio"
              type="button"
            >
              <FaShieldAlt className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-[#3e5866]">
                Mono Repo
              </h1>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Layout principal
export default function AuthLayout({
  children,
  showHeader = true,
  className = "",
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header condicional */}
      {showHeader && <Header />}

      {/* Contenido principal */}
      <main
        className={`${
          showHeader ? "min-h-[calc(100vh-80px)]" : "min-h-screen"
        } ${className}`}
      >
        {children}
      </main>
    </div>
  );
}
