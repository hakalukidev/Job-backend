// src/middleware/auth.ts
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const auth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false, 
        message: 'লগইন প্রয়োজন। টোকেন পাওয়া যায়নি।' 
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined');
      res.status(500).json({ 
        success: false, 
        message: 'সার্ভার কনফিগারেশন ত্রুটি' 
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    req.user = {
      id: decoded.userId || decoded.id,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        success: false, 
        message: 'টোকেন অবৈধ বা মেয়াদোত্তীর্ণ' 
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