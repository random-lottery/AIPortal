import type { Handler } from '@netlify/functions';
import { connectDB, getRepository } from './utils/database';
import { UserEntity } from '../../entities/User';
import 'dotenv/config';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    await connectDB();
    const { username, email, password } = JSON.parse(event.body || '{}');

    if (!username || !email || !password) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'All fields are required' }),
      };
    }

    const userRepository = getRepository(UserEntity);
    const existingUser = await userRepository.findOne({ where: [{ username }, { email }] as any });
    if (existingUser) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Username or email already exists' }),
      };
    }

    const user = userRepository.create({ username, email, password });
    await userRepository.save(user);

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'User registered successfully' }),
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};

export { handler };

