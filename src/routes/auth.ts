import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import auth from '../middleware/auth';

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'ইমেইল আগে থেকেই আছে' 
      });
    }
    
    // Create new user
    const user = new User({ name, email, password });
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      process.env.JWT_SECRET || 'default_secret_key', 
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      success: true, 
      token, 
      user: { id: user._id, name, email } 
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'ইমেইল বা পাসওয়ার্ড ভুল' 
      });
    }
    
    // Check password - ব্যবহার করুন comparePassword, matchPassword না
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'ইমেইল বা পাসওয়ার্ড ভুল' 
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      process.env.JWT_SECRET || 'default_secret_key', 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      token, 
      user: { id: user._id, name: user.name, email: user.email } 
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

router.post('/social-login', async (req: Request, res: Response) => {
  try {
    const { email, name, provider, providerId, photoURL } = req.body;
    
    let user = await User.findOne({ 
      $or: [{ email }, { providerId }] 
    });
    
    if (!user) {
      user = new User({ 
        name: name || email.split('@')[0], 
        email, 
        provider, 
        providerId, 
        avatar: photoURL,  // avatar ফিল্ড ব্যবহার করুন photoURL এর পরিবর্তে
        password: Math.random().toString(36),
        isActive: true
      });
      await user.save();
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      process.env.JWT_SECRET || 'default_secret_key', 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        avatar: user.avatar 
      } 
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

router.get('/me', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

export default router;