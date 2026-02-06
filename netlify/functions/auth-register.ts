// netlify/functions/auth-register.ts
import type { Handler } from '@netlify/functions';
import { getSupabaseClient } from './utils/supabase'; // Import the Supabase client utility
import { SignUpResponse } from '@supabase/supabase-js'; // Import Supabase Auth types
import 'dotenv/config';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const supabase = getSupabaseClient();
    const { email, password, username } = JSON.parse(event.body || '{}'); // Assuming username is also sent

    if (!email || !password) {
      // Username is optional for Supabase auth.signUp, but you might want to enforce it for your app.
      // If enforcing, uncomment and adjust: if (!username || !email || !password) { ... }
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Email and password are required' }),
      };
    }

    // Use Supabase auth.signUp to register a new user
    // You can optionally pass 'data' for user metadata, like a username
    const { data, error }: SignUpResponse = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username, // Store username as user metadata
        },
        // If you require email confirmation, you might also set redirectTo
        // redirectTo: 'http://localhost:8888/.netlify/functions/auth-callback', // Example for email confirmation flow
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

    // After successful registration, Supabase might automatically sign in the user
    // or require email confirmation depending on your Supabase project settings.
    // The `data.user` and `data.session` will be available if signed in directly.

    if (data.user && data.session) {
        // User was automatically signed in after registration (common in development settings)
        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'User registered and logged in successfully',
                userId: data.user.id,
                token: data.session.access_token,
                username: (data.user.user_metadata as any)?.username || data.user.email, // Access username from metadata
            }),
        };
    } else if (data.user && !data.session) {
        // User registered but requires email confirmation (common in production settings)
        return {
            statusCode: 200, // Not 201, as user is not fully active yet
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Registration successful, please check your email for verification.' }),
        };
    } else {
        // Unexpected scenario
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Registration process had an unexpected outcome.' }),
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