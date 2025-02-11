import React, { useState, useEffect } from 'react';
import { BasePanel } from '../common/BasePanel';
import { Switch, FormControlLabel } from '@mui/material';

interface SettingsProps {
  show: boolean;
}

interface Settings {
  notesDirectory: string;
  ollamaModel: string;
  ollamaEndpoint: string;
  theme: 'light' | 'dark';
}

const defaultSettings: Settings = {
  notesDirectory: './data/notes',
  ollamaModel: 'mistral',
  ollamaEndpoint: process.env.REACT_APP_OLLAMA_ENDPOINT || 'http://localhost:11434/api',
  theme: 'light'
};


export const Settings: React.FC<SettingsProps> = ({ show }) => {
  type ErrorState = Partial<Record<keyof Settings | 'general', string>>;
  
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [errors, setErrors] = useState<ErrorState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (show && !isLoading && Object.keys(settings).length === 0) { // Only fetch if not loading and settings are empty
        fetchSettings();
    }
}, [show, isLoading, settings]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setErrors({});
      const response = await fetch(`/api/settings`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch settings');
      }
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'An unknown error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTheme = event.target.checked ? 'dark' : 'light';
    try {
      setIsSaving(true);
      const response = await fetch(`/api/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: newTheme }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update theme');
      }

      setSettings(prev => ({ ...prev, theme: newTheme }));
      // Apply theme change immediately
      document.documentElement.setAttribute('data-theme', newTheme);
    } catch (error) {
      setErrors({ theme: error instanceof Error ? error.message : 'An unknown error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!show) return null;

  return (
    <BasePanel title="Settings" show={show}>
      <div className="p-4">
        <FormControlLabel
          control={
            <Switch
              checked={settings.theme === 'dark'}
              onChange={handleThemeChange}
              disabled={isSaving}
            />
          }
          label="Dark Mode"
        />
        {errors.theme && (
          <div className="text-red-500 text-sm mt-1">{errors.theme}</div>
        )}
      </div>
    </BasePanel>
  );
};

export default Settings;
