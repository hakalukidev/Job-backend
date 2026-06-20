import express from 'express';
import auth from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import Question from '../models/Question';
// Category, Course, Exam models এখনো প্রয়োজন নেই, কিন্তু পরে যোগ করা যাবে

const router = express.Router();

// ===== QUESTIONS =====
router.post('/questions', auth, async (req: AuthRequest, res: any) => {
  try {
    const { text, options, correctOption, explanation, marks, difficulty, category, courseId, examId } = req.body;
    
    console.log('📝 Creating question:', { text, category });
    
    const question = new Question({
      text,
      options,
      correctOption,
      explanation,
      marks: marks || 1,
      difficulty: difficulty || 'medium',
      category,
      courseId,
      examId,
      source: 'manual',
      isActive: true
    });
    
    await question.save();
    console.log('✅ Question created:', question._id);
    
    res.status(201).json({ 
      success: true, 
      data: question,
      message: 'Question created successfully'
    });
  } catch (error: any) {
    console.error('❌ Error creating question:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create question' 
    });
  }
});

export default router;
