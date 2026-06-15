import express, { NextFunction, Request, Response } from 'express';
import auth, { AuthRequest } from '../middleware/auth';
import FAQ from '../models/faq';

const router = express.Router();

// Admin middleware
const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await (await import('../models/user')).default.findById(req.user?.id);
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

// GET all FAQs (public - for Flutter app)
router.get('/', async (req: Request, res: Response) => {
  try {
    const faqs = await FAQ.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 });
    
    res.json({
      success: true,
      count: faqs.length,
      faqs
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single FAQ (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    res.json({ success: true, faq });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ADMIN ROUTES (protected)

// GET all FAQs for admin (including inactive)
router.get('/admin/all', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    const faqs = await FAQ.find()
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await FAQ.countDocuments();
    
    res.json({
      success: true,
      faqs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE FAQ (admin)
router.post('/', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { question, answer, category, order } = req.body;
    
    const faq = new FAQ({
      question,
      answer,
      category,
      order
    });
    
    await faq.save();
    
    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      faq
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE FAQ (admin)
router.put('/:id', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { question, answer, category, order, isActive } = req.body;
    
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      { question, answer, category, order, isActive },
      { new: true, runValidators: true }
    );
    
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    res.json({
      success: true,
      message: 'FAQ updated successfully',
      faq
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE FAQ (admin)
router.delete('/:id', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    
    if (!faq) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    
    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// BULK ORDER UPDATE (admin)
router.put('/reorder/bulk', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { orders } = req.body; // Array of { id, order }
    
    const bulkOps = orders.map((item: { id: string; order: number }) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { order: item.order }
      }
    }));
    
    await FAQ.bulkWrite(bulkOps);
    
    res.json({
      success: true,
      message: 'FAQ order updated successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;