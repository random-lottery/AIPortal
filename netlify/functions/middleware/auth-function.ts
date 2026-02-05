import type { HandlerEvent } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

interface AuthResult {
  isAuthenticated: boolean;
  statusCode: number;
  message?: string;
  userId?: string;
}

export const authenticateToken = (event: HandlerEvent): AuthResult => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return { isAuthenticated: false, statusCode: 401, message: 'Unauthorized: No token provided' };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    return { isAuthenticated: true, statusCode: 200, userId: decoded.userId };
  } catch (err) {
    console.error('Token verification error:', err);
    return { isAuthenticated: false, statusCode: 403, message: 'Forbidden: Invalid token' };
  }
};

