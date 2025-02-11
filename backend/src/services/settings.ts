import fs from 'fs';
import path from 'path';
import { Settings, DEFAULT_SETTINGS, SettingsUpdate } from '../models/Settings';

export class SettingsService {
  private static settingsPath = path.join(__dirname, '../../data/settings.json');
  private static currentSettings: Settings = { ...DEFAULT_SETTINGS };
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create settings directory if it doesn't exist
      const settingsDir = path.dirname(this.settingsPath);
      if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true });
      }

      // Load settings if they exist
      if (fs.existsSync(this.settingsPath)) {
        const settingsData = await fs.promises.readFile(this.settingsPath, 'utf-8');
        try {
          const loadedSettings = JSON.parse(settingsData.trim());
          
          // Convert relative paths to absolute
          if (loadedSettings.notesDirectory && !path.isAbsolute(loadedSettings.notesDirectory)) {
            loadedSettings.notesDirectory = path.join(__dirname, '../../', loadedSettings.notesDirectory);
          }

          // Validate the loaded settings
          const validatedSettings = validateSettings(loadedSettings);
          this.currentSettings = {
            ...DEFAULT_SETTINGS,
            ...validatedSettings
          };
        } catch (parseError) {
          console.error('Error parsing settings file:', parseError);
          this.currentSettings = { ...DEFAULT_SETTINGS };
          await this.saveSettings(this.currentSettings);
        }
      } else {
        // Save default settings
        this.currentSettings = { ...DEFAULT_SETTINGS };
        await this.saveSettings(this.currentSettings);
      }

      // Create notes directory if it doesn't exist
      if (!fs.existsSync(this.currentSettings.notesDirectory)) {
        fs.mkdirSync(this.currentSettings.notesDirectory, { recursive: true });
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing settings:', error);
      throw new Error(`Failed to initialize settings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async getSettings(): Promise<Settings> {
    if (!this.initialized) {
      await this.initialize();
    }
    return { ...this.currentSettings };
  }

  static async updateSettings(update: SettingsUpdate): Promise<Settings> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const validatedUpdate = validateSettings(update);
      const newSettings = {
        ...this.currentSettings,
        ...validatedUpdate
      };

      await this.saveSettings(newSettings);
      this.currentSettings = newSettings;
      return { ...this.currentSettings };
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new Error(`Failed to update settings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private static async saveSettings(settings: Settings): Promise<void> {
    try {
      const settingsToSave = {
        ...settings,
        notesDirectory: path.isAbsolute(settings.notesDirectory)
          ? path.relative(path.join(__dirname, '../../'), settings.notesDirectory)
          : settings.notesDirectory
      };

      const settingsJson = JSON.stringify(settingsToSave, null, 2);
      // Validate JSON before saving
      JSON.parse(settingsJson);
      await fs.promises.writeFile(this.settingsPath, settingsJson, 'utf-8');
    } catch (error) {
      console.error('Error saving settings:', error);
      throw new Error(`Failed to save settings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async validatePythonPath(pythonPath: string): Promise<boolean> {
    try {
      const { execSync } = require('child_process');
      execSync(`${pythonPath} --version`);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async validateDirectory(directory: string): Promise<boolean> {
    try {
      const dirPath = path.isAbsolute(directory) 
        ? directory 
        : path.join(__dirname, '../../', directory);
      
      await fs.promises.access(dirPath, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }
}

function validateSettings(settings: Settings | SettingsUpdate): Settings | SettingsUpdate {
  // Implement validation logic here if needed
  return settings;
}
