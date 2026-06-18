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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection with increased timeouts
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobprostuti';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 60000,   
  connectTimeoutMS: 60000,              
  socketTimeoutMS: 60000,                
  heartbeatFrequencyMS: 10000,        
  retryWrites: true,
  retryReads: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('🔧 Full error:', err);
});

// Routes
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

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
