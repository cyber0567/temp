import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JWTPayload } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

/** Validates JWT (custom auth + Google Passport); no Supabase Auth. */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const authReq = req as AuthenticatedRequest;

  try {
    const decoded = jwt.verify(token, env.sessionSecret) as { sub: string; email?: string };
    authReq.user = { sub: decoded.sub, email: decoded.email };
    return next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
}
