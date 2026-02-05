"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const PortalSetting_1 = require("../models/PortalSetting");
const aiAgentRouter = (0, express_1.Router)();
aiAgentRouter.post('/command', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const { command } = req.body;
        if (!command) {
            res.status(400).json({ message: 'Command is required' });
            return;
        }
        // Simulated AI parsing logic. Replace with real LLM calls (OpenAI/LangChain).
        let aiParsedAction = { type: 'unknown' };
        const lower = command.toLowerCase();
        if (lower.includes('change theme to dark') || lower.includes('dark mode')) {
            aiParsedAction = { type: 'changeTheme', payload: 'dark' };
        }
        else if (lower.includes('change theme to light') || lower.includes('light mode')) {
            aiParsedAction = { type: 'changeTheme', payload: 'light' };
        }
        else if (lower.includes('add welcome widget')) {
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
        }
        else if (lower.includes('make all widgets full screen')) {
            aiParsedAction = { type: 'setAllFullscreen' };
        }
        let responseMessage = `Command "${command}" processed.`;
        let updatedSettings = null;
        let userSettings = await PortalSetting_1.PortalSettingModel.findOne({ userId });
        if (!userSettings) {
            userSettings = await PortalSetting_1.PortalSettingModel.create({ userId, layout: [], theme: 'light', language: 'en' });
        }
        if (aiParsedAction.type === 'changeTheme') {
            userSettings.theme = aiParsedAction.payload;
            await userSettings.save();
            updatedSettings = userSettings.toObject();
            responseMessage = `Theme changed to ${aiParsedAction.payload}.`;
        }
        else if (aiParsedAction.type === 'addWidget') {
            userSettings.layout.push(aiParsedAction.payload);
            await userSettings.save();
            updatedSettings = userSettings.toObject();
            responseMessage = `Added widget "${aiParsedAction.payload.title}".`;
        }
        else if (aiParsedAction.type === 'setAllFullscreen') {
            userSettings.layout.forEach((widget) => {
                widget.fullscreen = true;
                widget.maximized = false;
                widget.minimized = false;
            });
            await userSettings.save();
            updatedSettings = userSettings.toObject();
            responseMessage = 'All widgets set to fullscreen.';
        }
        if (updatedSettings) {
            const io = req.app.get('io');
            if (io) {
                io.to(userId.toString()).emit('portal-settings-updated', updatedSettings);
            }
        }
        res.status(200).json({ message: responseMessage, updatedSettings });
    }
    catch (error) {
        console.error('AI Agent command error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = aiAgentRouter;
