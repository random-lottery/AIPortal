import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { getSupabaseClient } from '../utils/supabase';
import type { PortalSetting } from '../models/PortalSetting';
import type { UserPortalSettings } from '../interfaces/portal';

const userSettingsRouter = Router();

// Get user portal settings
userSettingsRouter.get('/settings', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const supabase = getSupabaseClient();
    
    // Find settings by userId
    let { data: settings, error: fetchError } = await supabase
      .from('portal_settings')
      .select('*')
      .eq('userId', userId)
      .limit(1)
      .single();

    // If no settings found, create default settings
    if (fetchError || !settings) {
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

      settings = newSettings;
    }

    res.status(200).json(settings);
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user portal settings
userSettingsRouter.put('/settings', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const updatedSettings = req.body as UserPortalSettings;
    if (updatedSettings.userId && updatedSettings.userId !== userId) {
      res.status(403).json({ message: 'Forbidden: Cannot update settings for another user' });
      return;
    }

    const supabase = getSupabaseClient();
    
    // Update settings
    const { data: settings, error: updateError } = await supabase
      .from('portal_settings')
      .update({
        layout: updatedSettings.layout,
        theme: updatedSettings.theme,
        language: updatedSettings.language,
      })
      .eq('userId', userId)
      .select()
      .single();

    // If no settings found, create new settings
    if (updateError || !settings) {
      const { data: newSettings, error: insertError } = await supabase
        .from('portal_settings')
        .insert([
          {
            userId,
            layout: updatedSettings.layout,
            theme: updatedSettings.theme,
            language: updatedSettings.language,
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating settings:', insertError);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }

      res.status(200).json(newSettings);
      return;
    }

    res.status(200).json(settings);
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default userSettingsRouter;
