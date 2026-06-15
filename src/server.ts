import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection with increased timeouts
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobprostuti';

console.log('📡 Connecting to MongoDB Atlas...');
console.log('🔗 Trying to connect...');

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 60000,      // 60 seconds
  connectTimeoutMS: 60000,               // 60 seconds
  socketTimeoutMS: 60000,                // 60 seconds
  heartbeatFrequencyMS: 10000,           // 10 seconds
  retryWrites: true,
  retryReads: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
  console.log('📊 Database:', mongoose.connection.db.databaseName);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('🔧 Full error:', err);
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: '🚀 Job Prostuti API Running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;