"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = exports.connectDatabase = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const supabase_js_1 = require("@supabase/supabase-js");
const auth_1 = __importDefault(require("./routes/auth"));
const userSettings_1 = __importDefault(require("./routes/userSettings"));
const aiAgent_1 = __importDefault(require("./routes/aiAgent"));
dotenv_1.default.config();
const connectDatabase = async () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be defined in environment variables');
    }
    // Create Supabase client
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    console.log('SUPABASE connected');
};
exports.connectDatabase = connectDatabase;
const createApp = () => {
    const app = (0, express_1.default)();
    const httpServer = (0, http_1.createServer)(app);
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            credentials: true,
        },
    });
    app.set('io', io);
    app.use((0, cors_1.default)({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.use('/api/auth', auth_1.default);
    app.use('/api/user', userSettings_1.default);
    app.use('/api/ai-agent', aiAgent_1.default);
    app.get('/', (_req, res) => {
        res.send('AI Agent Portal Backend is running!');
    });
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);
        socket.on('join-user-room', (userId) => {
            socket.join(userId);
            console.log(`Socket ${socket.id} joined room for user ${userId}`);
        });
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
    return { app, httpServer, io };
};
exports.createApp = createApp;
