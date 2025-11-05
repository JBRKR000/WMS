import type { FC } from "react";
import { useState, useEffect } from "react";
import { LocationService, type Location, type LocationThreshold, type LocationOccupancy } from "../../../../services/locationService";

interface LocationWithThreshold extends Location {
  threshold?: LocationThreshold;
  occupancy?: LocationOccupancy;
}

const LocationSettingsPage: FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [locations, setLocations] = useState<LocationWithThreshold[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<Location> | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: '',
    minThreshold: 1,
    maxThreshold: 100,
  });

  useEffect(() => {
    if (activeTab === 'list') {
      fetchLocations();
    }
    fetchItems();
  }, [activeTab]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await LocationService.getAll();
      const locationsWithData = await Promise.all(
        data.map(async (location) => {
          try {
            const occupancy = await LocationService.getOccupancy(location.id);
            return { ...location, occupancy };
          } catch {
            return location;
          }
        })
      );
      
      setLocations(locationsWithData);
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd przy pobieraniu lokacji' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      // Items fetch - na razie pominięty, ale można dodać gdy będzie potrzebny
      // Tutaj można dodać logikę do pobierania itemów jeśli będzie potrzebna
    } catch (error) {
      console.error('Błąd przy pobieraniu itemów:', error);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name || !formData.type) {
      setMessage({ type: 'error', text: 'Wypełnij wymagane pola' });
      return;
    }

    try {
      setLoading(true);
      
      // Utwórz lokację
      const newLocation = await LocationService.create({
        code: formData.code,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        active: true,
      });

      // Utwórz threshold
      if (formData.maxThreshold > 0) {
        await LocationService.createThreshold({
          locationId: newLocation.id,
          minThreshold: formData.minThreshold,
          maxThreshold: formData.maxThreshold,
        });
      }

      setMessage({ type: 'success', text: 'Lokacja dodana pomyślnie' });
      setFormData({ code: '', name: '', description: '', type: '', minThreshold: 1, maxThreshold: 100 });
      setActiveTab('list');
      await fetchLocations();
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd przy dodawaniu lokacji' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async (id: number) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę lokację?')) return;

    try {
      setLoading(true);
      await LocationService.delete(id);
      setMessage({ type: 'success', text: 'Lokacja usunięta' });
      await fetchLocations();
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd przy usuwaniu lokacji' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async (id: number) => {
    if (!editingData) return;
    
    try {
      setLoading(true);
      await LocationService.update(id, editingData);
      setMessage({ type: 'success', text: 'Lokacja zaktualizowana' });
      setEditingId(null);
      setEditingData(null);
      await fetchLocations();
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd przy aktualizacji' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (location: Location) => {
    setEditingId(location.id);
    setEditingData({
      code: location.code,
      name: location.name,
      description: location.description,
      type: location.type,
      active: location.active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-error/20 text-error';
    if (percentage >= 70) return 'bg-warning/20 text-warning';
    return 'bg-success/20 text-success';
  };

  const getOccupancyBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-error';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-main mb-2">
          Zarządzanie lokacjami
        </h1>
        <p className="text-secondary">
          Przeglądaj i zarządzaj lokacjami magazynu
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
          Lista lokacji
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
            activeTab === 'add'
              ? 'bg-primary text-white shadow-lg'
              : 'text-secondary hover:text-main hover:bg-surface-hover'
          }`}
        >
          Dodaj lokację
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-main">Kod</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-main">Nazwa</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-main">Typ</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-main">Obłożenie</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-main">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-main">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        </div>
                      </td>
                    </tr>
                  ) : locations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-secondary">
                        Brak lokacji do wyświetlenia
                      </td>
                    </tr>
                  ) : (
                    locations.map((location) => (
                      <tr key={location.id} className="border-b border-main hover:bg-surface-secondary transition-colors">
                        <td className="px-6 py-4">
                          {editingId === location.id ? (
                            <input
                              type="text"
                              value={editingData?.code || ''}
                              onChange={(e) => editingData && setEditingData({ ...editingData, code: e.target.value })}
                              className="px-3 py-2 bg-surface border border-border rounded-lg text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                          ) : (
                            <span className="font-mono font-semibold text-primary">{location.code}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingId === location.id ? (
                            <input
                              type="text"
                              value={editingData?.name || ''}
                              onChange={(e) => editingData && setEditingData({ ...editingData, name: e.target.value })}
                              className="px-3 py-2 bg-surface border border-border rounded-lg text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full"
                            />
                          ) : (
                            <span className="text-main font-medium">{location.name}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingId === location.id ? (
                            <input
                              type="text"
                              value={editingData?.type || ''}
                              onChange={(e) => editingData && setEditingData({ ...editingData, type: e.target.value })}
                              className="px-3 py-2 bg-surface border border-border rounded-lg text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                          ) : (
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm">{location.type}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {location.occupancy ? (
                            <div className="space-y-2">
                              <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full transition-all ${getOccupancyBarColor(location.occupancy.occupancyPercentage)}`}
                                  style={{ width: `${Math.min(location.occupancy.occupancyPercentage, 100)}%` }}
                                />
                              </div>
                              <div className={`text-xs font-semibold ${getOccupancyColor(location.occupancy.occupancyPercentage)}`}>
                                {location.occupancy.occupancyPercentage.toFixed(1)}% ({location.occupancy.currentOccupancy}/{location.occupancy.maxCapacity})
                              </div>
                            </div>
                          ) : (
                            <span className="text-secondary text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${location.active ? 'bg-success' : 'bg-warning'}`}></div>
                            <span className={`text-sm font-medium ${location.active ? 'text-success' : 'text-warning'}`}>
                              {location.active ? 'Aktywna' : 'Nieaktywna'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {editingId === location.id ? (
                              <>
                                <button
                                  onClick={() => handleUpdateLocation(location.id)}
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
                                  onClick={() => startEdit(location)}
                                  className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-all duration-200"
                                  title="Edytuj"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteLocation(location.id)}
                                  className="px-3 py-2 bg-error/10 text-error rounded-lg text-sm font-medium hover:bg-error/20 transition-all duration-200"
                                  title="Usuń lokację"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'add' && (
          <div className="bg-surface border border-main rounded-2xl shadow-lg overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-primary to-accent p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Dodaj nową lokację</h2>
                  <p className="text-white/80 text-sm">Utwórz nową lokację w magazynie</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAddLocation} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Code */}
                <div>
                  <label className="block text-sm font-semibold text-main mb-3">
                    Kod lokacji *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="np. A1-S1-R3"
                    className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-lg text-main focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-secondary mt-1">Unikalny identyfikator lokacji</p>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-main mb-3">
                    Nazwa lokacji *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="np. Sektor A, Półka 1, Rząd 3"
                    className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-lg text-main focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                    required
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-semibold text-main mb-3">
                    Typ lokacji *
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="np. SECTOR, SHELF, BIN"
                    className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-lg text-main focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-main mb-3">
                    Opis (opcjonalnie)
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Dodatkowy opis lokacji"
                    className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-lg text-main focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Thresholds */}
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-main mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 100 2H4v9a2 2 0 002 2h8a2 2 0 002-2V7h2a1 1 0 100-2 2 2 0 00-2-2H4z" clipRule="evenodd" />
                  </svg>
                  Progi pojemności
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  {/* Min Threshold */}
                  <div>
                    <label className="block text-sm font-semibold text-main mb-3">
                      Minimalna pojemność
                    </label>
                    <input
                      type="number"
                      value={formData.minThreshold}
                      onChange={(e) => setFormData({ ...formData, minThreshold: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-lg text-main focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                    />
                    <p className="text-xs text-secondary mt-1">Alert gdy poniżej tej ilości</p>
                  </div>

                  {/* Max Threshold */}
                  <div>
                    <label className="block text-sm font-semibold text-main mb-3">
                      Maksymalna pojemność
                    </label>
                    <input
                      type="number"
                      value={formData.maxThreshold}
                      onChange={(e) => setFormData({ ...formData, maxThreshold: parseInt(e.target.value) || 0 })}
                      min="1"
                      className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-lg text-main focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
                    />
                    <p className="text-xs text-secondary mt-1">Maksymalna liczba itemów</p>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-accent/10 border border-accent rounded-xl p-4">
                <h4 className="text-accent font-semibold text-sm mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0zM8 8a1 1 0 000 2h6a1 1 0 000-2H8zm1 5a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                  </svg>
                  Informacja
                </h4>
                <p className="text-secondary text-sm">
                  Każda lokacja powinna mieć unikalny kod i opisywać konkretne miejsce w magazynie. Progi pojemności pomagają w monitorowaniu obłożenia.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Dodawanie...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Dodaj lokację
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-6 py-3 bg-surface-secondary text-main border border-border rounded-lg font-semibold hover:bg-surface-hover transition-all duration-200"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSettingsPage;
