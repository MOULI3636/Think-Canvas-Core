const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const defaultClientOrigin = 'http://localhost:3000';
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || defaultClientOrigin)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOriginValidator = (origin, callback) => {
  // Allow non-browser clients and server-to-server requests.
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  return callback(new Error(`CORS blocked for origin: ${origin}`), false);
};

const isProduction = process.env.NODE_ENV === 'production';

const io = socketIo(server, {
  cors: {
    origin: corsOriginValidator,
    credentials: true
  },
  maxHttpBufferSize: 15 * 1024 * 1024
});

// Middleware
app.use(cors({
  origin: corsOriginValidator,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.set("trust proxy", 1);
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thinkcanvas')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Passport config
require('./config/passport')(passport);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/whiteboard', require('./routes/whiteboardRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Socket.io
require('./socket/socketManager')(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
