"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = __importDefault(require("../middleware/auth"));
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
// Admin middleware
const isAdmin = async (req, res, next) => {
    try {
        const user = await User_1.default.findById(req.user?.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        next();
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// Demo login
router.post('/demo-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('📥 Demo login attempt:', email);
        if (email === 'admin@jobprostuti.com' && password === 'admin123') {
            let admin = await User_1.default.findOne({ email });
            if (!admin) {
                console.log('📝 Creating new admin...');
                // ✅ সরাসরি হ্যাশ করে সেভ করুন (pre-save middleware bypass)
                const salt = await bcryptjs_1.default.genSalt(10);
                const hashedPassword = await bcryptjs_1.default.hash('admin123', salt);
                admin = new User_1.default({
                    name: 'Super Admin',
                    email: 'admin@jobprostuti.com',
                    password: hashedPassword,
                    role: 'admin',
                    isActive: true,
                    isVerified: true,
                    provider: 'local'
                });
                // ✅ সরাসরি save করুন
                await admin.save();
                console.log('✅ Admin created with hashed password');
            }
            const token = jsonwebtoken_1.default.sign({ id: admin._id, email: admin.email, role: admin.role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '30d' });
            console.log('✅ Demo login successful');
            res.json({
                success: true,
                token,
                user: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role
                }
            });
        }
        else {
            console.log('❌ Invalid credentials');
            res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }
    }
    catch (error) {
        console.error('❌ Demo login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Dashboard
router.get('/dashboard', auth_1.default, isAdmin, async (req, res) => {
    try {
        console.log('📊 Dashboard API called');
        const users = await User_1.default.find({}).select('-password').limit(10).sort({ createdAt: -1 });
        const totalUsers = await User_1.default.countDocuments();
        res.json({
            stats: {
                totalUsers: totalUsers,
                totalQuestions: 18450,
                totalRevenue: '৳12,57,890',
            },
            users: users,
            recentActivities: [
                { id: '1', action: 'নতুন ইউজার যোগ হয়েছে', user: users[0]?.name || 'নতুন ইউজার', time: '২ মিনিট আগে' },
                { id: '2', action: 'পরীক্ষা সম্পন্ন হয়েছে', user: users[1]?.name || 'সুমাইয়া আক্তার', time: '১৫ মিনিট আগে' },
                { id: '3', action: 'পেইড সাবস্ক্রিপশন', user: users[2]?.name || 'মোঃ আলী', time: '১ ঘন্টা আগে' },
            ]
        });
    }
    catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Users
router.get('/users', auth_1.default, isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const users = await User_1.default.find().select('-password').skip(skip).limit(limit).sort({ createdAt: -1 });
        const total = await User_1.default.countDocuments();
        res.json({
            success: true,
            users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Stats
router.get('/stats', auth_1.default, isAdmin, async (req, res) => {
    try {
        const totalUsers = await User_1.default.countDocuments();
        const activeUsers = await User_1.default.countDocuments({ isActive: true });
        res.json({
            success: true,
            stats: { totalUsers, activeUsers, totalQuestions: 18450, totalRevenue: '৳12,57,890' }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
