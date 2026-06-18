import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import contentAdminRoutes from './routes/contentAdmin';
import courseRoutes from './routes/courses';
import swaggerRoutes from './routes/swagger';

dotenv.config();

const app = express();

// ===== CORS - সব Allow =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== MONGODB CONNECTION WITH RETRY =====
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobprostuti';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
    });
    console.log('✅ MongoDB connected successfully!');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    console.log('🔄 Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
    return false;
  }
};

// Connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// ===== ROUTES =====
app.get('/', (req, res) => {
  res.json({
    message: 'Job Prostuti API Running',
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    dbConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/content', contentAdminRoutes);
app.use(swaggerRoutes);
app.use('/api', courseRoutes);

// ===== ERROR HANDLING =====
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

// First connect to MongoDB, then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});

export default app;