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
    <div className="max-w-2xl mx-auto">
      <div className="bg-surface border border-main rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-main mb-2">
            Dodaj nowego użytkownika
          </h2>
          <p className="text-secondary">
            Wypełnij formularz, aby utworzyć nowe konto użytkownika
          </p>
        </div>

        {/* Error/Success messages */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error-bg border border-red-400/50 text-error-text">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-success-bg border border-emerald-400/50 text-success-text">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username and Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-main mb-2">
                Nazwa użytkownika
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Wprowadź nazwę użytkownika"
                className="w-full px-4 py-3 bg-surface-secondary border border-main rounded-xl text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-main mb-2">
                Hasło
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Wprowadź hasło"
                className="w-full px-4 py-3 bg-surface-secondary border border-main rounded-xl text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-main mb-2">
              Adres e-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Wprowadź adres e-mail"
              className="w-full px-4 py-3 bg-surface-secondary border border-main rounded-xl text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
            />
          </div>

          {/* First Name and Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold text-main mb-2">
                Imię
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Wprowadź imię"
                className="w-full px-4 py-3 bg-surface-secondary border border-main rounded-xl text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold text-main mb-2">
                Nazwisko
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Wprowadź nazwisko"
                className="w-full px-4 py-3 bg-surface-secondary border border-main rounded-xl text-main placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-main mb-2">
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
                className="w-full px-4 py-3 bg-surface-secondary border border-main rounded-xl text-main focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 text-left flex justify-between items-center"
              >
                <span>{selectedRoleLabel || "Wybierz rolę"}</span>
                <svg 
                  className={`w-5 h-5 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {isRoleDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-main rounded-xl shadow-xl z-50 overflow-hidden">
                  {roles.map((roleOption) => (
                    <div
                      key={roleOption.value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleRoleSelect(roleOption.value);
                      }}
                      className={`w-full px-4 py-3 text-left transition-all duration-200 hover:bg-surface-hover cursor-pointer select-none ${
                        role === roleOption.value 
                          ? 'bg-primary/10 text-primary font-semibold' 
                          : 'text-main hover:text-primary'
                      }`}
                    >
                      {roleOption.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Tworzenie użytkownika...
                </div>
              ) : (
                "Utwórz użytkownika"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserRegistration;