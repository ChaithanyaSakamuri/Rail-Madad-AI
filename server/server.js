import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import complaintsRoutes from './routes/complaints.js';
import analyticsRoutes from './routes/analytics.js';
import { initSocket } from './socket/socketHandler.js';
import { initEscalationCron } from './cron/escalationCron.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Connect to MongoDB Atlas
await connectDB();

// Initialize Socket.io
initSocket(server);

// Start SLA Auto-Escalation Engine
initEscalationCron();

// Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) 
  : '*';

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Serve static uploaded files (evidence images)
app.use('/uploads', express.static(path.resolve('uploads')));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ message: 'Rail Madad AI Server is running', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = parseInt(process.env.PORT, 10) || 5002;

const startServer = (port) => {
  server.listen(port, () => {
    console.log(`✨ Rail Madad AI Backend running on port ${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1);
      return;
    }
    console.error(err);
    process.exit(1);
  });
};

startServer(PORT);
