const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');
const dns = require('dns');

// Set public DNS servers to resolve MongoDB Atlas SRV connection strings reliably
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const { initSockets } = require('./sockets/socketHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const caseRoutes = require('./routes/caseRoutes');
const hearingRoutes = require('./routes/hearingRoutes');
const documentRoutes = require('./routes/documentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Connect to Database
connectDB();

// Socket.IO Setup
const io = socketio(server, {
  cors: {
    origin: '*', // Allow all origins for testing/development
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});
initSockets(io);

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow static file resource fetching across origins
}));
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support base64 e-signatures uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiter to all API requests
app.use('/api', apiLimiter);

// Serve uploads folder as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/hearings', hearingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the CourtConnect API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error stack:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`CourtConnect Backend running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
