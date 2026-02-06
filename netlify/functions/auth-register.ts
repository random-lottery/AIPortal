// netlify/functions/auth-register.ts
import type { Handler } from '@netlify/functions';
import { getSupabaseClient } from './utils/supabase';
// 修正：使用 AuthResponse 类型
import { AuthResponse } from '@supabase/supabase-js'; // Changed from SignUpResponse
import 'dotenv/config';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const supabase = getSupabaseClient();
    const { email, password, username } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Email and password are required' }),
      };
    }

    const { data, error }: AuthResponse = await supabase.auth.signUp({ // Changed type here
      email,
      password,
      options: {
        data: {
          username: username,
        },
      },
    });

    if (error) {
      console.error('Supabase signUp error:', error.message);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: error.message || 'Registration failed' }),
      };
    }

    // data 结构现在可能包含 user 和 session
    // 在 Supabase 的最新版本中，signUp 成功后，data.user 会有值，data.session 则取决于是否自动登录
    if (data.user && data.session) {
        // User was automatically signed in after registration (common in development settings)
        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'User registered and logged in successfully',
                userId: data.user.id,
                token: data.session.access_token,
                username: (data.user.user_metadata as { username?: string })?.username || data.user.email, // Access username from metadata
            }),
        };
    } else if (data.user && !data.session) {
        // User registered but requires email confirmation (common in production settings)
        // In this case, data.session will be null.
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Registration successful, please check your email for verification.' }),
        };
    } else {
        // This case should ideally not happen if data.user is null but no error,
        // but it's good for robustness.
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Registration process had an unexpected outcome (no user data).' }),
        };
    }

  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};

export { handler };