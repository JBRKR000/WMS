import React, { useState } from "react";
import { useAuth } from "../../utils/AuthContext";

const Auth: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-emerald-500 via-sky-500 to-emerald-600 dark:from-emerald-600 dark:via-sky-600 dark:to-emerald-700">
      {/* Static background elements - bez animacji */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-400/20 dark:bg-sky-500/10 rounded-full mix-blend-multiply filter blur-xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full mix-blend-multiply filter blur-xl"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-sky-300/20 dark:bg-sky-600/10 rounded-full mix-blend-multiply filter blur-xl"></div>
      </div>

      {/* Main container */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        {/* Glass card */}
        <div className="backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border border-white/30 dark:border-gray-700/30 rounded-3xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white dark:text-gray-50 mb-2 tracking-tight">
              Witaj ponownie
            </h1>
            <p className="text-white/80 dark:text-gray-300 text-lg">
              Zaloguj się do swojego konta
            </p>
          </div>



          {/* Error message */}
          {error && (
            <div className={`mb-6 p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
              error.includes("sukcesem")
                ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-100"
                : "bg-red-500/20 border-red-400/50 text-red-100"
            }`}>
              {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Login fields */}
            <div className="grid grid-cols-1 gap-4">
              <div className="group">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nazwa użytkownika"
                  className="w-full px-6 py-4 bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 rounded-2xl text-white dark:text-gray-100 placeholder-white/60 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 dark:focus:ring-emerald-500/50 focus:border-emerald-400/50 dark:focus:border-emerald-500/50 transition-all duration-300 hover:bg-white/25 dark:hover:bg-gray-700/30 focus:scale-105"
                />
              </div>

              <div className="group">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Hasło"
                  className="w-full px-6 py-4 bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm border border-white/30 dark:border-gray-600/30 rounded-2xl text-white dark:text-gray-100 placeholder-white/60 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 dark:focus:ring-emerald-500/50 focus:border-emerald-400/50 dark:focus:border-emerald-500/50 transition-all duration-300 hover:bg-white/25 dark:hover:bg-gray-700/30 focus:scale-105"
                />
              </div>
            </div>



            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-2xl font-semibold text-lg shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/50 dark:focus:ring-emerald-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Ładowanie...
                </div>
              ) : (
                "Zaloguj się"
              )}
            </button>


          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;