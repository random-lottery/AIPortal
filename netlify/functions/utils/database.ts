import 'reflect-metadata';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from '../../../entities/User';
import { PortalSettingEntity } from '../../../entities/PortalSetting';
import 'dotenv/config';

let AppDataSource: DataSource | null = null;

export const connectDB = async (): Promise<void> => {
  if (AppDataSource && AppDataSource.isInitialized) {
    return;
  }

  AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    synchronize: process.env.TYPEORM_SYNC === 'true',
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : false,
    entities: [UserEntity, PortalSettingEntity],
  });

  try {
    await AppDataSource.initialize();
    console.log('PostgreSQL DataSource initialized successfully.');
  } catch (error) {
    console.error('Error during DataSource initialization:', error);
    throw error;
  }
};

export const getRepository = <T>(entity: new () => T): Repository<T> => {
  if (!AppDataSource || !AppDataSource.isInitialized) {
    throw new Error('DataSource is not initialized. Call connectDB first.');
  }
  return AppDataSource.getRepository(entity);
};

