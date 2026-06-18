"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const admin_1 = __importDefault(require("./routes/admin"));
const auth_1 = __importDefault(require("./routes/auth"));
const contentAdmin_1 = __importDefault(require("./routes/contentAdmin"));
const courses_1 = __importDefault(require("./routes/courses"));
const swagger_1 = __importDefault(require("./routes/swagger"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// ===== CORS =====
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Length', 'X-Kuma-Revision'],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false,
};
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Logging
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path}`);
    console.log('🌍 Origin:', req.headers.origin);
    next();
});
// ===== MONGODB CONNECTION (Serverless Optimized) =====
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobprostuti';
// Global cache for MongoDB connection (important for Serverless)
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
        const opts = {
            serverSelectionTimeoutMS: 30000,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            retryReads: true,
            maxPoolSize: 10,
            minPoolSize: 2,
        };
        cached.promise = mongoose_1.default.connect(MONGODB_URI, opts)
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
            dbConnection: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            dbConnection: 'failed',
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});
app.use('/api/auth', auth_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/admin/content', contentAdmin_1.default);
app.use(swagger_1.default);
app.use('/api', courses_1.default);
// ===== ERROR HANDLING =====
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});
// ===== START SERVER (Local Only) =====
const PORT = process.env.PORT || 5000;
// Only start server if not in production (Vercel)
if (process.env.NODE_ENV !== 'production') {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    });
}
else {
    // For Vercel - connect to DB but don't start server
    connectDB().catch(console.error);
}
// ===== EXPORT FOR VERCEL =====
exports.default = app;
