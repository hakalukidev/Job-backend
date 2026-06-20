"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const course_1 = __importDefault(require("../models/course"));
const courseCategory_1 = __importDefault(require("../models/courseCategory"));
const exam_1 = __importDefault(require("../models/exam"));
const examResult_1 = __importDefault(require("../models/examResult"));
const note_1 = __importDefault(require("../models/note"));
const userHistory_1 = __importDefault(require("../models/userHistory"));
const router = express_1.default.Router();
const toPublicQuestion = (question) => ({
    id: question._id,
    text: question.text,
    imageUrl: question.imageUrl,
    options: question.options,
    optionImages: question.optionImages,
    subject: question.subject,
    topic: question.topic,
    source: question.source,
    examYear: question.examYear,
    difficulty: question.difficulty,
});
const getRequesterUserId = (req) => {
    const authHeader = req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret_key_change_me');
        return decoded.id || decoded.userId;
    }
    if (req.body.userId) {
        return req.body.userId;
    }
    return undefined;
};
router.get('/categories', async (req, res) => {
    try {
        const includeCourses = req.query.includeCourses === 'true';
        const categories = await courseCategory_1.default.find({ isActive: true })
            .sort({ order: 1, createdAt: 1 })
            .lean();
        if (!includeCourses) {
            return res.json({ success: true, data: categories });
        }
        const courses = await course_1.default.find({ isActive: true })
            .sort({ order: 1, createdAt: 1 })
            .lean();
        const data = categories.map((category) => ({
            ...category,
            courses: courses.filter((course) => course.categoryId.toString() === category._id.toString()),
        }));
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.get('/categories/:slug/courses', async (req, res) => {
    try {
        const category = await courseCategory_1.default.findOne({
            slug: req.params.slug,
            isActive: true,
        }).lean();
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        const courses = await course_1.default.find({
            categoryId: category._id,
            isActive: true,
        })
            .sort({ order: 1, createdAt: 1 })
            .lean();
        res.json({ success: true, data: { category, courses } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.get('/courses', async (req, res) => {
    try {
        const query = { isActive: true };
        if (req.query.categoryId)
            query.categoryId = req.query.categoryId;
        if (req.query.status)
            query.status = req.query.status;
        const courses = await course_1.default.find(query)
            .populate('categoryId', 'name slug icon')
            .sort({ order: 1, createdAt: 1 })
            .lean();
        res.json({ success: true, data: courses });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.get('/courses/:slug', async (req, res) => {
    try {
        const course = await course_1.default.findOne({
            slug: req.params.slug,
            isActive: true,
        })
            .populate('categoryId', 'name slug icon')
            .lean();
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        res.json({ success: true, data: course });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.get('/courses/:slug/syllabus', async (req, res) => {
    try {
        const course = await course_1.default.findOne({
            slug: req.params.slug,
            isActive: true,
        }).lean();
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        const notes = await note_1.default.find({
            courseId: course._id,
            isPublished: true,
        })
            .sort({ subject: 1, topic: 1, createdAt: 1 })
            .lean();
        const subjects = notes.reduce((acc, note) => {
            let subject = acc.find((item) => item.subject === (note.subject || 'General'));
            if (!subject) {
                subject = { subject: note.subject || 'General', items: [] };
                acc.push(subject);
            }
            subject.items.push(note);
            return acc;
        }, []);
        res.json({ success: true, data: { course, subjects, items: notes } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.get('/courses/:slug/exams', async (req, res) => {
    try {
        const course = await course_1.default.findOne({
            slug: req.params.slug,
            isActive: true,
        }).lean();
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        const query = { courseId: course._id, isPublished: true };
        if (req.query.type)
            query.type = req.query.type;
        if (req.query.status)
            query.status = req.query.status;
        const exams = await exam_1.default.find(query)
            .select('-questions')
            .sort({ scheduledAt: -1, createdAt: -1 })
            .lean();
        res.json({ success: true, data: { course, exams } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.get('/exams/:id', async (req, res) => {
    try {
        const exam = await exam_1.default.findById(req.params.id)
            .populate('courseId', 'title slug')
            .populate('questions')
            .lean();
        if (!exam || !exam.isPublished) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }
        const questions = exam.questions.map(toPublicQuestion);
        res.json({
            success: true,
            data: {
                ...exam,
                questions,
                questionCount: questions.length,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.post('/exams/:id/submit', async (req, res) => {
    try {
        const { answers = {} } = req.body;
        const userId = getRequesterUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authorization token or userId is required',
            });
        }
        const exam = await exam_1.default.findById(req.params.id).populate('questions');
        if (!exam || !exam.isPublished) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }
        const questions = exam.questions;
        let totalCorrect = 0;
        let totalWrong = 0;
        const subjectWise = {};
        const reviewedQuestions = questions.map((question) => {
            const questionId = question._id.toString();
            const selectedOption = answers[questionId];
            const isCorrect = selectedOption === question.correctOption;
            const subject = question.subject || 'General';
            if (!subjectWise[subject]) {
                subjectWise[subject] = { correct: 0, wrong: 0, total: 0 };
            }
            subjectWise[subject].total += 1;
            if (isCorrect) {
                totalCorrect += 1;
                subjectWise[subject].correct += 1;
            }
            else if (selectedOption) {
                totalWrong += 1;
                subjectWise[subject].wrong += 1;
            }
            return {
                ...toPublicQuestion(question),
                selectedOption,
                correctOption: question.correctOption,
                explanation: question.explanation,
                isCorrect,
            };
        });
        const score = totalCorrect;
        const result = await examResult_1.default.create({
            userId,
            examId: exam._id,
            answers,
            score,
            totalCorrect,
            totalWrong,
            rank: 0,
            percentile: 0,
            subjectWise,
        });
        const rank = (await examResult_1.default.countDocuments({
            examId: exam._id,
            score: { $gt: score },
        })) + 1;
        const totalParticipants = await examResult_1.default.countDocuments({ examId: exam._id });
        const percentile = totalParticipants
            ? Number((((totalParticipants - rank + 1) / totalParticipants) * 100).toFixed(2))
            : 100;
        result.rank = rank;
        result.percentile = percentile;
        await result.save();
        await exam_1.default.findByIdAndUpdate(exam._id, { participantCount: totalParticipants });
        await course_1.default.findByIdAndUpdate(exam.courseId, { $inc: { participantCount: 1 } });
        await userHistory_1.default.create({
            userId,
            type: 'exam',
            refId: exam._id,
            resultId: result._id,
        });
        res.status(201).json({
            success: true,
            data: {
                result,
                summary: {
                    score,
                    totalMarks: exam.totalMarks,
                    totalQuestions: questions.length,
                    totalCorrect,
                    totalWrong,
                    totalSkipped: questions.length - totalCorrect - totalWrong,
                    rank,
                    percentile,
                    subjectWise,
                },
                questions: reviewedQuestions,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.get('/results/:id', async (req, res) => {
    try {
        const result = await examResult_1.default.findById(req.params.id)
            .populate('examId', 'title type totalMarks durationMinutes')
            .populate('userId', 'name email photoUrl')
            .lean();
        if (!result) {
            return res.status(404).json({ success: false, message: 'Result not found' });
        }
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.get('/exams/:id/leaderboard', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const results = await examResult_1.default.find({ examId: req.params.id })
            .populate('userId', 'name photoUrl')
            .sort({ score: -1, submittedAt: 1 })
            .limit(limit)
            .lean();
        res.json({ success: true, data: results });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
