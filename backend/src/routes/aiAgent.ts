import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { getSupabaseClient } from '../utils/supabase';
import type { UserPortalSettings } from '../interfaces/portal';
import type { Server as SocketIOServer } from 'socket.io';
import type { PortalSetting } from '../models/PortalSetting';

const aiAgentRouter = Router();

aiAgentRouter.post('/command', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { command } = req.body as { command?: string };
    if (!command) {
      res.status(400).json({ message: 'Command is required' });
      return;
    }

    const supabase = getSupabaseClient();

    // Simulated AI parsing logic. Replace with real LLM calls (OpenAI/LangChain).
    let aiParsedAction: { type: string; payload?: any } = { type: 'unknown' };

    const lower = command.toLowerCase();
    if (lower.includes('change theme to dark') || lower.includes('dark mode')) {
      aiParsedAction = { type: 'changeTheme', payload: 'dark' };
    } else if (lower.includes('change theme to light') || lower.includes('light mode')) {
      aiParsedAction = { type: 'changeTheme', payload: 'light' };
    } else if (lower.includes('add welcome widget')) {
      aiParsedAction = {
        type: 'addWidget',
        payload: {
          id: `widget-${Date.now()}`,
          type: 'text',
          title: 'AI Welcome',
          position: { x: 50, y: 50, width: 320, height: 150, zIndex: 10 },
          minimized: false,
          maximized: false,
          fullscreen: false,
          config: { content: 'Welcome by AI Agent!' },
        },
      };
    } else if (lower.includes('make all widgets full screen')) {
      aiParsedAction = { type: 'setAllFullscreen' };
    }

    let responseMessage = `Command "${command}" processed.`;
    let updatedSettings: PortalSetting | null = null;

    // Get user settings
    let { data: userSettings, error: fetchError } = await supabase
      .from('portal_settings')
      .select('*')
      .eq('userId', userId)
      .limit(1)
      .single();

    // If no settings found, create default settings
    if (fetchError || !userSettings) {
      const { data: newSettings, error: insertError } = await supabase
        .from('portal_settings')
        .insert([
          {
            userId,
            layout: [],
            theme: 'light',
            language: 'en',
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default settings:', insertError);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }

      userSettings = newSettings;
    }

    // Process AI action
    if (aiParsedAction.type === 'changeTheme') {
      const { data, error } = await supabase
        .from('portal_settings')
        .update({ theme: aiParsedAction.payload })
        .eq('userId', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating theme:', error);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }

      updatedSettings = data;
      responseMessage = `Theme changed to ${aiParsedAction.payload}.`;
    } else if (aiParsedAction.type === 'addWidget') {
      // Add new widget to layout
      const updatedLayout = [...userSettings.layout, aiParsedAction.payload];
      
      const { data, error } = await supabase
        .from('portal_settings')
        .update({ layout: updatedLayout })
        .eq('userId', userId)
        .select()
        .single();

      if (error) {
        console.error('Error adding widget:', error);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }

      updatedSettings = data;
      responseMessage = `Added widget "${aiParsedAction.payload.title}".`;
    } else if (aiParsedAction.type === 'setAllFullscreen') {
      // Set all widgets to fullscreen
      const updatedLayout = userSettings.layout.map((widget: any) => ({
        ...widget,
        fullscreen: true,
        maximized: false,
        minimized: false,
      }));
      
      const { data, error } = await supabase
        .from('portal_settings')
        .update({ layout: updatedLayout })
        .eq('userId', userId)
        .select()
        .single();

      if (error) {
        console.error('Error setting all widgets fullscreen:', error);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }

      updatedSettings = data;
      responseMessage = 'All widgets set to fullscreen.';
    } else {
      // No action taken, return current settings
      updatedSettings = userSettings;
    }

    if (updatedSettings) {
      const io: SocketIOServer | undefined = req.app.get('io');
      if (io) {
        io.to(userId.toString()).emit('portal-settings-updated', updatedSettings);
      }
    }

    res.status(200).json({ message: responseMessage, updatedSettings });
  } catch (error) {
    console.error('AI Agent command error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default aiAgentRouter;
