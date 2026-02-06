import { Handler, Context } from '@netlify/functions';
import { getSupabaseClient } from '../utils/supabase';
import { authenticateToken } from '../middleware/auth-function'; // This middleware still validates the JWT
import type { UserPortalSettings, PortalWidget } from '../../src/interfaces/portal'; // Ensure interface is accessible
import 'dotenv/config';

const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const authResult = authenticateToken(event);
  if (!authResult.isAuthenticated) {
    return { statusCode: authResult.statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: authResult.message }) };
  }
  const userId = authResult.userId as string;

  try {
    const supabase = getSupabaseClient();

    let { data: settings, error } = await supabase
      .from('portal_settings') // Your table name in Supabase
      .select('*')
      .eq('user_id', userId) // Column name in your Supabase table
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means "No rows found"
      console.error('Supabase fetch settings error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Failed to fetch user settings', error: error.message }),
      };
    }

    if (!settings) {
      // If no settings found, create default settings
      const defaultSettings: Omit<UserPortalSettings, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        layout: [], // Default empty layout
        theme: 'light',
        language: 'en',
      };

      const { data: newSettings, error: insertError } = await supabase
        .from('portal_settings')
        .insert([defaultSettings])
        .select()
        .single(); // Ensure to return the inserted record

      if (insertError) {
        console.error('Supabase insert default settings error:', insertError);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Failed to create default settings', error: insertError.message }),
        };
      }
      settings = newSettings;
    }

    // Map Supabase column names to your frontend interface if they differ (e.g., user_id -> userId)
    const formattedSettings: UserPortalSettings = {
      id: settings.id,
      userId: settings.user_id,
      layout: settings.layout as PortalWidget[], // Cast jsonb to your interface
      theme: settings.theme,
      language: settings.language,
      createdAt: settings.created_at ? new Date(settings.created_at) : undefined,
      updatedAt: settings.updated_at ? new Date(settings.updated_at) : undefined,
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedSettings),
    };
  } catch (error: any) {
    console.error('Get user settings error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};

export { handler };