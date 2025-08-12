import { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#cbe552] to-[#edf7f5] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-[#95b54c]/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📧</span>
          </div>
          <h2 className="text-2xl font-bold text-[#3e5586] mb-2">Email enviado</h2>
          <p className="text-[#607123] mb-4">
            Hemos enviado un enlace de recuperación a <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-600 mb-8">
            Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-medium text-white bg-[#5da8a0] hover:bg-[#3e5586] transition-all"
          >
            Volver al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#cbe552] to-[#edf7f5] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#3e5586]">¿Olvidaste tu contraseña?</h2>
          <p className="mt-2 text-sm text-[#607123]">
            Ingresa tu email y te enviaremos un enlace para recuperarla
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-[#607123] mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#95b54c] focus:border-transparent transition-colors"
              placeholder="tu@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-[#3e5586] hover:bg-[#5da8a0] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-[#5da8a0]"

          >
            {loading ? (
              <div className="flex justify-center items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Enviando...
              </div>
            ) : (
              'Enviar enlace de recuperación'
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link
            to="/login"
            className="text-sm text-[#3e5586] hover:underline"
          >
            ← Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
