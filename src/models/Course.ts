import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  categoryId: mongoose.Types.ObjectId;
  thumbnailUrl?: string;
  bannerUrl?: string;
  price: number;
  isFree: boolean;
  durationLabel: string;
  status: 'upcoming' | 'running' | 'completed';
  totalExams: number;
  participantCount: number;
  tabs: string[];
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    thumbnailUrl: { type: String },
    bannerUrl: { type: String },
    price: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    durationLabel: { type: String },
    status: { 
      type: String, 
      enum: ['upcoming', 'running', 'completed'], 
      default: 'upcoming' 
    },
    totalExams: { type: Number, default: 0 },
    participantCount: { type: Number, default: 0 },
    tabs: { type: [String], default: ['exams', 'syllabus', 'notes', 'results'] },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

const Course = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
export default Course;
