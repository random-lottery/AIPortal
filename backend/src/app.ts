import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer, Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createClient } from '@supabase/supabase-js';

import authRouter from './routes/auth';
import userSettingsRouter from './routes/userSettings';
import aiAgentRouter from './routes/aiAgent';

dotenv.config();

export const connectDatabase = async (): Promise<void> => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be defined in environment variables');
  }
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('SUPABASE connected');
};

export const createApp = (): { app: Application; httpServer: HTTPServer; io: SocketIOServer } => {
  const app: Application = express();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  app.set('io', io);

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json());

  app.use('/api/auth', authRouter);
  app.use('/api/user', userSettingsRouter);
  app.use('/api/ai-agent', aiAgentRouter);

  app.get('/', (_req, res) => {
    res.send('AI Agent Portal Backend is running!');
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-user-room', (userId: string) => {
      socket.join(userId);
      console.log(`Socket ${socket.id} joined room for user ${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return { app, httpServer, io };
};
