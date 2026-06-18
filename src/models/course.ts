import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  categoryId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  status: 'running' | 'upcoming' | 'archived';
  durationLabel?: string;
  totalExams: number;
  participantCount: number;
  isFree: boolean;
  price: number;
  tabs: string[];
  isActive: boolean;
  order: number;
}

const courseSchema = new Schema<ICourse>({
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'CourseCategory',
    required: [true, 'ক্যাটাগরি আবশ্যক']
  },
  title: {
    type: String,
    required: [true, 'কোর্সের নাম আবশ্যক'],
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: String,
  thumbnailUrl: String,
  bannerUrl: String,
  status: {
    type: String,
    enum: ['running', 'upcoming', 'archived'],
    default: 'running'
  },
  durationLabel: String,
  totalExams: {
    type: Number,
    default: 0
  },
  participantCount: {
    type: Number,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: true
  },
  price: {
    type: Number,
    default: 0
  },
  tabs: [{
    type: String,
    enum: ['lectures', 'exams', 'syllabus', 'notes', 'quizzes', 'results']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model<ICourse>('Course', courseSchema);
