import type { Handler } from '@netlify/functions';
import { connectDB, getRepository } from './utils/database';
import { PortalSettingEntity } from '../../entities/PortalSetting';
import { UserEntity } from '../../entities/User';
import { authenticateToken } from './middleware/auth-function';
import 'dotenv/config';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
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
    const userRepository = getRepository(UserEntity);

    let settings = await portalSettingRepository.findOne({ where: { userId } });

    if (!settings) {
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'User not found' }),
        };
      }
      settings = portalSettingRepository.create({
        userId: user.id,
        user,
        layout: [],
        theme: 'light',
        language: 'en',
      });
      await portalSettingRepository.save(settings);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
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

