import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  categoryId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
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
    enum: ['lectures', 'exams', 'notes', 'quizzes']
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