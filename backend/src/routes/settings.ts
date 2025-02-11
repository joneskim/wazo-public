import express from 'express';
import { SettingsService } from '../services/settings';
import { validateSettings } from '../models/Settings';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Get current settings
router.get('/', async (req, res) => {
  try {
    const settings = await SettingsService.getSettings();
    res.json(settings);
  } catch (error: any) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update settings
router.put('/', async (req, res) => {
  try {
    const update = req.body;
    const updatedSettings = await SettingsService.updateSettings(update);
    res.json(updatedSettings);
  } catch (error: any) {
    console.error('Error updating settings:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Invalid')) {
      res.status(400).json({ error: errorMessage });
    } else {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
});

// Validate Python path
router.post('/validate-python', async (req, res) => {
  try {
    const { pythonPath } = req.body;
    if (!pythonPath) {
      return res.status(400).json({ error: 'Python path is required' });
    }

    const isValid = await SettingsService.validatePythonPath(pythonPath);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid Python path or Python not installed' });
    }

    res.json({ isValid: true });
  } catch (error: any) {
    console.error('Error validating Python path:', error);
    res.status(500).json({ error: 'Failed to validate Python path' });
  }
});

// Validate directory path
router.post('/validate-directory', async (req, res) => {
  try {
    const { directory } = req.body;
    if (!directory) {
      return res.status(400).json({ error: 'Directory path is required' });
    }

    // Resolve the absolute path
    const absolutePath = path.resolve(directory);

    try {
      // Try to create the directory if it doesn't exist
      await fs.promises.mkdir(absolutePath, { recursive: true });
      
      // Check if we can write to the directory
      await fs.promises.access(absolutePath, fs.constants.W_OK);
      
      res.json({ 
        isValid: true,
        absolutePath
      });
    } catch (error: any) {
      res.status(400).json({ 
        error: 'Directory is not writable or cannot be created',
        details: error instanceof Error ? error.message : undefined
      });
    }
  } catch (error: any) {
    console.error('Error validating directory:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to validate directory',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

export default router;
