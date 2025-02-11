import { Request } from 'express';
import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'passwordHash'>;
    }
  }
}

export interface AuthRequest<
  P = Record<string, string>,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Record<string, string>
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: Omit<User, 'passwordHash'>;
}
