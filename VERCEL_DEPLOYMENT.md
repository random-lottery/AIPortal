# 部署到Vercel

## 项目结构

本项目已配置为支持Vercel部署，结构如下：
- 前端：Vue 3 + Vite 应用，构建后部署到Vercel的静态文件服务
- 后端：Node.js + Express 应用，通过Vercel Serverless Functions运行

## 部署步骤

### 1. 安装Vercel CLI（可选）
```bash
npm install -g vercel
```

### 2. 部署到Vercel

#### 方法一：使用Vercel CLI
```bash
# 首次部署
vercel

# 部署到生产环境
vercel --prod
```

#### 方法二：通过GitHub集成
1. 访问[Vercel官网](https://vercel.com/)
2. 使用GitHub账号登录
3. 导入此项目仓库
4. 配置环境变量（见下文）
5. 点击部署

## 环境变量配置

在Vercel项目设置中添加以下环境变量：

### 数据库相关
- `SUPABASE_URL` - Supabase项目URL
- `SUPABASE_SERVICE_KEY` - Supabase服务密钥

### 认证相关
- `JWT_SECRET` - JWT密钥
- `FRONTEND_URL` - 前端URL（例如：https://your-app.vercel.app）

### 其他（可选）
- `OPENAI_API_KEY` - 如果使用OpenAI服务

## 注意事项

1. **WebSocket支持**：Vercel对WebSocket的支持有限，实时通信功能可能需要使用其他解决方案
2. **文件系统访问**：Vercel无服务器函数不能直接访问文件系统
3. **执行时间限制**：Vercel函数有执行时间限制，长时间运行的任务需要使用其他服务

## 项目结构说明

- `vercel.json` - Vercel配置文件
- `api/` - Vercel Serverless Functions目录
- `backend/src/vercel-app.ts` - Vercel适配的后端应用
- `frontend/.env.production` - 前端生产环境变量配置