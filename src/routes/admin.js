"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/admin.ts
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = __importDefault(require("../middleware/auth"));
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
// Admin middleware (check if user is admin)
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
// Login with demo admin
router.post('/demo-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Demo admin credentials check
        if (email === 'admin@jobprostuti.com' && password === 'admin123') {
            // Check if admin exists, if not create
            let admin = await User_1.default.findOne({ email });
            if (!admin) {
                admin = new User_1.default({
                    name: 'Super Admin',
                    email: 'admin@jobprostuti.com',
                    password: 'admin123',
                    role: 'admin',
                    isActive: true
                });
                await admin.save();
            }
            const token = jsonwebtoken_1.default.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '30d' });
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
            res.status(401).json({
                success: false,
                message: 'Invalid admin credentials'
            });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Get all users with pagination
router.get('/users', auth_1.default, isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const users = await User_1.default.find()
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        const total = await User_1.default.countDocuments();
        res.json({
            success: true,
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Get user statistics
router.get('/stats', auth_1.default, isAdmin, async (req, res) => {
    try {
        const totalUsers = await User_1.default.countDocuments();
        const activeUsers = await User_1.default.countDocuments({ isActive: true });
        const adminUsers = await User_1.default.countDocuments({ role: 'admin' });
        const todayUsers = await User_1.default.countDocuments({
            createdAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
        });
        // Last 7 days user registration
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            const count = await User_1.default.countDocuments({
                createdAt: {
                    $gte: date,
                    $lt: nextDate
                }
            });
            last7Days.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count
            });
        }
        res.json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                adminUsers,
                todayUsers,
                last7DaysRegistration: last7Days
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Update user (active/inactive, role)
router.put('/users/:id', auth_1.default, isAdmin, async (req, res) => {
    try {
        const { isActive, role } = req.body;
        const updates = {};
        if (typeof isActive !== 'undefined')
            updates.isActive = isActive;
        if (role && ['user', 'admin'].includes(role))
            updates.role = role;
        const user = await User_1.default.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after' }).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Delete user
router.delete('/users/:id', auth_1.default, isAdmin, async (req, res) => {
    try {
        const user = await User_1.default.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, message: 'User deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Create new user (admin)
router.post('/users', auth_1.default, isAdmin, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existing = await User_1.default.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        const user = new User_1.default({
            name,
            email,
            password,
            role: role || 'user'
        });
        await user.save();
        res.status(201).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Get system logs (optional)
router.get('/logs', auth_1.default, isAdmin, async (req, res) => {
    try {
        // You can implement logging system here
        res.json({
            success: true,
            message: 'Logs feature coming soon'
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
