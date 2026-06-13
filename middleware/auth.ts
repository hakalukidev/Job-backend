import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.get('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'লগইন প্রয়োজন' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? '');
    if (typeof decoded !== 'object' || decoded === null || !('id' in decoded)) {
      throw new Error('Invalid token payload');
    }
    req.user = { id: (decoded as any).id, email: (decoded as any).email };
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'টোকেন অবৈধ' });
  }
};

export default auth;