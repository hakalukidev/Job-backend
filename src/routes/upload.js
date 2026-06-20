"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const auth_1 = __importDefault(require("../middleware/auth"));
const Question_1 = __importDefault(require("../models/Question"));
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
// ✅ Storage configuration
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'uploads');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'pdf-' + uniqueSuffix + '.pdf');
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    }
    else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: fileFilter
});
// ✅ Upload PDF and extract questions
router.post('/pdf-questions', auth_1.default, upload.single('pdfFile'), async (req, res) => {
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
        const pdfBuffer = fs_1.default.readFileSync(req.file.path);
        const pdfData = await (0, pdf_parse_1.default)(pdfBuffer);
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
            const questionData = {
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
            if (courseId && mongoose_1.default.Types.ObjectId.isValid(courseId)) {
                questionData.courseId = new mongoose_1.default.Types.ObjectId(courseId);
            }
            if (examId && mongoose_1.default.Types.ObjectId.isValid(examId)) {
                questionData.examId = new mongoose_1.default.Types.ObjectId(examId);
            }
            const question = new Question_1.default(questionData);
            await question.save();
            savedQuestions.push(question);
        }
        // ✅ Clean up uploaded file
        try {
            fs_1.default.unlinkSync(req.file.path);
        }
        catch (err) {
            console.warn('Could not delete file:', err);
        }
        res.json({
            success: true,
            message: `Successfully uploaded ${savedQuestions.length} questions from PDF`,
            data: {
                totalQuestions: savedQuestions.length,
                category: category,
                questions: savedQuestions.map((q) => ({
                    id: q._id,
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer
                }))
            }
        });
    }
    catch (error) {
        console.error('❌ PDF upload error:', error);
        // Clean up file if exists
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            try {
                fs_1.default.unlinkSync(req.file.path);
            }
            catch (err) {
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
function extractQuestionsFromText(text, category) {
    const questions = [];
    // Split by lines and clean
    const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    let currentQuestion = null;
    let currentOptions = [];
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
exports.default = router;
