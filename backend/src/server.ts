import dotenv from 'dotenv';
import { createApp, connectDatabase } from './app';

dotenv.config();

const PORT = process.env.PORT || 3000;

const bootstrap = async () => {
  try {
    await connectDatabase();
    const { httpServer } = createApp();
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

bootstrap();
