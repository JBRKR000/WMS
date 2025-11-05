
import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { fetchApi } from '../../../../utils/api';

interface ScheduleConfig {
  id: number;
  configKey: string;
  cronExpression: string;
  description: string;
  enabled: boolean;
}

interface ScheduleSettings {
  type: 'daily' | 'weekly' | 'custom';
  dayOfWeek?: string;
  hour: number;
  minute: number;
}

const QR: FC = () => {
  const [config, setConfig] = useState<ScheduleConfig | null>(null);
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    type: 'weekly',
    dayOfWeek: 'MON',
    hour: 15,
    minute: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const days = [
    { value: 'MON', label: 'Poniedziałek' },
    { value: 'TUE', label: 'Wtorek' },
    { value: 'WED', label: 'Środa' },
    { value: 'THU', label: 'Czwartek' },
    { value: 'FRI', label: 'Piątek' },
    { value: 'SAT', label: 'Sobota' },
    { value: 'SUN', label: 'Niedziela' },
  ];

  useEffect(() => {
    fetchScheduleConfig();
  }, []);

  const fetchScheduleConfig = async () => {
    try {
      const data = await fetchApi<ScheduleConfig>('/schedule/snapshot-config');
      setConfig(data);
      parseConfigToSettings(data.cronExpression);
    } catch (error) {
      console.error('Błąd pobierania konfiguracji:', error);
    }
  };

  const parseConfigToSettings = (cron: string) => {
    const parts = cron.split(' ');
    if (parts.length >= 5) {
      const minute = parseInt(parts[1]);
      const hour = parseInt(parts[2]);
      const dayOfWeek = parts[4];

      if (parts[3] === '*' && parts[4] !== '?') {
        setScheduleSettings({
          type: 'weekly',
          dayOfWeek,
          hour,
          minute,
        });
      } else if (parts[4] === '?') {
        setScheduleSettings({
          type: 'daily',
          hour,
          minute,
        });
      }
    }
  };

  const generateCronExpression = (settings: ScheduleSettings): string => {
    if (settings.type === 'daily') {
      return `0 ${settings.minute} ${settings.hour} * * ?`;
    } else {
      return `0 ${settings.minute} ${settings.hour} ? * ${settings.dayOfWeek}`;
    }
  };

  const handleUpdateSchedule = async () => {
    const cronExpression = generateCronExpression(scheduleSettings);
    setIsLoading(true);
    try {
      const updated = await fetchApi<ScheduleConfig>(
        `/schedule/snapshot-config?cronExpression=${encodeURIComponent(cronExpression)}`,
        { method: 'PUT' }
      );
      setConfig(updated);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Harmonogram zaktualizowany pomyślnie' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd aktualizacji harmonogramu' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSchedule = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      const updated = await fetchApi<ScheduleConfig>(
        `/schedule/snapshot-config/toggle?enabled=${enabled}`,
        { method: 'PUT' }
      );
      setConfig(updated);
      setMessage({ 
        type: 'success', 
        text: `Harmonogram ${enabled ? 'włączony' : 'wyłączony'}` 
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Błąd aktualizacji stanu harmonogramu' });
    } finally {
      setIsLoading(false);
    }
  };

  const getScheduleDescription = (): string => {
    if (scheduleSettings.type === 'daily') {
      return `Każdego dnia o ${String(scheduleSettings.hour).padStart(2, '0')}:${String(scheduleSettings.minute).padStart(2, '0')}`;
    } else {
      const dayName = days.find(d => d.value === scheduleSettings.dayOfWeek)?.label || 'poniedziałek';
      return `Każdy ${dayName} o ${String(scheduleSettings.hour).padStart(2, '0')}:${String(scheduleSettings.minute).padStart(2, '0')}`;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-main mb-2">
          Ustawienia Systemu
        </h1>
        <p className="text-secondary">
          Zarządzanie harmonogramem snapszotów magazynu
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-success-bg border-success text-success-text' 
            : 'bg-error-bg border-error text-error-text'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-surface border border-main rounded-2xl shadow-lg overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-11a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-main">Harmonogram Snapszotów</h2>
              <p className="text-main text-sm">Automatyczne tworzenie kopii zapasowych stanu magazynu</p>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-8">
          {!config ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-secondary">Ładowanie konfiguracji...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Status */}
              <div className="bg-surface-secondary border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-main mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zm-2-5a.75.75 0 100-1.5.75.75 0 000 1.5zM5 12a2 2 0 110-4 2 2 0 010 4zM5.256 16a4.972 4.972 0 01.568-1.44H5a2 2 0 00-2 2v1a6 6 0 003.956-5.5zM16.75 12a.75.75 0 100-1.5.75.75 0 000 1.5zM1 14s1.5 1 4 1 4-1 4-1V9a6 6 0 00-8 5.6z" clipRule="evenodd" />
                  </svg>
                  Bieżący stan
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-secondary text-sm mb-1">Harmonogram</p>
                    <p className="text-main font-semibold">
                      {getScheduleDescription()}
                    </p>
                  </div>
                  <div>
                    <p className="text-secondary text-sm mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${config.enabled ? 'bg-success' : 'bg-warning'}`}></div>
                      <span className={`font-semibold ${config.enabled ? 'text-primary' : 'text-warning'}`}>
                        {config.enabled ? 'Włączony' : 'Wyłączony'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggle Status */}
              <div className="flex items-center justify-between bg-surface-secondary border border-border rounded-xl p-6">
                <div>
                  <h3 className="text-lg font-semibold text-main">Włącz/Wyłącz harmonogram</h3>
                  <p className="text-secondary text-sm mt-1">
                    {config.enabled ? 'Snapszoty są automatycznie tworzone' : 'Snapszoty nie są tworzone'}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleSchedule(!config.enabled)}
                  disabled={isLoading}
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 flex-shrink-0 ${
                    config.enabled ? 'bg-primary' : 'bg-border-strong'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-surface rounded-full transition-all duration-300 ${
                    config.enabled ? 'right-1' : 'left-1'
                  }`}></div>
                </button>
              </div>

              {/* Quick Settings */}
              <div>
                <h3 className="text-lg font-semibold text-main mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Ustawienia harmonogramu
                </h3>

                <div className="space-y-6">
                  {/* Schedule Type */}
                  <div>
                    <label className="block text-sm font-medium text-main mb-3">
                      Częstotliwość
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setScheduleSettings({ ...scheduleSettings, type: 'daily' });
                          setIsEditing(true);
                        }}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-3 rounded-lg border transition-all duration-200 font-medium ${
                          scheduleSettings.type === 'daily'
                            ? 'bg-primary text-main border-primary shadow-md'
                            : 'bg-surface border-border text-main hover:border-primary'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        Codziennie
                      </button>
                      <button
                        onClick={() => {
                          setScheduleSettings({ ...scheduleSettings, type: 'weekly' });
                          setIsEditing(true);
                        }}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-3 rounded-lg border transition-all duration-200 font-medium ${
                          scheduleSettings.type === 'weekly'
                            ? 'bg-primary text-main border-primary shadow-md'
                            : 'bg-surface border-border text-main hover:border-primary'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        Tygodniowo
                      </button>
                    </div>
                  </div>

                  {/* Day Selection (Weekly Only) */}
                  {scheduleSettings.type === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-main mb-3">
                        Dzień tygodnia
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {days.map((day) => (
                          <button
                            key={day.value}
                            onClick={() => {
                              setScheduleSettings({ ...scheduleSettings, dayOfWeek: day.value });
                              setIsEditing(true);
                            }}
                            disabled={isLoading}
                            className={`px-3 py-2 rounded-lg border transition-all duration-200 text-sm font-medium ${
                              scheduleSettings.dayOfWeek === day.value
                                ? 'bg-primary text-main border-primary shadow-md'
                                : 'bg-surface border-border text-main hover:border-primary'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {day.label.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time Selection */}
                  <div>
                    <label className="block text-sm font-medium text-main mb-3">
                      Godzina i minuta
                    </label>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs text-secondary mb-2">Godzina</label>
                        <select
                          value={scheduleSettings.hour}
                          onChange={(e) => {
                            setScheduleSettings({ ...scheduleSettings, hour: parseInt(e.target.value) });
                            setIsEditing(true);
                          }}
                          disabled={isLoading}
                          className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {String(i).padStart(2, '0')}:00
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-secondary mb-2">Minuta</label>
                        <select
                          value={scheduleSettings.minute}
                          onChange={(e) => {
                            setScheduleSettings({ ...scheduleSettings, minute: parseInt(e.target.value) });
                            setIsEditing(true);
                          }}
                          disabled={isLoading}
                          className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                        >
                          {[0, 15, 30, 45].map((minute) => (
                            <option key={minute} value={minute}>
                              :{String(minute).padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-surface-secondary border border-border rounded-lg p-4">
                    <p className="text-sm text-secondary mb-1">Snapszot będzie tworzony:</p>
                    <p className="text-lg font-semibold text-primary">
                      {getScheduleDescription()}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex gap-3 pt-4 border-t border-border">
                      <button
                        onClick={handleUpdateSchedule}
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 bg-primary text-main border border-primary rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Zapisywanie...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Zapisz harmonogram
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          parseConfigToSettings(config?.cronExpression || '0 0 15 ? * MON');
                        }}
                        disabled={isLoading}
                        className="px-6 py-3 bg-surface-secondary text-main border border-border rounded-lg font-semibold hover:bg-surface-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anuluj
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-accent/10 border border-accent rounded-xl p-6">
        <h3 className="text-accent font-semibold mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0zM8 8a1 1 0 000 2h6a1 1 0 000-2H8zm1 5a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
          </svg>
          Informacja
        </h3>
        <p className="text-secondary text-sm">
          Snapszoty magazynu są automatycznie tworzone w ustalonym harmonogramie. Każdy snapszot zawiera aktualny stan wszystkich itemów, w tym ilości, ostatnie transakcje i statusy.
        </p>
      </div>
    </div>
  );
};

export default QR;