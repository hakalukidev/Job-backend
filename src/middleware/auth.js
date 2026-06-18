"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth = (req, res, next) => {
    try {
        // ✅ Token extraction - more robust
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'লগইন প্রয়োজন। টোকেন পাওয়া যায়নি।'
            });
            return;
        }
        const token = authHeader.replace('Bearer ', '');
        // ✅ Check if JWT_SECRET exists
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET is not defined in environment variables');
            res.status(500).json({
                success: false,
                message: 'সার্ভার কনফিগারেশন ত্রুটি'
            });
            return;
        }
        // ✅ Verify token with proper typing
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        // ✅ Validate decoded payload
        const userId = decoded.id || decoded.userId;
        if (!userId || !decoded.email) {
            res.status(401).json({
                success: false,
                message: 'টোকেন অবৈধ: প্রয়োজনীয় তথ্য নেই'
            });
            return;
        }
        // ✅ Attach user to request
        req.user = {
            id: userId,
            email: decoded.email
        };
        next();
    }
    catch (error) {
        // ✅ Better error handling for different JWT errors
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: 'টোকেন অবৈধ বা মেয়াদোত্তীর্ণ'
            });
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'টোকেনের মেয়াদ শেষ। অনুগ্রহ করে পুনরায় লগইন করুন।'
            });
        }
        else {
            console.error('Auth middleware error:', error);
            res.status(401).json({
                success: false,
                message: 'টোকেন যাচাইকরণ ব্যর্থ হয়েছে'
            });
        }
    }
};
exports.default = auth;
