import { Router } from 'express';
import { PortalSettingModel } from '../models/PortalSetting';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
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

    let settings = await PortalSettingModel.findOne({ userId });
    if (!settings) {
      settings = await PortalSettingModel.create({
        userId,
        layout: [],
        theme: 'light',
        language: 'en',
      });
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

    const settings = await PortalSettingModel.findOneAndUpdate(
      { userId },
      { $set: { ...updatedSettings, userId } },
      { new: true, upsert: true }
    );

    res.status(200).json(settings);
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default userSettingsRouter;
