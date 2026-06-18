"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middleware/auth"));
const course_1 = __importDefault(require("../models/course"));
const courseCategory_1 = __importDefault(require("../models/courseCategory"));
const exam_1 = __importDefault(require("../models/exam"));
const note_1 = __importDefault(require("../models/note"));
const question_1 = __importDefault(require("../models/question"));
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
const slugify = (value) => value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const isAdmin = async (req, res, next) => {
    try {
        const user = await User_1.default.findById(req.user?.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        next();
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
router.use(auth_1.default, isAdmin);
router.post('/categories', async (req, res) => {
    try {
        const payload = {
            ...req.body,
            slug: req.body.slug || slugify(req.body.name),
        };
        const category = await courseCategory_1.default.create(payload);
        res.status(201).json({ success: true, data: category });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
router.put('/categories/:id', async (req, res) => {
    try {
        const category = await courseCategory_1.default.findByIdAndUpdate(req.params.id, req.body, {
            returnDocument: 'after',
            runValidators: true,
        });
        res.json({ success: true, data: category });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
router.post('/courses', async (req, res) => {
    try {
        const payload = {
            ...req.body,
            slug: req.body.slug || slugify(req.body.title),
        };
        const course = await course_1.default.create(payload);
        res.status(201).json({ success: true, data: course });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
router.put('/courses/:id', async (req, res) => {
    try {
        const course = await course_1.default.findByIdAndUpdate(req.params.id, req.body, {
            returnDocument: 'after',
            runValidators: true,
        });
        res.json({ success: true, data: course });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
router.post('/questions', async (req, res) => {
    try {
        const question = await question_1.default.create(req.body);
        res.status(201).json({ success: true, data: question });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
router.post('/courses/:courseId/notes', async (req, res) => {
    try {
        const note = await note_1.default.create({
            ...req.body,
            courseId: req.params.courseId,
        });
        res.status(201).json({ success: true, data: note });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
router.post('/exams', async (req, res) => {
    try {
        const exam = await exam_1.default.create(req.body);
        await course_1.default.findByIdAndUpdate(req.body.courseId, {
            $inc: { totalExams: 1 },
        });
        res.status(201).json({ success: true, data: exam });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
router.put('/exams/:id', async (req, res) => {
    try {
        const exam = await exam_1.default.findByIdAndUpdate(req.params.id, req.body, {
            returnDocument: 'after',
            runValidators: true,
        });
        res.json({ success: true, data: exam });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
exports.default = router;
