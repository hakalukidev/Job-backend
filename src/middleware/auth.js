"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// ✅ async/await ব্যবহার করুন
const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        console.log('🔐 Auth header:', authHeader ? 'Present' : 'Missing');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'লগইন প্রয়োজন। টোকেন পাওয়া যায়নি।'
            });
            return;
        }
        const token = authHeader.replace('Bearer ', '');
        const jwtSecret = process.env.JWT_SECRET || 'default_secret';
        console.log('🔑 Token received:', token.substring(0, 20) + '...');
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        console.log('✅ Token decoded:', decoded);
        req.user = {
            id: decoded.id || decoded.userId,
            email: decoded.email,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        console.error('❌ Auth error:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: 'টোকেন অবৈধ বা মেয়াদোত্তীর্ণ'
            });
        }
        else {
            res.status(401).json({
                success: false,
                message: 'টোকেন যাচাইকরণ ব্যর্থ হয়েছে'
            });
        }
    }
};
exports.default = auth;
