import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import auth from '../middleware/auth';
import Question from '../models/Question';
import mongoose from 'mongoose';

const router = express.Router();

// ✅ Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pdf-' + uniqueSuffix + '.pdf');
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

// ✅ Upload PDF and extract questions
router.post('/pdf-questions', auth, upload.single('pdfFile'), async (req: any, res: any) => {
  try {
    console.log('📄 PDF Upload request received');
    console.log('📁 File:', req.file);
    console.log('📋 Body:', req.body);

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No PDF file uploaded' 
      });
    }

    const { category, courseId, examId } = req.body;
    
    if (!category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category is required (bcs, bank, primary, job-solution)' 
      });
    }

    // ✅ Read PDF file
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;
    
    console.log('📝 Extracted text length:', text.length);
    console.log('📝 First 300 chars:', text.substring(0, 300));

    // ✅ Extract questions from text
    const questions = extractQuestionsFromText(text, category);
    
    console.log(`✅ Extracted ${questions.length} questions`);

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No questions found in PDF. Please check the format.'
      });
    }

    // ✅ Save questions to database
    const savedQuestions = [];
    for (const q of questions) {
      const questionData: any = {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        marks: q.marks || 1,
        difficulty: q.difficulty || 'medium',
        category: category,
        source: 'pdf',
        sourceFile: req.file.filename,
        isActive: true
      };
      
      if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
        questionData.courseId = new mongoose.Types.ObjectId(courseId);
      }
      
      if (examId && mongoose.Types.ObjectId.isValid(examId)) {
        questionData.examId = new mongoose.Types.ObjectId(examId);
      }
      
      const question = new Question(questionData);
      await question.save();
      savedQuestions.push(question);
    }

    // ✅ Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.warn('Could not delete file:', err);
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${savedQuestions.length} questions from PDF`,
      data: {
        totalQuestions: savedQuestions.length,
        category: category,
        questions: savedQuestions.map((q: any) => ({
          id: q._id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer
        }))
      }
    });

  } catch (error: any) {
    console.error('❌ PDF upload error:', error);
    
    // Clean up file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.warn('Could not delete file:', err);
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process PDF'
    });
  }
});

// ✅ Extract questions from text
function extractQuestionsFromText(text: string, category: string) {
  const questions = [];
  
  // Split by lines and clean
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  let currentQuestion: any = null;
  let currentOptions: string[] = [];
  let currentExplanation = '';
  let isCollectingOptions = false;
  let questionNumber = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line is a question (starts with number and dot)
    const questionMatch = line.match(/^(\d+)\.\s*(.+)$/);
    if (questionMatch) {
      // Save previous question
      if (currentQuestion && currentOptions.length >= 2) {
        // Determine correct answer (first option by default, can be improved)
        questions.push({
          question: currentQuestion,
          options: currentOptions,
          correctAnswer: 0,
          explanation: currentExplanation,
          marks: 1,
          difficulty: 'medium'
        });
      }
      
      // Start new question
      questionNumber = parseInt(questionMatch[1]);
      currentQuestion = questionMatch[2].trim();
      currentOptions = [];
      currentExplanation = '';
      isCollectingOptions = true;
      continue;
    }
    
    // Check for options (ক, খ, গ, ঘ or a, b, c, d or A, B, C, D)
    const optionMatch = line.match(/^([কখগঘa-dA-D]|[০১২৩৪])[.)\s]\s*(.+)$/);
    if (optionMatch && isCollectingOptions) {
      currentOptions.push(optionMatch[2].trim());
      continue;
    }
    
    // Check for explanation
    if (line.toLowerCase().includes('ব্যাখ্যা') || 
        line.toLowerCase().includes('explanation') ||
        line.toLowerCase().includes('উত্তর')) {
      const expMatch = line.replace(/ব্যাখ্যা\s*[:.]\s*/i, '')
                          .replace(/explanation\s*[:.]\s*/i, '')
                          .replace(/উত্তর\s*[:.]\s*/i, '')
                          .trim();
      if (expMatch) {
        currentExplanation = expMatch;
      }
      continue;
    }
    
    // If collecting options and line is not an option, it might be continuation of question
    if (isCollectingOptions && currentOptions.length === 0 && currentQuestion) {
      currentQuestion += ' ' + line;
    }
  }
  
  // Save last question
  if (currentQuestion && currentOptions.length >= 2) {
    questions.push({
      question: currentQuestion,
      options: currentOptions,
      correctAnswer: 0,
      explanation: currentExplanation,
      marks: 1,
      difficulty: 'medium'
    });
  }
  
  return questions;
}

export default router;
