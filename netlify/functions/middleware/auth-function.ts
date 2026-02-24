// netlify/functions/middleware/auth-function.ts
import { APIGatewayProxyEvent } from 'aws-lambda';
import { getSupabaseClient } from '../utils/supabase';
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
    const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET; // 这现在应该是一个纯文本字符串

    if (!supabaseJwtSecret) {
      console.error('SUPABASE_JWT_SECRET is not defined in environment variables.');
      return { isAuthenticated: false, statusCode: 500, message: 'Server configuration error: JWT secret not found.' };
    }

    // Supabase 认证会话 Token 使用 ES256 算法，而不是 HS256。
    // jwt.verify 期望第二个参数是私钥（如果算法是 ES256/RS256），
    // 或者是对称密钥（如果算法是 HS256）。
    // 对于 ES256，它需要一个公钥（通常通过jwks-rsa获取）或者私钥。
    //
    // 对于 Supabase，最简单和推荐的验证方式是：
    //   1. 使用 Supabase Client 的 auth.getUser() 方法 (在 Functions 中可能需要 Service Key)
    //   2. 或者使用 jwks-rsa 库从 Supabase 的 JWKS endpoint 获取公钥来验证。
    //   3. 或者如果 Supabase JWT Secret 实际上是 HS256 密钥，你可以用它。
    //
    // 你的 token 头部显示 alg: "ES256"。这意味着它不是用一个简单的 HS256 密钥签名的。
    // 如果你从 Supabase 控制台获取的 "JWT Secret" 是一个 HS256 字符串，
    // 它不能直接用于验证 ES256 Token。
    //
    // 这是一个常见的误解。Supabase 的 "JWT Secret" 通常指的是它的内部服务使用的对称密钥 (HS256)。
    // 而用户会话 Token (alg: "ES256") 是非对称密钥签名的。
    //
    // 正确的 ES256 Token 验证需要公钥。
    // 最简单的在 Netlify Function 中验证 Supabase Token 的方法是使用 Supabase Client。

    const supabase = getSupabaseClient(); // 获取 Supabase 客户端实例
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData?.user) {
      console.error('Supabase auth.getUser error:', authError?.message || 'No user found with this token.');
      return { isAuthenticated: false, statusCode: 403, message: 'Forbidden: Invalid or expired token.' };
    }

    return { isAuthenticated: true, statusCode: 200, userId: userData.user.id };

  } catch (err: any) {
    console.error('Token verification error:', err.message);
    return { isAuthenticated: false, statusCode: 403, message: 'Forbidden: Invalid token' };
  }
};