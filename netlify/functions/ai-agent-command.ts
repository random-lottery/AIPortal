// netlify/functions/ai-agent-command.ts
import type { Handler } from '@netlify/functions';
import { getSupabaseClient } from './utils/supabase'; // Import the Supabase client utility
import { authenticateToken } from './middleware/auth-function';
import type { PortalWidget, UserPortalSettings } from '../../src/interfaces/portal'; // Ensure interface is accessible
import 'dotenv/config';
import OpenAI from 'openai'; // Import OpenAI SDK

console.log('OPENAI_API_KEY loaded:', process.env.OPENAI_API_KEY ? 'Yes' : 'No');
// Initialize OpenAI client
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://www.aiagentportal.com', // Optional. Site URL for rankings on openrouter.ai.
    'X-Title': 'AI Agent Portal', // Optional. Site title for rankings on openrouter.ai.
  },
});

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
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
    const { command } = JSON.parse(event.body || '{}') as { command?: string };

    if (!command) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Command is required' }),
      };
    }

    // 1. Get current user settings from Supabase
    let { data: settings, error: fetchError } = await supabase
      .from('portal_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means "No rows found"
        console.error('Supabase fetch settings error:', fetchError);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Failed to fetch user settings', error: fetchError.message }),
        };
    }

    if (!settings) {
        // If no settings found, create a default one to work with
        const defaultSettings: Omit<UserPortalSettings, 'id' | 'createdAt' | 'updatedAt'> = {
            userId,
            layout: [],
            theme: 'light',
            language: 'en',
        };
        const { data: newSettings, error: insertError } = await supabase
            .from('portal_settings')
            .insert([defaultSettings])
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

    // Map Supabase data to local UserPortalSettings interface for easier manipulation
    let currentPortalSettings: UserPortalSettings = {
        id: settings.id,
        userId: settings.user_id,
        layout: settings.layout as PortalWidget[], // Ensure proper type for layout
        theme: settings.theme,
        language: settings.language,
        createdAt: settings.created_at ? new Date(settings.created_at) : undefined,
        updatedAt: settings.updated_at ? new Date(settings.updated_at) : undefined,
    };

    let responseMessage: string = `Command "${command}" processed.`;
    let shouldUpdateDB: boolean = false; // Flag to indicate if database update is needed

    // --- AI Agent Logic Integration (using OpenAI) ---
    // Here, we'll use OpenAI to interpret the command and decide on actions.
    // This is a more robust approach than simple string matching.

    const systemPrompt = `You are an AI assistant that manages user's AI Agent Portal settings.
    Based on the user's command, decide what action to take.
    The current settings are: ${JSON.stringify({ theme: currentPortalSettings.theme, layoutCount: currentPortalSettings.layout.length })}
    
    Available actions:
    1. CHANGE_THEME: Change the portal's theme. Arguments: "theme" (string, "dark" or "light")
    2. ADD_WIDGET: Add a new widget to the portal. Arguments: "type" (string, e.g., "text", "chart", "weather"), "title" (string), "content" (string, for text widgets)
    3. MAXIMIZE_ALL_WIDGETS: Set all existing widgets to fullscreen. No arguments.
    4. NO_ACTION: No specific action needed or command unclear.
    
    Respond only with a JSON object { "action": "ACTION_TYPE", "args": { ...arguments... }, "message": "AI generated message" }.
    Example for changing theme: { "action": "CHANGE_THEME", "args": { "theme": "dark" }, "message": "I've switched your portal to dark mode." }
    Example for adding widget: { "action": "ADD_WIDGET", "args": { "type": "text", "title": "New Note", "content": "This is a new note." }, "message": "Added a new text widget." }
    Example for no action: { "action": "NO_ACTION", "args": {}, "message": "I didn't understand the command, please try again." }
    `;

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: command },
      ],
      model: 'glm-4.5-air:free', // Or 'gpt-4' for more advanced reasoning
      response_format: { type: 'json_object' }, // Crucial for getting structured JSON output
    });

    const aiResponseContent = chatCompletion.choices[0].message.content;
    let aiParsedAction: { action: string; args: Record<string, any>; message: string };

    try {
        aiParsedAction = JSON.parse(aiResponseContent || '{}');
    } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', aiResponseContent, parseError);
        aiParsedAction = { action: 'NO_ACTION', args: {}, message: "I encountered an error parsing my own response. Please try again." };
    }

    responseMessage = aiParsedAction.message; // Use AI's generated message

    switch (aiParsedAction.action) {
      case 'CHANGE_THEME':
        const newTheme = aiParsedAction.args.theme;
        if (newTheme === 'dark' || newTheme === 'light') {
          if (currentPortalSettings.theme !== newTheme) {
            currentPortalSettings.theme = newTheme;
            shouldUpdateDB = true;
          }
        } else {
          responseMessage = 'I could not understand the desired theme. Please specify "dark" or "light".';
        }
        break;
      case 'ADD_WIDGET':
        const { type, title, content } = aiParsedAction.args;
        if (type && title) {
          const newWidget: PortalWidget = {
            id: `widget-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // More robust ID
            type: type as PortalWidget['type'], // Type casting
            title: title,
            position: { x: 50, y: 50 + currentPortalSettings.layout.length * 20, width: 320, height: 150, zIndex: 10 + currentPortalSettings.layout.length },
            minimized: false,
            maximized: false,
            fullscreen: false,
            config: type === 'text' && content ? { content } : {}, // For text widgets, include content
          };
          currentPortalSettings.layout.push(newWidget);
          shouldUpdateDB = true;
        } else {
          responseMessage = 'I need a type and title to add a widget.';
        }
        break;
      case 'MAXIMIZE_ALL_WIDGETS':
        if (currentPortalSettings.layout.length > 0) {
            currentPortalSettings.layout = currentPortalSettings.layout.map((widget: PortalWidget) => ({
                ...widget,
                fullscreen: true,
                maximized: false,
                minimized: false,
            }));
            shouldUpdateDB = true;
        } else {
            responseMessage = 'There are no widgets to maximize.';
        }
        break;
      case 'NO_ACTION':
      default:
        // AI already provided a message for NO_ACTION
        break;
    }

    // 3. Update Supabase if changes were made
    let savedSettings: UserPortalSettings | undefined;
    if (shouldUpdateDB) {
        const dataToUpdate = {
            user_id: userId, // Ensure this matches your Supabase table column name
            layout: currentPortalSettings.layout,
            theme: currentPortalSettings.theme,
            language: currentPortalSettings.language,
        };
        const { data: updated, error: updateError } = await supabase
            .from('portal_settings')
            .upsert(dataToUpdate, {
                onConflict: 'user_id',
            })
            .select()
            .single();

        if (updateError) {
            console.error('Supabase update settings error:', updateError);
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Failed to save settings after AI command', error: updateError.message }),
            };
        }
        // Format the saved data back to UserPortalSettings interface
        savedSettings = {
            id: updated.id,
            userId: updated.user_id,
            layout: updated.layout as PortalWidget[],
            theme: updated.theme,
            language: updated.language,
            createdAt: updated.created_at ? new Date(updated.created_at) : undefined,
            updatedAt: updated.updated_at ? new Date(updated.updated_at) : undefined,
        };
    } else {
        // If no DB update, return current settings (possibly unchanged or only AI message changed)
        savedSettings = currentPortalSettings;
    }


    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: responseMessage, updatedSettings: savedSettings }),
    };
  } catch (error: any) {
    console.error('AI Agent command processing error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};

export { handler };
