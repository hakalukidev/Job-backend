// server.ts - সম্পূর্ণ ফাইল
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

// ✅ Simple CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// ===== MONGODB =====
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobprostuti';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('🔄 Creating new MongoDB connection...');
    cached.promise = mongoose.connect(MONGODB_URI)
      .then((mongoose) => {
        console.log('✅ MongoDB connected successfully!');
        return mongoose;
      })
      .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// ===== ROUTES =====
app.get('/', (req, res) => {
  res.json({
    message: 'Job Prostuti API Running',
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (req, res) => {
  try {
    await connectDB();
    res.json({
      status: 'ok',
      dbConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      dbConnection: 'failed',
      error: error.message,
    });
  }
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

if (process.env.NODE_ENV !== 'production') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  });
} else {
  connectDB().catch(console.error);
}

export default app;