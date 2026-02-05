"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PortalSetting_1 = require("../models/PortalSetting");
const auth_1 = require("../middleware/auth");
const userSettingsRouter = (0, express_1.Router)();
// Get user portal settings
userSettingsRouter.get('/settings', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        let settings = await PortalSetting_1.PortalSettingModel.findOne({ userId });
        if (!settings) {
            settings = await PortalSetting_1.PortalSettingModel.create({
                userId,
                layout: [],
                theme: 'light',
                language: 'en',
            });
        }
        res.status(200).json(settings);
    }
    catch (error) {
        console.error('Get user settings error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Update user portal settings
userSettingsRouter.put('/settings', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const updatedSettings = req.body;
        if (updatedSettings.userId && updatedSettings.userId !== userId) {
            res.status(403).json({ message: 'Forbidden: Cannot update settings for another user' });
            return;
        }
        const settings = await PortalSetting_1.PortalSettingModel.findOneAndUpdate({ userId }, { $set: { ...updatedSettings, userId } }, { new: true, upsert: true });
        res.status(200).json(settings);
    }
    catch (error) {
        console.error('Update user settings error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = userSettingsRouter;
