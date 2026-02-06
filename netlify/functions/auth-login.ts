import { Handler, Context } from '@netlify/functions';
import { getSupabaseClient } from './utils/supabase';
import { AuthTokenResponse } from '@supabase/supabase-js'; // Import Supabase Auth types
import 'dotenv/config';

const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const supabase = getSupabaseClient();
    const { email, password } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Email and password are required' }) };
    }

    // Use Supabase auth.signInWithPassword to authenticate
    const { data, error }: AuthTokenResponse = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase signInWithPassword error:', error.message);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: error.message || 'Invalid credentials' }),
      };
    }

    if (!data || !data.user || !data.session) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Authentication failed, no user or session data.' }),
        };
    }

    // Supabase returns a JWT token in the session object
    const token = data.session.access_token;
    const userId = data.user.id;
    const username = data.user.email; // Or fetch from a public_users table if you have usernames

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId, username }),
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};

export { handler };