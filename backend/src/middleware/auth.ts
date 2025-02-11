import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.d';
import { AuthService } from '../services/auth';
import { DatabaseService } from '../services/database';

export { AuthRequest };

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { userId } = AuthService.verifyToken(token);
    const user = await DatabaseService.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export { authMiddleware as authenticateToken };
