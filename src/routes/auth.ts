// src/routes/auth.ts
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Login Route
router.post('/google', async (req, res) => {
  try {
    console.log('📥 Google login request received');
    console.log('📦 Request body:', { 
      email: req.body.email, 
      name: req.body.name,
      hasToken: !!req.body.idToken 
    });

    const { email, name, photoUrl, idToken } = req.body;

    // Validate input
    if (!idToken) {
      console.log('❌ Missing ID token');
      return res.status(400).json({ 
        success: false, 
        error: 'ID token is required' 
      });
    }

    if (!email) {
      console.log('❌ Missing email');
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    // Verify Google ID Token
    console.log('🔐 Verifying Google token...');
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      console.log('✅ Google token verified');
    } catch (verifyError: any) {
      console.error('❌ Token verification failed:', verifyError.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid Google token: ' + verifyError.message,
      });
    }

    const payload = ticket.getPayload();
    console.log('👤 Google user payload:', { 
      email: payload?.email, 
      name: payload?.name,
      verified: payload?.email_verified 
    });

    // Check if user exists in MongoDB
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      console.log('📝 Creating new user...');
      user = new User({
        email: email,
        name: name || payload?.name || 'User',
        photoUrl: photoUrl || payload?.picture || '',
        provider: 'google',
        isVerified: payload?.email_verified || true,
        lastLogin: new Date(),
      });
      await user.save();
      console.log('✅ New user created in MongoDB:', email);
    } else {
      // Update existing user
      console.log('🔄 Updating existing user...');
      user.name = name || user.name;
      user.photoUrl = photoUrl || user.photoUrl;
      user.lastLogin = new Date();
      await user.save();
      console.log('✅ User updated in MongoDB:', email);
    }

    // Generate JWT token
    console.log('🔑 Generating JWT token...');
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET || 'default_secret_key_change_me',
      { expiresIn: '7d' }
    );
    console.log('✅ JWT token generated');

    // Return response
    const response = {
      success: true,
      token: token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        photoUrl: user.photoUrl,
        provider: user.provider,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      }
    };
    console.log('📤 Sending response:', { 
      success: true, 
      userId: user._id,
      email: user.email 
    });

    res.json(response);

  } catch (error: any) {
    console.error('❌ Google auth error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// Get user profile (Protected route)
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key_change_me') as any;
    
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, data: user.toPublicJSON() });
  } catch (error: any) {
    console.error('Profile error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;