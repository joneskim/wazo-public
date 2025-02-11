import { Router } from 'express';
import { AuthService } from '../services/auth';
import { DatabaseService } from '../services/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { user, token, isNewUser } = await AuthService.registerUser(req.body);
    
    // Create welcome note for new user
    if (isNewUser) {
      await DatabaseService.createWelcomeNote(user.id);
    }
    
    res.json({ user, token });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { user, token } = await AuthService.loginUser(req.body);
    res.json({ user, token });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
});

// Route to get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.json({ user: req.user });
  } catch (error) {
    console.error('Error getting current user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
