import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import connectDB from './config/db.js';
import mongoose from 'mongoose';

// Route imports
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import gradeRoutes from './routes/gradeRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import schoolRoutes from "./routes/schoolRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import transferRoutes from "./routes/transferRoutes.js";

dotenv.config();
// Connect to MongoDB
try {
  await connectDB();
  console.log('✅ MongoDB connected successfully');
} catch (error) {
  console.error('❌ MongoDB connection error:', error.message);
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 5001;

// Security Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Request parsing
app.use(express.json({ limit: '10kb' })); // Body limit is 10kb
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Performance Middleware
app.use(compression()); // Compress responses

// Logging
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// API Routes
app.get('/', (req, res) => res.send('✅ API is running successfully...'));

// Auth & User Management
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Academic Management
app.use('/api/courses', courseRoutes);
app.use('/api/grades', gradeRoutes);

// School Management
app.use("/api/schools", schoolRoutes);
app.use("/api/teachers", teacherRoutes);
app.use('/api/students', studentRoutes);

// Transfer Management
app.use("/api/transfer", transferRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  // Log error details
  console.error('🔥 Error Details:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query,
    user: req.user?._id,
    role: req.user?.role,
    errorMessage: err.message,
    errorStack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    errorCode: err.code,
    errorStatus: err.status
  });

  // Determine error status
  const statusCode = err.status || 
    (err.name === 'ValidationError' ? 400 : 
    err.name === 'JsonWebTokenError' ? 401 : 
    err.name === 'TokenExpiredError' ? 401 : 
    res.statusCode === 200 ? 500 : res.statusCode);

  // Send response
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? {
      code: err.code,
      stack: err.stack
    } : undefined
  });

  // Track error metrics
  if (statusCode === 500) {
    // Log critical errors for monitoring
    console.error('⚠️ CRITICAL ERROR:', err);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Start Server
const server = app.listen(port, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
});