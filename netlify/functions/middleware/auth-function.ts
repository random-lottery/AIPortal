// netlify/functions/middleware/auth-function.ts
import { APIGatewayProxyEvent } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

interface AuthResult {
  isAuthenticated: boolean;
  statusCode: number;
  message?: string;
  userId?: string;
}

export const authenticateToken = (event: APIGatewayProxyEvent): AuthResult => {
  const authHeader = event.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return { isAuthenticated: false, statusCode: 401, message: 'Unauthorized: No token provided' };
  }

  try {
    const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

    if (!supabaseJwtSecret) {
      console.error('SUPABASE_JWT_SECRET is not defined in environment variables.');
      return { isAuthenticated: false, statusCode: 500, message: 'Server configuration error: JWT secret not found.' };
    }

    // 显式指定算法（Supabase 通常使用 HS256），并确保密钥是字符串
    const decoded = jwt.verify(token, supabaseJwtSecret, { algorithms: ['HS256'] }) as { sub: string; iat: number; exp: number };
    return { isAuthenticated: true, statusCode: 200, userId: decoded.sub };
  } catch (err: any) { // Cast err to any to access message property safely
    console.error('Token verification error:', err.message); // Log the specific error message
    // 针对 invalid algorithm 错误，给出更明确的提示
    if (err.name === 'JsonWebTokenError' && err.message === 'invalid algorithm') {
      return { isAuthenticated: false, statusCode: 403, message: 'Forbidden: Invalid token signature or algorithm mismatch.' };
    }
    return { isAuthenticated: false, statusCode: 403, message: 'Forbidden: Invalid token' };
  }
};