import mongoose, { Schema, Document } from 'mongoose';

export interface IExam extends Document {
  title: string;
  slug: string;
  description?: string;
  courseId: mongoose.Types.ObjectId;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  isActive: boolean;
  isFree: boolean;
  status: 'draft' | 'published' | 'completed';
  examDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    duration: { type: Number, default: 60 },
    totalMarks: { type: Number, default: 100 },
    passingMarks: { type: Number, default: 40 },
    isActive: { type: Boolean, default: true },
    isFree: { type: Boolean, default: false },
    status: { 
      type: String, 
      enum: ['draft', 'published', 'completed'], 
      default: 'draft' 
    },
    examDate: { type: Date }
  },
  {
    timestamps: true
  }
);

const Exam = mongoose.models.Exam || mongoose.model<IExam>('Exam', ExamSchema);
export default Exam;
