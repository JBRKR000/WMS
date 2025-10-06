import type { FC } from "react";
import { useState } from "react";
import UserRegistration from "../../../../components/MainComponents/SettingsComponents/UserRegistration";
import { UserService } from "../../../../services/userService";

interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

const UsersPage: FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');

  const handleRegisterUser = async (userData: RegisterRequest) => {
    await UserService.registerUser(userData);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-main mb-2">
          Zarządzanie użytkownikami
        </h1>
        <p className="text-secondary">
          Przeglądaj i zarządzaj kontami użytkowników systemu
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-surface-secondary rounded-xl p-1 mb-8 w-fit">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
            activeTab === 'list'
              ? 'bg-primary text-white shadow-lg'
              : 'text-secondary hover:text-main hover:bg-surface-hover'
          }`}
        >
          Lista użytkowników
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
            activeTab === 'add'
              ? 'bg-primary text-white shadow-lg'
              : 'text-secondary hover:text-main hover:bg-surface-hover'
          }`}
        >
          Dodaj użytkownika
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'list' && (
          <div className="bg-surface border border-main rounded-2xl p-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-main mb-2">
                Lista użytkowników
              </h3>
              <p className="text-secondary mb-6">
                Tutaj będzie wyświetlana lista wszystkich użytkowników systemu
              </p>
              <div className="text-sm text-muted">
                🚧 Funkcjonalność w przygotowaniu
              </div>
            </div>
          </div>
        )}

        {activeTab === 'add' && (
          <UserRegistration onRegister={handleRegisterUser} />
        )}
      </div>
    </div>
  );
};

export default UsersPage;