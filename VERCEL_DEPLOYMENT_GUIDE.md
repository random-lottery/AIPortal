# 部署到Vercel的修改指南

## 项目分析

当前项目是一个全栈应用，包含：
1. 前端：Vue 3 + Vite + Vuetify
2. 后端：Node.js + Express + MongoDB
3. 当前部署平台：Netlify（使用Netlify Functions）

## 需要进行的修改

### 1. 安装Vercel CLI
```bash
npm install -g vercel
```

### 2. 修改项目结构以适应Vercel

#### 2.1 创建Vercel配置文件
创建 `vercel.json` 文件在项目根目录：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "backend/src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/src/server.ts"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/dist/index.html"
    }
  ]
}
```

#### 2.2 修改前端构建配置
更新 `frontend/vite.config.ts` 以支持Vercel部署：

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue(), vuetify({ autoImport: true })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
```

#### 2.3 修改后端配置以适应Vercel Serverless
Vercel使用无服务器函数，需要修改后端代码以适应这种模式。

创建新的Vercel适配文件 `backend/src/vercel-app.ts`：

```typescript
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createApp } from './app';

// 创建一个Express应用实例
const app = express();

// 连接数据库
const connectDatabase = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_agent_portal';
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
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
```

#### 2.4 创建Vercel Serverless API路由
在 `api` 目录下创建API路由文件：

创建 `api/auth/register.ts`：
```typescript
import app from '../../backend/src/vercel-app';
export default app;
```

创建 `api/auth/login.ts`：
```typescript
import app from '../../backend/src/vercel-app';
export default app;
```

创建 `api/user/settings.ts`：
```typescript
import app from '../../backend/src/vercel-app';
export default app;
```

创建 `api/ai-agent/command.ts`：
```typescript
import app from '../../backend/src/vercel-app';
export default app;
```

### 3. 环境变量配置

#### 3.1 更新前端环境变量
修改 `frontend/.env.production` 文件：

```env
VITE_API_URL=/api
VITE_SOCKET_URL=[YOUR_VERCEL_DEPLOYMENT_URL]
```

#### 3.2 在Vercel仪表板中设置环境变量
在Vercel项目设置中添加以下环境变量：
- `MONGODB_URI` - 你的MongoDB连接字符串
- `JWT_SECRET` - 用于JWT认证的密钥
- `FRONTEND_URL` - 你的前端URL
- `OPENAI_API_KEY` - 如果使用OpenAI（可选）

### 4. 修改package.json文件

#### 4.1 更新根目录package.json
```json
{
  "name": "aiportal",
  "version": "1.0.0",
  "description": "A full-stack demo portal where users can:",
  "main": "index.js",
  "scripts": {
    "build:functions": "tsc -p tsconfig.json",
    "dev:functions": "netlify dev",
    "vercel-build": "cd frontend && npm install && npm run build",
    "test": "echo \"No tests configured\""
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "@netlify/functions": "^5.1.2",
    "@supabase/supabase-js": "^2.95.3",
    "bcryptjs": "^3.0.3",
    "dotenv": "^17.2.3",
    "jsonwebtoken": "^9.0.3",
    "openai": "^6.18.0",
    "pg": "^8.18.0",
    "reflect-metadata": "^0.2.2",
    "typeorm": "^0.3.28"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^25.2.0",
    "typescript": "^5.9.3"
  }
}
```

#### 4.2 更新前端package.json
```json
{
  "name": "frontend",
  "version": "0.0.0",
  "private": true,
  "description": "This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.",
  "license": "ISC",
  "author": "",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "vercel-build": "npm run build"
  },
  "dependencies": {
    "axios": "^1.13.4",
    "pinia": "^3.0.4",
    "socket.io-client": "^4.8.3",
    "vue": "^3.5.24",
    "vue-router": "^4.6.4",
    "vuetify": "^3.11.8"
  },
  "devDependencies": {
    "@types/node": "^24.10.1",
    "@vitejs/plugin-vue": "^6.0.1",
    "@vue/tsconfig": "^0.8.1",
    "sass": "^1.97.3",
    "typescript": "~5.9.3",
    "vite": "^7.2.4",
    "vite-plugin-vuetify": "^2.1.3",
    "vue-tsc": "^3.1.4"
  }
}
```

### 5. 部署步骤

#### 5.1 初始化Vercel项目
```bash
vercel
```

#### 5.2 部署到Vercel
```bash
vercel --prod
```

### 6. 注意事项

1. **数据库连接**：确保MongoDB URI在Vercel环境中正确配置
2. **环境变量**：所有敏感信息应通过Vercel仪表板设置，不要提交到代码库
3. **WebSocket支持**：Vercel对WebSocket的支持有限，可能需要使用其他解决方案如Pusher或Socket.io的Vercel适配器
4. **文件系统访问**：Vercel无服务器函数不能直接访问文件系统，任何需要文件系统访问的功能都需要重构
5. **长时间运行的进程**：Vercel函数有执行时间限制，长时间运行的任务需要使用其他服务

### 7. 替代方案

如果遇到部署问题，可以考虑以下替代方案：
1. 将前端和后端分别部署到不同的Vercel项目
2. 使用Vercel Functions处理API请求，保持后端逻辑无服务器化
3. 使用外部数据库服务如MongoDB Atlas
4. 使用Vercel Edge Functions处理实时通信需求