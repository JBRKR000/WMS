import { useState } from "react";
import DarkLightSwitch from "../../components/HeaderComponents/DarkLightSwitch";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-accent)] via-[var(--color-surface)] to-[var(--color-primary)] dark:from-[var(--color-surface-secondary)] dark:via-[var(--color-surface)] dark:to-[var(--color-primary)] relative">
      <div className="absolute top-6 right-6 z-10">
        <DarkLightSwitch />
      </div>
      <div className="w-full max-w-md bg-[var(--color-surface)] dark:bg-[var(--color-surface-secondary)] rounded-2xl shadow-2xl p-8 flex flex-col gap-6 border border-[var(--color-border)]">
        <div className="flex justify-center mb-2">
          <span className="text-3xl font-bold text-[var(--color-primary)] dark:text-[var(--color-primary)] tracking-tight">
            {mode === "login" ? "Zaloguj się" : "Załóż konto"}
          </span>
        </div>
        <div className="flex justify-center gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              mode === "login"
                ? "bg-[var(--color-primary)] text-white shadow"
                : "bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
            }`}
            onClick={() => setMode("login")}
            type="button"
          >
            Logowanie
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              mode === "register"
                ? "bg-[var(--color-primary)] text-white shadow"
                : "bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
            }`}
            onClick={() => setMode("register")}
            type="button"
          >
            Rejestracja
          </button>
        </div>
        <form className="flex flex-col gap-4">
          {mode === "register" && (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Imię"
                  className="w-1/2 px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] dark:bg-[var(--color-surface-hover)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  autoComplete="given-name"
                  required
                />
                <input
                  type="text"
                  placeholder="Nazwisko"
                  className="w-1/2 px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] dark:bg-[var(--color-surface-hover)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  autoComplete="family-name"
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Nazwa użytkownika"
                className="px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] dark:bg-[var(--color-surface-hover)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                autoComplete="username"
                required
              />
              <input
                type="email"
                placeholder="E-mail"
                className="px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] dark:bg-[var(--color-surface-hover)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                autoComplete="email"
                required
              />
              <input
                type="password"
                placeholder="Hasło"
                className="px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] dark:bg-[var(--color-surface-hover)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                autoComplete="new-password"
                required
              />
            </>
          )}
          {mode === "login" && (
            <>
              <input
                type="text"
                placeholder="Nazwa użytkownika"
                className="px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] dark:bg-[var(--color-surface-hover)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                autoComplete="username"
                required
              />
              <input
                type="password"
                placeholder="Hasło"
                className="px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] dark:bg-[var(--color-surface-hover)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                autoComplete="current-password"
                required
              />
            </>
          )}
          <button
            type="submit"
            className="w-full mt-2 py-3 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-lg shadow hover:bg-[var(--color-primary-hover)] transition"
          >
            {mode === "login" ? "Zaloguj się" : "Zarejestruj się"}
          </button>
        </form>
        {mode === "login" && (
          <div className="text-center text-sm text-[var(--color-primary)] opacity-80">
            Nie masz konta?{" "}
            <button
              className="underline hover:text-[var(--color-primary-hover)]"
              onClick={() => setMode("register")}
              type="button"
            >
              Zarejestruj się
            </button>
          </div>
        )}
        {mode === "register" && (
          <div className="text-center text-sm text-[var(--color-primary)] opacity-80">
            Masz już konto?{" "}
            <button
              className="underline hover:text-[var(--color-primary-hover)]"
              onClick={() => setMode("login")}
              type="button"
            >
              Zaloguj się
            </button>
          </div>
        )}
      </div>
    </div>
  );
}