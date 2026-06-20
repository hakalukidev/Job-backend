import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import auth, { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Question from '../models/Question';

const router = express.Router();

// Admin middleware
const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Demo login
router.post('/demo-login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log('📥 Demo login attempt:', email);
    
    if (email === 'admin@jobprostuti.com' && password === 'admin123') {
      let admin = await User.findOne({ email });
      
      if (!admin) {
        console.log('📝 Creating new admin...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        admin = new User({
          name: 'Super Admin',
          email: 'admin@jobprostuti.com',
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          isVerified: true,
          provider: 'local'
        });
        await admin.save();
        console.log('✅ Admin created');
      }
      
      const token = jwt.sign(
        { id: admin._id, email: admin.email, role: admin.role },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '30d' }
      );
      
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
    } else {
      console.log('❌ Invalid credentials');
      res.status(401).json({ 
        success: false, 
        message: 'Invalid admin credentials' 
      });
    }
  } catch (error: any) {
    console.error('❌ Demo login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dashboard
router.get('/dashboard', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📊 Dashboard API called');
    
    const users = await User.find({}).select('-password').limit(10).sort({ createdAt: -1 });
    const totalUsers = await User.countDocuments();
    const totalQuestions = await Question.countDocuments();
    
    res.json({
      stats: {
        totalUsers: totalUsers,
        totalQuestions: totalQuestions || 18450,
        totalRevenue: '৳12,57,890',
      },
      users: users,
      recentActivities: [
        { id: '1', action: 'নতুন ইউজার যোগ হয়েছে', user: users[0]?.name || 'নতুন ইউজার', time: '২ মিনিট আগে' },
        { id: '2', action: 'পরীক্ষা সম্পন্ন হয়েছে', user: users[1]?.name || 'সুমাইয়া আক্তার', time: '১৫ মিনিট আগে' },
        { id: '3', action: 'পেইড সাবস্ক্রিপশন', user: users[2]?.name || 'মোঃ আলী', time: '১ ঘন্টা আগে' },
      ]
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Users
router.get('/users', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const users = await User.find().select('-password').skip(skip).limit(limit).sort({ createdAt: -1 });
    const total = await User.countDocuments();
    
    res.json({
      success: true,
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Stats
router.get('/stats', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalQuestions = await Question.countDocuments();
    
    res.json({
      success: true,
      stats: { 
        totalUsers, 
        activeUsers, 
        totalQuestions: totalQuestions || 18450, 
        totalRevenue: '৳12,57,890' 
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============== QUESTIONS MANAGEMENT ==============

// Get all questions with filters
router.get('/questions', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { category, difficulty, limit = 100 } = req.query;
    
    const filter: any = {};
    if (category && category !== 'all') filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    
    const questions = await Question.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    
    res.json({
      success: true,
      data: questions
    });
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch questions'
    });
  }
});

// Get single question
router.get('/questions/:id', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    res.json({
      success: true,
      data: question
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch question'
    });
  }
});

// Update question
router.put('/questions/:id', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { text, options, correctOption, explanation, marks, difficulty, category } = req.body;
    
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      {
        text,
        options,
        correctOption,
        explanation,
        marks,
        difficulty,
        category,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    res.json({
      success: true,
      data: question
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update question'
    });
  }
});

// Delete question
router.delete('/questions/:id', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete question'
    });
  }
});

export default router;
