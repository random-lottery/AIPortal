// netlify/functions/user-settings-put.ts
import type { Handler } from '@netlify/functions';
import { getSupabaseClient } from './utils/supabase'; // Import the Supabase client utility
import { authenticateToken } from './middleware/auth-function';
import type { UserPortalSettings, PortalWidget } from '../../src/interfaces/portal'; // Ensure interface is accessible
import 'dotenv/config';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const authResult = authenticateToken(event);
  if (!authResult.isAuthenticated) {
    return {
      statusCode: authResult.statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: authResult.message }),
    };
  }
  const userId = authResult.userId as string;

  try {
    const supabase = getSupabaseClient();
    const incomingSettings = JSON.parse(event.body || '{}') as UserPortalSettings;

    // Supabase table column names might differ from your interface (e.g., user_id vs userId)
    // Prepare the data to be inserted/updated, mapping to Supabase table column names
    const dataToUpdate = {
      user_id: userId, // Ensure this matches your Supabase table column name
      layout: incomingSettings.layout, // Supabase jsonb column will handle this array of objects
      theme: incomingSettings.theme,
      language: incomingSettings.language,
      // You might also want to explicitly set updated_at if your Supabase trigger isn't handling it
      // updated_at: new Date().toISOString(),
    };

    // Attempt to update settings for the current user (user_id)
    const { data: updatedSettings, error: updateError } = await supabase
      .from('portal_settings')
      .upsert(dataToUpdate, {
        onConflict: 'user_id', // If a record with this user_id exists, update it
        ignoreDuplicates: false, // Make sure it updates if exists, or inserts if not
      })
      .select() // Return the updated/inserted record
      .single(); // Expect a single record back

    if (updateError) {
      console.error('Supabase upsert settings error:', updateError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Failed to update user settings', error: updateError.message }),
      };
    }

    if (!updatedSettings) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Failed to retrieve updated settings after upsert.' }),
        };
    }

    // Map Supabase column names back to your frontend interface if needed
    const formattedSettings: UserPortalSettings = {
      id: updatedSettings.id,
      userId: updatedSettings.user_id,
      layout: updatedSettings.layout as PortalWidget[],
      theme: updatedSettings.theme,
      language: updatedSettings.language,
      createdAt: updatedSettings.created_at ? new Date(updatedSettings.created_at) : undefined,
      updatedAt: updatedSettings.updated_at ? new Date(updatedSettings.updated_at) : undefined,
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedSettings),
    };
  } catch (error: any) {
    console.error('Update user settings error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};

export { handler };