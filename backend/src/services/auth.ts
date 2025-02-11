import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { User, UserCreateInput, UserLoginInput } from '../models/User';

const JWT_SECRET = process.env.koala_JWT_SECRET || 'your-secret-key';

export class AuthService {
  static async registerUser(userData: { email: string; password: string; username?: string; invitationKey?: string }): Promise<{ user: Omit<User, 'passwordHash'>; token: string; isNewUser: boolean }> {
    try {

      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });


      if (existingUser) {
        throw new Error('User already exists');
      }


      

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      const user = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash,
          name: userData.username
        }
      });

      const userWithoutPassword = {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      };

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '72h' });

      return { user: userWithoutPassword, token, isNewUser: true };
    } catch (error: any) {
      console.error('Error registering user:', error);
      throw new Error(`Failed to register user: ${error.message}`);
    }
  }

  static async loginUser(userData: { email: string; password: string }): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const isValidPassword = await bcrypt.compare(userData.password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      const userWithoutPassword = {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      };

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

      return { user: userWithoutPassword, token };
    } catch (error: any) {
      console.error('Error logging in user:', error);
      throw new Error(`Failed to login user: ${error.message}`);
    }
  }

  static verifyToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
