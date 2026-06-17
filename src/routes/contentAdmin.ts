import express, { NextFunction, Response } from 'express';
import auth, { AuthRequest } from '../middleware/auth';
import Course from '../models/course';
import CourseCategory from '../models/courseCategory';
import Exam from '../models/exam';
import Note from '../models/note';
import Question from '../models/question';
import User from '../models/User';

const router = express.Router();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.use(auth, isAdmin);

router.post('/categories', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      slug: req.body.slug || slugify(req.body.name),
    };
    const category = await CourseCategory.create(payload);
    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const category = await CourseCategory.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });
    res.json({ success: true, data: category });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/courses', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      slug: req.body.slug || slugify(req.body.title),
    };
    const course = await Course.create(payload);
    res.status(201).json({ success: true, data: course });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });
    res.json({ success: true, data: course });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/questions', async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json({ success: true, data: question });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/courses/:courseId/notes', async (req, res) => {
  try {
    const note = await Note.create({
      ...req.body,
      courseId: req.params.courseId,
    });
    res.status(201).json({ success: true, data: note });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/exams', async (req, res) => {
  try {
    const exam = await Exam.create(req.body);
    await Course.findByIdAndUpdate(req.body.courseId, {
      $inc: { totalExams: 1 },
    });
    res.status(201).json({ success: true, data: exam });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/exams/:id', async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });
    res.json({ success: true, data: exam });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
