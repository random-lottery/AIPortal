import type { Handler } from '@netlify/functions';
import { connectDB, getRepository } from './utils/database';
import { PortalSettingEntity } from '../../entities/PortalSetting';
import { authenticateToken } from './middleware/auth-function';
import type { UserPortalSettings } from '../../src/interfaces/portal';
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
    await connectDB();
    const portalSettingRepository = getRepository(PortalSettingEntity);
    const incoming = JSON.parse(event.body || '{}') as UserPortalSettings;

    let settings = await portalSettingRepository.findOne({ where: { userId } });
    if (!settings) {
      settings = portalSettingRepository.create({
        userId,
        layout: incoming.layout ?? [],
        theme: incoming.theme ?? 'light',
        language: incoming.language ?? 'en',
      });
    } else {
      settings.layout = incoming.layout ?? settings.layout;
      settings.theme = incoming.theme ?? settings.theme;
      settings.language = incoming.language ?? settings.language;
    }

    const saved = await portalSettingRepository.save(settings);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saved),
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

