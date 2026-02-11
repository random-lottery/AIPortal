import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { createApp } from './app';

// 创建一个Express应用实例
const app = express();

// 连接数据库
const connectDatabase = async (): Promise<void> => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be defined in environment variables');
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('SUPABASE connected');
  } catch (error) {
    console.error('SUPABASE connection error:', error);
  }
};

// 初始化数据库连接
connectDatabase().catch(console.error);

// 应用中间件和路由
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// 导入路由
import authRouter from './routes/auth';
import userSettingsRouter from './routes/userSettings';
import aiAgentRouter from './routes/aiAgent';

app.use('/api/auth', authRouter);
app.use('/api/user', userSettingsRouter);
app.use('/api/ai-agent', aiAgentRouter);

app.get('/', (_req, res) => {
  res.send('AI Agent Portal Backend is running on Vercel!');
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });

});

export default app;
export const config = {
  api: {
    bodyParser: true,
  },
};