import React, { useState } from "react";

interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface UserRegistrationProps {
  onRegister: (userData: RegisterRequest) => Promise<void>;
}

const UserRegistration: React.FC<UserRegistrationProps> = ({ onRegister }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("ROLE_WAREHOUSE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const roles = [
    { value: "ROLE_WAREHOUSE", label: "Pracownik Magazynu" },
    { value: "ROLE_PRODUCTION", label: "Pracownik Produkcji" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onRegister({
        username,
        password,
        email,
        firstName,
        lastName,
        role
      });
      
      setSuccess("Użytkownik został pomyślnie utworzony!");
      
      // Reset form
      setUsername("");
      setPassword("");
      setEmail("");
      setFirstName("");
      setLastName("");
      setRole("ROLE_WAREHOUSE");
      setIsRoleDropdownOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas tworzenia użytkownika");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (roleValue: string) => {
    setRole(roleValue);
    setIsRoleDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsRoleDropdownOpen(!isRoleDropdownOpen);
  };

  const selectedRoleLabel = roles.find(r => r.value === role)?.label || "";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Gradient Header */}
      <div className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 p-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-main mb-1">
              Nowy użytkownik
            </h2>
            <p className="text-secondary">
              Utwórz nowe konto dla pracownika magazynu lub produkcji
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-main rounded-2xl shadow-lg p-8">

        {/* Error/Success messages */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/30 text-error flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/30 text-success flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Credentials */}
          <div>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />
              </svg>
              Dane dostępu
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-secondary rounded-xl p-6 border border-border">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-main mb-2 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0"></span>
                  Nazwa użytkownika
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="john_doe"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-main mb-2 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0"></span>
                  Hasło
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Informacje kontaktowe
            </h3>
            <div className="space-y-4 bg-surface-secondary rounded-xl p-6 border border-border">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-main mb-2 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0"></span>
                  Adres e-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@company.com"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Personal Info */}
          <div>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Dane osobowe
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-secondary rounded-xl p-6 border border-border">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-main mb-2 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0"></span>
                  Imię
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-main mb-2 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0"></span>
                  Nazwisko
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Role Assignment */}
          <div>
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zm-2-5a.75.75 0 100-1.5.75.75 0 000 1.5zM5 12a2 2 0 110-4 2 2 0 010 4zM5.256 16a4.972 4.972 0 01.568-1.44H5a2 2 0 00-2 2v1a6 6 0 003.956-5.5zM16.75 12a.75.75 0 100-1.5.75.75 0 000 1.5zM1 14s1.5 1 4 1 4-1 4-1V9a6 6 0 00-8 5.6z" />
              </svg>
              Przypisanie roli
            </h3>
            <div className="bg-surface-secondary rounded-xl p-6 border border-border">
              <label className="block text-sm font-semibold text-main mb-4 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0"></span>
                Rola użytkownika
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleDropdown}
                  onBlur={(e) => {
                    setTimeout(() => {
                      if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) {
                        setIsRoleDropdownOpen(false);
                      }
                    }, 150);
                  }}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-main focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 text-left flex justify-between items-center hover:border-primary"
                >
                  <span className="font-medium">{selectedRoleLabel || "Wybierz rolę"}</span>
                  <svg 
                    className={`w-5 h-5 text-primary transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {isRoleDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                    {roles.map((roleOption) => (
                      <div
                        key={roleOption.value}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleRoleSelect(roleOption.value);
                        }}
                        className={`w-full px-4 py-3 text-left transition-all duration-200 hover:bg-surface-hover cursor-pointer select-none flex items-center gap-3 ${
                          role === roleOption.value 
                            ? 'bg-primary/10 text-primary font-semibold' 
                            : 'text-main hover:text-primary'
                        }`}
                      >
                        {role === roleOption.value && (
                          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {roleOption.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-border">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl text-white rounded-lg font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Tworzenie użytkownika...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Utwórz użytkownika
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserRegistration;