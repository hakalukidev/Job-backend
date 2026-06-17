import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// ✅更好的做法: JWT payload এর জন্য আলাদা interface তৈরি করুন
interface JwtPayload {
  id?: string;
  userId?: string;
  email: string;
  iat?: number;
  exp?: number;
}

// ✅ Request এ user যোগ করার জন্য interface
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const auth = (req: AuthRequest, res: Response, next: NextFunction): void => {
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
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
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
  } catch (error) {
    // ✅ Better error handling for different JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        success: false, 
        message: 'টোকেন অবৈধ বা মেয়াদোত্তীর্ণ' 
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        success: false, 
        message: 'টোকেনের মেয়াদ শেষ। অনুগ্রহ করে পুনরায় লগইন করুন।' 
      });
    } else {
      console.error('Auth middleware error:', error);
      res.status(401).json({ 
        success: false, 
        message: 'টোকেন যাচাইকরণ ব্যর্থ হয়েছে' 
      });
    }
  }
};

export default auth;
