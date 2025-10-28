import type { FC } from "react";
import { useState, useEffect } from "react";
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

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

const roles = [
  { value: "ROLE_ADMIN", label: "Administrator" },
  { value: "ROLE_WAREHOUSE", label: "Pracownik Magazynu" },
  { value: "ROLE_PRODUCTION", label: "Pracownik Produkcji" },
];

const UsersPage: FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState<PageResponse<User> | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<{ role: string; username: string; email: string; firstName: string; lastName: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchUsers();
    }
  }, [activeTab, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await UserService.getAllUsersPaginated(page, 10);
      setPageData(data);
      setUsers(data.content);
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd przy pobieraniu użytkowników' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterUser = async (userData: RegisterRequest) => {
    await UserService.registerUser(userData);
    setActiveTab('list');
    await fetchUsers();
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;

    try {
      await UserService.deleteUser(id);
      setMessage({ type: 'success', text: 'Użytkownik usunięty' });
      await fetchUsers();
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd przy usuwaniu użytkownika' });
    }
  };

  const handleUpdateUserData = async (id: number) => {
    if (!editingData) return;
    try {
      await UserService.updateUserData(id, {
        username: editingData.username,
        email: editingData.email,
        firstName: editingData.firstName,
        lastName: editingData.lastName,
      });
      
      const currentUser = users.find(u => u.id === id);
      if (currentUser && editingData.role !== currentUser.role) {
        await UserService.updateUserRole(id, editingData.role);
      }
      
      setMessage({ type: 'success', text: 'Dane użytkownika zaktualizowane' });
      setEditingId(null);
      setEditingData(null);
      await fetchUsers();
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd przy aktualizacji' });
      console.error(error);
    }
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setEditingData({
      role: user.role,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
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

      {/* Messages */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-success/10 border-success/30 text-success'
            : 'bg-error/10 border-error/30 text-error'
        }`}>
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            {message.type === 'success' ? (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            )}
          </svg>
          <span>{message.text}</span>
        </div>
      )}

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
          <div className="bg-surface border border-main rounded-2xl overflow-hidden shadow-lg">
            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-secondary border-b border-main">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-main">Użytkownik</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-main">E-mail</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-main">Imię i nazwisko</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-main">Rola</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-main">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-secondary">
                        Brak użytkowników do wyświetlenia
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const isSystemUser = user.username === 'system';
                      return (
                      <tr key={user.id} className={`border-b border-main transition-colors ${isSystemUser ? 'bg-surface-secondary/50 opacity-60' : 'hover:bg-surface-secondary'}`}>
                        <td className="px-6 py-4">
                          {editingId === user.id && !isSystemUser ? (
                            <input
                              type="text"
                              value={editingData?.username || ''}
                              onChange={(e) => editingData && setEditingData({ ...editingData, username: e.target.value })}
                              className="px-3 py-2 bg-surface border border-border rounded-lg text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full"
                            />
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm ${
                                isSystemUser
                                  ? 'bg-gray-400'
                                  : 'bg-gradient-to-br from-primary to-primary/70'
                              }`}>
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-medium text-main">{user.username}</span>
                                {isSystemUser && (
                                  <span className="ml-2 text-xs bg-warning/20 text-warning px-2 py-1 rounded">System</span>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingId === user.id && !isSystemUser ? (
                            <input
                              type="email"
                              value={editingData?.email || ''}
                              onChange={(e) => editingData && setEditingData({ ...editingData, email: e.target.value })}
                              className="px-3 py-2 bg-surface border border-border rounded-lg text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full"
                            />
                          ) : (
                            <span className="text-secondary text-sm">{user.email}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingId === user.id && !isSystemUser ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingData?.firstName || ''}
                                onChange={(e) => editingData && setEditingData({ ...editingData, firstName: e.target.value })}
                                placeholder="Imię"
                                className="px-3 py-2 bg-surface border border-border rounded-lg text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 flex-1"
                              />
                              <input
                                type="text"
                                value={editingData?.lastName || ''}
                                onChange={(e) => editingData && setEditingData({ ...editingData, lastName: e.target.value })}
                                placeholder="Nazwisko"
                                className="px-3 py-2 bg-surface border border-border rounded-lg text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 flex-1"
                              />
                            </div>
                          ) : (
                            <span className="text-main">{user.firstName} {user.lastName}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingId === user.id && !isSystemUser ? (
                            <select
                              value={editingData?.role || ''}
                              onChange={(e) => editingData && setEditingData({ ...editingData, role: e.target.value })}
                              className="px-3 py-2 bg-surface border border-border rounded-lg text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                              {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                              {roles.find(r => r.value === user.role)?.label || user.role}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!isSystemUser ? (
                            <div className="flex items-center justify-end gap-2">
                              {editingId === user.id ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateUserData(user.id)}
                                    className="px-3 py-2 bg-success text-white rounded-lg text-sm font-medium hover:shadow-md transition-all duration-200"
                                    title="Zapisz"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="px-3 py-2 bg-warning text-white rounded-lg text-sm font-medium hover:shadow-md transition-all duration-200"
                                    title="Anuluj"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEdit(user)}
                                    className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-all duration-200"
                                    title="Edytuj"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="px-3 py-2 bg-error/10 text-error rounded-lg text-sm font-medium hover:bg-error/20 transition-all duration-200"
                                    title="Usuń użytkownika"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted">Wbudowany</span>
                          )}
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pageData && pageData.totalPages > 1 && (
              <div className="px-6 py-4 bg-surface-secondary border-t border-main flex items-center justify-between">
                <div className="text-sm text-secondary">
                  Strona {pageData.pageNumber + 1} z {pageData.totalPages} • Razem: {pageData.totalElements} użytkowników
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={pageData.isFirst || loading}
                    className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/20 transition-all"
                  >
                    ← Poprzednia
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={pageData.isLast || loading}
                    className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/20 transition-all"
                  >
                    Następna →
                  </button>
                </div>
              </div>
            )}
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