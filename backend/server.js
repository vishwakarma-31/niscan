require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const http = require('http');
const path = require('path');

const { errorMiddleware } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/auth.routes');
const policyRoutes = require('./routes/policy.routes');
const { initializeSocket } = require('./config/socket');
const { isMockMode } = require('./config/s3');
const pool = require('./config/db');

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = initializeSocket(server);
app.set('io', io);

// needed for cookies
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/policies', policyRoutes);

// local files for testing without aws
if (isMockMode()) {
  app.use('/api/files', express.static(path.join(__dirname, 'uploads')));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Nicsan CRM API is running', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' });
});

// if there is an error it goes here
app.use(errorMiddleware);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('PostgreSQL connected');

    server.listen(PORT, () => {
      console.log(`Nicsan CRM server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
    console.log('Server starting without database connection. Run migrations and seed first.');
    server.listen(PORT, () => {
      console.log(`Nicsan CRM server running on port ${PORT} (DB not connected)`);
    });
  }
};

startServer();

module.exports = { app, server };
