import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const router = express.Router();
console.log('🚀 AUTH ROUTE LOADED');

router.post('/login', async (req, res) => {
  console.log('🔥 LOGIN REQUEST:', req.body);
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ error: 'invalid credentials' });
    }
    
    console.log('👤 User found:', email);
    
    const isValid = await bcrypt.compare(password, user.password);
    console.log('✅ Password valid:', isValid);
    
    if (!isValid) {
      return res.status(401).json({ error: 'invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    console.log('✅ LOGIN SUCCESS');
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/test', (req, res) => {
  res.json({ message: 'Auth working!' });
});

export default router;
