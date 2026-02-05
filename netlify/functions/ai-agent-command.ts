import type { Handler } from '@netlify/functions';
import { connectDB, getRepository } from './utils/database';
import { PortalSettingEntity } from '../../entities/PortalSetting';
import { authenticateToken } from './middleware/auth-function';
import type { UserPortalSettings } from '../../src/interfaces/portal';
import 'dotenv/config';

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
    await connectDB();
    const portalSettingRepository = getRepository(PortalSettingEntity);
    const { command } = JSON.parse(event.body || '{}') as { command?: string };

    if (!command) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Command is required' }),
      };
    }

    let settings = await portalSettingRepository.findOne({ where: { userId } });
    if (!settings) {
      settings = portalSettingRepository.create({
        userId,
        layout: [],
        theme: 'light',
        language: 'en',
      });
    }

    const lower = command.toLowerCase();
    let responseMessage = `Command "${command}" processed.`;

    if (lower.includes('change theme to dark') || lower.includes('dark mode')) {
      settings.theme = 'dark';
      responseMessage = 'Theme changed to dark.';
    } else if (lower.includes('change theme to light') || lower.includes('light mode')) {
      settings.theme = 'light';
      responseMessage = 'Theme changed to light.';
    } else if (lower.includes('add welcome widget')) {
      settings.layout.push({
        id: `widget-${Date.now()}`,
        type: 'text',
        title: 'AI Welcome',
        position: { x: 50, y: 50, width: 320, height: 150, zIndex: 10 },
        minimized: false,
        maximized: false,
        fullscreen: false,
        config: { content: 'Welcome by AI Agent!' },
      } as any);
      responseMessage = 'Added a new AI welcome widget.';
    } else if (lower.includes('make all widgets full screen')) {
      settings.layout = settings.layout.map((widget: any) => ({
        ...widget,
        fullscreen: true,
        maximized: false,
        minimized: false,
      }));
      responseMessage = 'All widgets set to fullscreen.';
    }

    const saved = (await portalSettingRepository.save(settings)) as unknown as UserPortalSettings;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: responseMessage, updatedSettings: saved }),
    };
  } catch (error: any) {
    console.error('AI Agent command error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};

export { handler };

