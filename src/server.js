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
// ===== CORS - সব Allow =====
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ===== MONGODB CONNECTION WITH RETRY =====
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobprostuti';
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            retryReads: true,
        });
        console.log('✅ MongoDB connected successfully!');
        return true;
    }
    catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        console.log('🔄 Retrying in 5 seconds...');
        setTimeout(connectDB, 5000);
        return false;
    }
};
// Connection events
mongoose_1.default.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
});
mongoose_1.default.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});
mongoose_1.default.connection.on('disconnected', () => {
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
        dbConnection: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
    });
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
// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
// First connect to MongoDB, then start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
});
exports.default = app;
