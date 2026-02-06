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
    // Note: If using Supabase's JWT, the secret for verification might be different
    // It's the `JWT Secret` found in Supabase Project Settings -> API,
    // NOT your custom `JWT_SECRET` from .env unless you're explicitly issuing custom tokens.
    // For simplicity, we'll assume a shared JWT_SECRET for now,
    // but in a pure Supabase setup, you'd verify against Supabase's provided secret.
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { sub: string; iat: number; exp: number }; // Supabase JWT uses 'sub' for user ID
    return { isAuthenticated: true, statusCode: 200, userId: decoded.sub }; // Use 'sub' as userId
  } catch (err) {
    console.error('Token verification error:', err);
    return { isAuthenticated: false, statusCode: 403, message: 'Forbidden: Invalid token' };
  }
};