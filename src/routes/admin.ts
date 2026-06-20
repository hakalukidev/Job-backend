import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; // ✅ যোগ করুন
import auth, { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Question from '../models/question'; // ✅ যোগ করুন

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

// ============== ✅ DASHBOARD ROUTE (যোগ করুন) ==============
router.get('/dashboard', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📊 Dashboard API called');
    
    const users = await User.find({}).select('-password').limit(10).sort({ createdAt: -1 });
    const totalUsers = await User.countDocuments();
    const totalQuestions = await Question.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    const stats = {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalQuestions: totalQuestions || 0,
      totalRevenue: '৳12,57,890',
      userGrowth: 12,
      activeUsersChange: 8,
      totalApplications: 342,
      applicationsGrowth: 15,
      totalViews: 12450,
      viewsChange: 22,
      newJobs: 45,
      pendingApplications: 28,
      totalCompanies: 156,
      averageRating: 4.8
    };
    
    const recentActivities = [
      { 
        id: '1', 
        description: 'নতুন ইউজার যোগ হয়েছে', 
        user: users[0]?.name || 'আহমেদ হাসান', 
        timestamp: '২ মিনিট আগে',
        type: 'user',
        status: 'success'
      },
      { 
        id: '2', 
        description: 'পরীক্ষা সম্পন্ন হয়েছে', 
        user: users[1]?.name || 'সুমাইয়া আক্তার', 
        timestamp: '১৫ মিনিট আগে',
        type: 'exam',
        status: 'success'
      },
      { 
        id: '3', 
        description: 'পেইড সাবস্ক্রিপশন', 
        user: users[2]?.name || 'মোঃ আলী', 
        timestamp: '১ ঘন্টা আগে',
        type: 'payment',
        status: 'success'
      },
    ];
    
    const userList = users.map((u: any) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      status: u.isActive ? 'active' : 'inactive',
      role: u.role
    }));
    
    res.json({
      success: true,
      stats,
      recentActivities,
      users: userList
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to load dashboard' 
    });
  }
});

// ============== USERS ==============
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

// ============== STATS ==============
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

// ============== QUESTIONS ==============
router.get('/questions', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { category, difficulty, limit = 100 } = req.query;
    
    const filter: any = {};
    if (category && category !== 'all') filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    
    const questions = await Question.find(filter).sort({ createdAt: -1 }).limit(Number(limit));
    
    res.json({ success: true, data: questions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/questions/:id', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.json({ success: true, data: question });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/questions/:id', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { text, options, correctOption, explanation, marks, difficulty, category } = req.body;
    
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { text, options, correctOption, explanation, marks, difficulty, category, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    
    res.json({ success: true, data: question });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/questions/:id', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
