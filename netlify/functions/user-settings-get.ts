// netlify/functions/user-settings-get.ts
//import { Handler } from '@netlify/functions'; // 确保这里导入了 Handler 类型
import type { Handler, Context } from '@netlify/functions';
import { getSupabaseClient } from './utils/supabase';
import { authenticateToken } from './middleware/auth-function';
import type { UserPortalSettings, PortalWidget, UserPortalSettingsDB } from '../../src/interfaces/portal';
import 'dotenv/config';

const handler: Handler = async (event, context) => { // Removed duplicate Handler =
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const authResult = await authenticateToken(event);
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
      // FIX: Ensure column names match Supabase table (userId -> user_id)
      const defaultSettingsForSupabase = {
        user_id: userId, // <<< 修正点：将 userId 映射为数据库列名 user_id
        layout: [],
        theme: 'light',
        language: 'en',
      };

      const { data: newSettings, error: insertError } = await supabase
        .from('portal_settings')
        .insert([defaultSettingsForSupabase]) // 使用匹配数据库列名的对象
        .select()
        .single();

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

    // Map Supabase column names to your frontend interface (user_id -> userId)
    const formattedSettings: UserPortalSettings = {
      id: settings.id,
      userId: settings.user_id, // <<< 修正点：从 user_id 映射回 userId
      layout: settings.layout as PortalWidget[],
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